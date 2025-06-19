import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Wallet } from 'ethers';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Set up multer storage for verification documents
const verificationStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../storage/verification-documents'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
export const uploadVerificationDocument = multer({ storage: verificationStorage });

export async function register(req: Request, res: Response) {
  try {
    const { firstName, lastName, email, password, confirmPassword, phoneNumber, idNumber, acceptTerms, role, verificationDocumentType } = req.body;
    const file = (req as any).file;
    if (!firstName || !lastName || !email || !password || !confirmPassword || !phoneNumber || !idNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Validate National ID format
    const idNumberRegex = /^\d{4}-\d{14}-\d{3}$/;
    if (!idNumberRegex.test(idNumber)) {
        return res.status(400).json({ error: 'Invalid National ID number format. Expected format: YYYY-##############-###' });
    }

    // Validate Phone Number format
    const phoneRegex = /^\+?\d{10,15}$/;
    if(!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ error: 'Invalid phone number format. Please enter a valid phone number with country code.' });
    }

    // Enforce strong password policy
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: 'Password is not strong enough. It must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.' 
      });
    }
    if (!acceptTerms) {
      return res.status(400).json({ error: 'You must accept the terms and conditions' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    let userRole = (role && typeof role === 'string') ? role.toLowerCase() : 'artist';
    if (userRole === 'admin') {
      return res.status(400).json({ error: 'Cannot register admin users via this endpoint.' });
    }
    if (!['artist', 'licensee'].includes(userRole)) {
      return res.status(400).json({ error: 'Invalid role. Must be either "artist" or "licensee".' });
    }

    // For artist, verification document and type are required
    let verificationDocumentUrl = null;
    let vDocType = null;
    if (userRole === 'artist') {
      if (!verificationDocumentType || !['passport','national_id','driving_license'].includes(verificationDocumentType)) {
        return res.status(400).json({ error: 'Verification document type is required and must be one of passport, national_id, driving_license.' });
      }
      if (!file) {
        return res.status(400).json({ error: 'Verification document file is required for artist registration.' });
      }
      vDocType = verificationDocumentType;
      verificationDocumentUrl = `/storage/verification-documents/${file.filename}`;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Default values for wallet and verification
    let walletAddress = null;
    let isVerified = false;
    if (userRole === 'licensee') {
      // Licensee: generate wallet, set isVerified true
      try {
        const wallet = Wallet.createRandom();
        walletAddress = wallet && wallet.address ? wallet.address : null;
      } catch (walletErr) {
        return res.status(500).json({ error: 'Failed to generate wallet address for licensee.' });
      }
      if (!walletAddress) {
        return res.status(500).json({ error: 'Failed to generate wallet address for licensee.' });
      }
      isVerified = true;
    } else if (userRole === 'artist') {
      // Artist: always set isVerified to false explicitly
      isVerified = false;
      walletAddress = null;
    }


    const user = await User.create({
      id: uuidv4(),
      firstName,
      lastName,
      email,
      passwordHash,
      phoneNumber,
      idNumber,
      role: userRole as 'admin' | 'artist' | 'licensee',
      isVerified,
      walletAddress,
      status: 'active',
      verificationDocumentType: vDocType,
      verificationDocumentUrl: verificationDocumentUrl,
    });
    res.status(201).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      idNumber: user.idNumber,
      role: user.role,
      verificationDocumentType: user.verificationDocumentType,
      verificationDocumentUrl: user.verificationDocumentUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, adminType: user.adminType }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

// Content admin: list unverified artists
export async function listArtists(req: Request, res: Response) {
  try {
    const artists = await User.findAll({ where: { role: 'artist' } });
    res.json(artists);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch artists.' });
  }
}

// Content admin: approve artist
export async function approveArtist(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const artist = await User.findByPk(id);
    if (!artist || artist.role !== 'artist') return res.status(404).json({ error: 'Artist not found' });
    artist.isVerified = true;
    await artist.save();
    res.json(artist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve artist.' });
  }
}

// Content admin: reject artist
export async function rejectArtist(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const artist = await User.findByPk(id);
    if (!artist || artist.role !== 'artist') return res.status(404).json({ error: 'Artist not found' });
    artist.isVerified = false;
    // Optionally, store rejection reason somewhere (not in schema yet)
    await artist.save();
    res.json(artist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject artist.' });
  }
}
