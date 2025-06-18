import { Request, Response } from 'express';
import { License } from '../models/license';
import { Track } from '../models/track';
import { User } from '../models/user';
import { Payment } from '../models/payment';
import { v4 as uuidv4 } from 'uuid';

// Get all license requests for a user (either as owner or requester)
export async function getUserLicenses(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { role } = req.query;
    
    let where = {};
    
    if (role === 'owner') {
      where = { ownerId: userId };
    } else if (role === 'requester') {
      where = { requesterId: userId };
    } else {
      // If no role specified, get all licenses where user is either owner or requester
      where = {
        [Symbol.for('or')]: [
          { ownerId: userId },
          { requesterId: userId }
        ]
      };
    }
    
    const licenses = await License.findAll({
      where,
      include: [
        { 
          model: Track, 
          as: 'track',
          include: [{ model: User, as: 'artist', attributes: ['id', 'firstName', 'lastName', 'email', 'walletAddress'] }]
        },
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'walletAddress'] },
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email', 'walletAddress'] },
        { model: Payment, as: 'payments' }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(licenses);
  } catch (err) {
    console.error('Error in getUserLicenses:', err instanceof Error ? err.stack : err);
    res.status(500).json({ error: 'Failed to fetch license requests' });
  }
}

// Get all license requests for admin
export async function getAllLicenses(req: Request, res: Response) {
  try {
    const licenses = await License.findAll({
      include: [
        { 
          model: Track, 
          as: 'track',
          include: [{ model: User, as: 'artist', attributes: ['id', 'firstName', 'lastName', 'email', 'walletAddress'] }]
        },
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'walletAddress'] },
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email', 'walletAddress'] },
        { model: Payment, as: 'payments' }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(licenses);
  } catch (err) {
    console.error('Error in getAllLicenses:', err instanceof Error ? err.stack : err);
    res.status(500).json({ error: 'Failed to fetch license requests' });
  }
}

// Get a specific license by ID
export async function getLicenseById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const license = await License.findByPk(id, {
      include: [
        { 
          model: Track, 
          as: 'track',
          include: [{ model: User, as: 'artist', attributes: ['id', 'firstName', 'lastName', 'email', 'walletAddress'] }]
        },
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'walletAddress'] },
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email', 'walletAddress'] },
        { model: Payment, as: 'payments' }
      ]
    });
    
    if (!license) {
      return res.status(404).json({ error: 'License request not found' });
    }
    
    // Check if user is authorized to view this license
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (userRole !== 'admin' && license.ownerId !== userId && license.requesterId !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this license request' });
    }
    
    res.json(license);
  } catch (err) {
    console.error('Error in getLicenseById:', err instanceof Error ? err.stack : err);
    res.status(500).json({ error: 'Failed to fetch license request' });
  }
}

// Create a new license request
export async function createLicenseRequest(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { trackId, purpose, duration, territory, usageType } = req.body;
    
    // Validate required fields
    if (!trackId || !purpose || !duration || !territory || !usageType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get the track to verify it exists and is available for licensing
    const track = await Track.findByPk(trackId);
    
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    
    if (!track.isAvailableForLicensing) {
      return res.status(400).json({ error: 'This track is not available for licensing' });
    }
    
    if (track.status !== 'copyrighted') {
      return res.status(400).json({ error: 'This track is not yet copyrighted and cannot be licensed' });
    }
    
    // Prevent artists from licensing their own tracks
    if (track.artistId === userId) {
      return res.status(400).json({ error: 'You cannot license your own tracks' });
    }
    
    // Prevent duplicate license requests for the same track by the same user
    const existingLicense = await License.findOne({
      where: {
        trackId,
        requesterId: userId,
        status: ['pending', 'approved', 'paid', 'published']
      }
    });
    if (existingLicense) {
      return res.status(400).json({ error: 'You have already requested a license for this track.' });
    }
    
    // Create the license request
    const license = await License.create({
      id: uuidv4(),
      trackId,
      requesterId: userId,
      ownerId: track.artistId || '',  // Ensure artistId is never undefined
      purpose,
      duration,
      territory,
      usageType,
      status: 'pending'
    });
    
    res.status(201).json(license);
  } catch (err) {
    console.error('Error in createLicenseRequest:', err instanceof Error ? err.stack : err);
    res.status(500).json({ error: 'Failed to create license request' });
  }
}

// Approve a license request (by track owner)
export async function approveLicenseRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const license = await License.findByPk(id, {
      include: [{ model: Track, as: 'track' }]
    });
    
    if (!license) {
      return res.status(404).json({ error: 'License request not found' });
    }
    
    // Verify the user is the owner of the track
    if (license.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the track owner can approve this license request' });
    }
    
    // Check if the license is in the correct state
    if (license.status !== 'pending') {
      return res.status(400).json({ error: `Cannot approve a license request that is already ${license.status}` });
    }
    
    // Update the license status
    license.status = 'approved';
    await license.save();
    
    // Get the track details to determine license fee
    const track = await Track.findByPk(license.trackId);
    
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    
    // Create a payment record for the license
    const payment = await Payment.create({
      id: uuidv4(),
      trackId: license.trackId,
      artistId: license.requesterId, // Correct: associate payment with requester
      licenseId: license.id,
      amount: track.licenseFee,
      paymentType: 'licensing',
      status: 'initial',
      controlNumber: `LIC-${Math.floor(100000 + Math.random() * 900000)}`,
      expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    
    res.json({ license, payment });
  } catch (err) {
    console.error('Error in approveLicenseRequest:', err instanceof Error ? err.stack : err);
    res.status(500).json({ error: 'Failed to approve license request' });
  }
}

// Reject a license request (by track owner)
export async function rejectLicenseRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { rejectionReason } = req.body;
    
    const license = await License.findByPk(id);
    
    if (!license) {
      return res.status(404).json({ error: 'License request not found' });
    }
    
    // Verify the user is the owner of the track
    if (license.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the track owner can reject this license request' });
    }
    
    // Check if the license is in the correct state
    if (license.status !== 'pending') {
      return res.status(400).json({ error: `Cannot reject a license request that is already ${license.status}` });
    }
    
    // Update the license status
    license.status = 'rejected';
    license.rejectionReason = rejectionReason ? rejectionReason : 'No reason provided';
    await license.save();
    
    res.json(license);
  } catch (err) {
    console.error('Error in rejectLicenseRequest:', err instanceof Error ? err.stack : err);
    res.status(500).json({ error: 'Failed to reject license request' });
  }
}

// Mark license as paid (by financial admin)
export async function markLicenseAsPaid(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { paymentId } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }
    
    const license = await License.findByPk(id);
    
    if (!license) {
      return res.status(404).json({ error: 'License request not found' });
    }
    
    // Check if the license is in the correct state
    if (license.status !== 'approved') {
      return res.status(400).json({ error: `Cannot mark as paid a license request that is ${license.status}` });
    }
    
    // Find and update the payment
    const payment = await Payment.findOne({
      where: {
        id: paymentId,
        licenseId: license.id
      }
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found for this license' });
    }
    
    payment.status = 'approved';
    payment.paidAt = new Date();
    await payment.save();
    
    // Update the license status
    license.status = 'paid';
    await license.save();
    
    res.json({ license, payment });
  } catch (err) {
    console.error('Error in markLicenseAsPaid:', err instanceof Error ? err.stack : err);
    res.status(500).json({ error: 'Failed to mark license as paid' });
  }
}

// Publish license to blockchain (by technical admin)
export async function publishLicenseToBlockchain(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { blockchainTx, certificateUrl } = req.body;
    // blockchainTx is required, certificateUrl is optional (can be null or '')
    if (!blockchainTx) {
      return res.status(400).json({ error: 'Blockchain transaction hash is required' });
    }
    // NOTE: Frontend must ensure the owner wallet address is included in the blockchain transaction (see LicenseIssued event).
    
    const license = await License.findByPk(id);
    
    if (!license) {
      return res.status(404).json({ error: 'License request not found' });
    }
    
    // Check if the license is in the correct state
    if (license.status !== 'paid') {
      return res.status(400).json({ error: `Cannot publish a license request that is ${license.status}` });
    }
    
    // Update the license status
    license.status = 'published';
    license.blockchainTx = blockchainTx;
    license.certificateUrl = certificateUrl;
    await license.save();
    
    res.json(license);
  } catch (err) {
    console.error('Error in publishLicenseToBlockchain:', err instanceof Error ? err.stack : err);
    res.status(500).json({ error: 'Failed to publish license to blockchain' });
  }
}

// Get available tracks for licensing
export async function getAvailableTracksForLicensing(req: Request, res: Response) {
  try {
    const tracks = await Track.findAll({
      where: {
        isAvailableForLicensing: true,
        status: 'copyrighted'
      },
      include: [
        { model: User, as: 'artist', attributes: ['id', 'firstName', 'lastName', 'email', 'walletAddress'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(tracks);
  } catch (err) {
    console.error('Error in getAvailableTracksForLicensing:', err instanceof Error ? err.stack : err);
    res.status(500).json({ error: 'Failed to fetch available tracks for licensing' });
  }
}
