import { Request, Response } from 'express';
import { Payment } from '../models/payment';
import { Track } from '../models/track';
import { User } from '../models/user';
import { OwnershipTransfer } from '../models/ownershipTransfer';
import { transferOwnershipOnChain } from '../utils/blockchain';
import { v4 as uuidv4 } from 'uuid';

// Admin: List all pending transfers ready for blockchain publishing (status 'approved')
export async function listPendingTransfersForPublish(req: Request, res: Response) {
  try {
    const transfers = await OwnershipTransfer.findAll({
      where: { status: 'approved' },
      include: [
        { model: Track, as: 'track' },
        { model: User, as: 'currentOwner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'newOwner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Payment, as: 'payment' }
      ]
    });
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending transfers for publish.' });
  }
}

// Admin: Publish a transfer to blockchain (update OwnershipTransfer and Track)
export async function publishTransferToBlockchain(req: Request, res: Response) {
  try {
    const { trackId } = req.params;
    const { blockchainTx, certificateUrl } = req.body;
    if (!blockchainTx || !certificateUrl) {
      return res.status(400).json({ error: 'Blockchain transaction hash and certificate URL are required' });
    }
    // Find the approved OwnershipTransfer for this track
    const transfer = await OwnershipTransfer.findOne({
      where: { trackId, status: 'approved' },
    });
    if (!transfer) {
      return res.status(404).json({ error: 'No approved transfer found for this track' });
    }
    const track = await Track.findByPk(trackId);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    if (track.blockchainTx) {
      return res.status(400).json({ error: 'Transfer already published to blockchain' });
    }
    // Update OwnershipTransfer and Track
    transfer.status = 'published';
    transfer.blockchainTx = blockchainTx;
    transfer.certificateUrl = certificateUrl;
    transfer.publishedAt = new Date();
    await transfer.save();
    track.blockchainTx = blockchainTx;
    track.artistId = transfer.newOwnerId;
    track.status = 'copyrighted';
    await track.save();
    res.json({ message: 'Transfer published to blockchain', transfer, track });
  } catch (err) {
    res.status(500).json({ error: 'Failed to publish transfer to blockchain.' });
  }
}

// POST /api/transfer/:trackId/transfer
// User: List their outgoing transfers (current owner)
export async function listMyOutgoingTransfers(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.id;
    const transfers = await OwnershipTransfer.findAll({
      where: { currentOwnerId: userId },
      include: [
        { model: Track, as: 'track' },
        { model: User, as: 'newOwner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Payment, as: 'payment' }
      ]
    });
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch outgoing transfers.' });
  }
}

// User: List their incoming transfers (as new owner)
export async function listMyIncomingTransfers(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.id;
    const transfers = await OwnershipTransfer.findAll({
      where: { newOwnerId: userId },
      include: [
        { model: Track, as: 'track' },
        { model: User, as: 'currentOwner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Payment, as: 'payment' }
      ]
    });
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incoming transfers.' });
  }
}

// POST /api/transfer/:trackId/transfer
// User requests a transfer (creates OwnershipTransfer, payment)
export async function requestTransfer(req: Request, res: Response) {
  try {
    const { trackId } = req.params;
    const { newOwnerId } = req.body;
    if (!newOwnerId) return res.status(400).json({ error: 'newOwnerId is required' });

    const track = await Track.findByPk(trackId);
    if (!track) return res.status(404).json({ error: 'Track not found' });

    // Only the current owner can initiate the transfer
    const user = req.user as User;
    if (track.artistId !== user.id) return res.status(403).json({ error: 'You are not the owner of this track' });

    // Check if an OwnershipTransfer already exists and is not published
    let transfer = await OwnershipTransfer.findOne({
      where: { trackId, currentOwnerId: user.id, newOwnerId, status: ['requested', 'approved'] }
    });
    if (transfer) {
      return res.status(400).json({ error: 'A transfer request is already pending or approved for this track and new owner.' });
    }

    // Ensure a transfer payment exists for this track and artist
    let payment = await Payment.findOne({ where: { trackId, artistId: user.id, paymentType: 'transfer' } });
    if (!payment) {
      const { TRANSFER_PAYMENT_AMOUNT } = require('../utils/config');
      payment = await Payment.create({
        id: uuidv4(),
        trackId,
        artistId: user.id,
        amount: TRANSFER_PAYMENT_AMOUNT,
        paymentType: 'transfer',
        status: 'initial',
        expiry: null
      });
    }

    // Create OwnershipTransfer record
    transfer = await OwnershipTransfer.create({
      id: uuidv4(),
      trackId,
      currentOwnerId: user.id,
      newOwnerId,
      status: 'requested',
      paymentId: payment.id,
      requestedAt: new Date(),
    });
    return res.status(201).json({ message: 'Transfer request created. Please complete payment before transferring ownership.', transfer });
  } catch (err: any) {
    res.status(500).json({ error: 'Ownership transfer request failed', details: err.message });
  }
}
