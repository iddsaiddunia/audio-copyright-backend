import { Request, Response } from 'express';
import { User } from '../models/user';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Wallet } from 'ethers';

// Get current authenticated user's profile
export async function getCurrentUser(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    // Remove sensitive fields
    const { passwordHash, ...userData } = user.toJSON();
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
}

// List all users (optionally filter by role/status)
export async function listUsers(req: Request, res: Response) {
  try {
    const { role, adminType, status } = req.query;
    const where: any = {};
    if (role) where.role = role;
    if (adminType) where.adminType = adminType;
    if (status) where.status = status;
    const users = await User.findAll({
      where,
      attributes: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phoneNumber',
        'idNumber',
        'role',
        'adminType',
        'isVerified',
        'status',
        'walletAddress',
        'createdAt',
        'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });
    // Add fullName for frontend compatibility
    const usersWithFullName = users.map(u => {
      const user = u.toJSON();
      return {
        ...user,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
      };
    });
    res.json(usersWithFullName);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
}


// Create a new admin user
export async function createAdminUser(req: Request, res: Response) {
  try {
    const { firstName, lastName, email, password, phoneNumber, idNumber, adminType } = req.body;
    if (!firstName || !lastName || !email || !password || !phoneNumber || !idNumber || !adminType) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already exists.' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      id: uuidv4(),
      firstName,
      lastName,
      email,
      passwordHash,
      phoneNumber,
      idNumber,
      role: 'admin',
      adminType,
      isVerified: true,
      status: 'active'
    });
    console.log(`[AUDIT] Admin user created: ${user.email} (${adminType}) by ${(req as any).user?.email}`);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create admin user.' });
  }
}

// Update user info/role/status
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber, idNumber, adminType, status } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ error: 'Email already exists.' });
    }
    user.firstName = firstName ?? user.firstName;
    user.lastName = lastName ?? user.lastName;
    user.email = email ?? user.email;
    user.phoneNumber = phoneNumber ?? user.phoneNumber;
    user.idNumber = idNumber ?? user.idNumber;
    user.adminType = adminType ?? user.adminType;
    user.status = status ?? user.status;
    await user.save();
    console.log(`[AUDIT] User updated: ${user.email} (id: ${user.id}) by ${(req as any).user?.email}`);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user.' });
  }
}

// Change user status only
export async function updateUserStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required.' });
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    user.status = status;
    await user.save();
    console.log(`[AUDIT] User status changed: ${user.email} (id: ${user.id}) to ${status} by ${(req as any).user?.email}`);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status.' });
  }
}


// Verify artist (separate endpoint)
export async function verifyArtist(req: Request, res: Response) {
  const { id } = req.params;
  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  const artistUser = user as typeof user & { walletAddress?: string | null };
  if (!artistUser.isVerified) {
    try {
      if (!artistUser.walletAddress) {
        let walletAddress = null;
        try {
          const wallet = Wallet.createRandom();
          walletAddress = wallet && wallet.address ? wallet.address : null;
        } catch (walletErr) {
          return res.status(500).json({ error: 'Failed to generate wallet address.' });
        }
        if (!walletAddress) {
          return res.status(500).json({ error: 'Failed to generate wallet address.' });
        }
        artistUser.walletAddress = walletAddress;
      }
      // Only set isVerified after wallet generation
      artistUser.isVerified = true;
      await user.save();
      if (!artistUser.walletAddress) {
        // If for any reason walletAddress is still not set, fail
        return res.status(500).json({ error: 'Wallet address was not set after save.' });
      }
      return res.json({ message: 'Artist verified', user });
    } catch (err) {
      return res.status(500).json({ error: 'Error during artist verification.' });
    }
  } else {
    return res.status(400).json({ error: 'Artist already verified.' });
  }
}







// Delete user
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.adminType === 'super') {
      console.log(`[AUDIT] Prevented deletion of super admin: ${user.email}`);
      return res.status(403).json({ error: 'Cannot delete super admin accounts.' });
    }
    await user.destroy();
    console.log(`[AUDIT] User deleted: ${user.email} (id: ${user.id}) by ${(req as any).user?.email}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
}
