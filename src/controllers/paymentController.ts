import { Request, Response } from 'express';
import { Payment } from '../models/payment';
import { Track } from '../models/track';
import { v4 as uuidv4 } from 'uuid';

// Simulate payment creation for a track (called after track upload)
export async function createPayment(req: Request, res: Response) {
  try {
    const artist = req.user as import('../models/user').User;
    const { trackId } = req.body;
    if (!trackId) return res.status(400).json({ error: 'trackId required' });
    const track = await Track.findByPk(trackId);
    if (!track || track.artistId !== artist.id) return res.status(404).json({ error: 'Track not found or not owned by artist' });
    // Use system-configured payment amount based on type
    const {
      COPYRIGHT_PAYMENT_AMOUNT,
      TRANSFER_PAYMENT_AMOUNT,
      LICENSING_MIN_AMOUNT,
      COSOTA_COMMISSION_PERCENTAGE
    } = require('../utils/config');
    const paymentType = req.body.paymentType || 'registration';
    let amount = COPYRIGHT_PAYMENT_AMOUNT;
    let cosotaCommission = 0;
    if (paymentType === 'transfer') {
      amount = TRANSFER_PAYMENT_AMOUNT;
    } else if (paymentType === 'licensing') {
      // Licensing amount must be provided and >= min
      const requestedAmount = parseInt(req.body.amount, 10);
      if (isNaN(requestedAmount) || requestedAmount < LICENSING_MIN_AMOUNT) {
        return res.status(400).json({ error: `Licensing amount must be at least ${LICENSING_MIN_AMOUNT}` });
      }
      amount = requestedAmount;
      cosotaCommission = Math.round((amount * COSOTA_COMMISSION_PERCENTAGE) / 100);
    }
    const payment = await Payment.create({
      id: uuidv4(),
      trackId,
      artistId: artist.id,
      amount,
      paymentType,
      status: 'initial',
      expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
    const response: any = payment.toJSON();
    if (paymentType === 'licensing') response.cosotaCommission = cosotaCommission;
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create payment' });
  }
}

// List all payments for the current artist
export async function listArtistPayments(req: Request, res: Response) {
  try {
    const artist = req.user as import('../models/user').User;
    const License = require('../models/license').License;
    
    const payments = await Payment.findAll({ 
      where: { artistId: artist.id },
      include: [
        { model: Track, as: 'track', attributes: ['title'] },
        { model: License, as: 'license', attributes: ['id', 'status', 'usageType', 'requesterId'] }
      ]
    });
    res.json(payments);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
}

// List all pending payments (financialAdmin only)
export async function listAllPayments(_req: Request, res: Response) {
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: require('../models/user').User,
          as: 'artist',
          attributes: ['firstName', 'lastName']
        },
        {
          model: require('../models/track').Track,
          as: 'track',
          attributes: ['title']
        }
      ]
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
}

// Approve a payment (financialAdmin only)
export async function approvePayment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { amountPaid } = req.body;
    const payment = await Payment.findByPk(id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (typeof amountPaid !== 'undefined') {
      // Mark as paid by user
      if (payment.status !== 'pending') return res.status(400).json({ error: 'Payment not in pending state' });
      payment.amountPaid = amountPaid;
      payment.paidAt = new Date();
      payment.status = 'approved';
    } else {
      // Admin approval
      payment.status = 'approved';
    }
    await payment.save();
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve payment' });
  }
}

// Reject a payment (financialAdmin only)
export async function rejectPayment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const payment = await Payment.findByPk(id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    payment.status = 'rejected';
    await payment.save();
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject payment' });
  }
}

// Generate invoice for a payment (moves status to 'pending', generates controlNumber)
export async function generateInvoice(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const payment = await Payment.findByPk(id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status !== 'initial') return res.status(400).json({ error: 'Invoice already generated or payment not in initial state' });
    // Generate random 12-char control number
    payment.controlNumber = Math.random().toString(36).slice(2, 14).toUpperCase();
    payment.status = 'pending';
    await payment.save();
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
}

