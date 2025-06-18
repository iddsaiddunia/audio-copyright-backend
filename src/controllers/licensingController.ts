import { Request, Response } from 'express';
import { Payment } from '../models/payment';
import { Track } from '../models/track';
import { User } from '../models/user';
import { issueLicenseOnChain } from '../utils/blockchain';

// POST /api/licensing/:trackId
// Issue a license after payment approval
export async function issueTrackLicense(req: Request, res: Response) {
  try {
    const { trackId } = req.params;
    const { licenseeId, terms, duration } = req.body;
    if (!licenseeId || !terms || !duration) return res.status(400).json({ error: 'licenseeId, terms, and duration are required' });
    const durationSec = parseInt(duration, 10);
    if (isNaN(durationSec) || durationSec <= 0) return res.status(400).json({ error: 'duration must be a positive integer (seconds)' });

    const track = await Track.findByPk(trackId);
    if (!track) return res.status(404).json({ error: 'Track not found' });

    // Only the owner can issue a license
    const user = req.user as User;
    if (track.artistId !== user.id) return res.status(403).json({ error: 'You are not the owner of this track' });

    // Ensure a licensing payment exists for this track and artist
    let payment = await Payment.findOne({ where: { trackId, artistId: user.id, paymentType: 'licensing' } });
    if (!payment) {
      const { LICENSING_MIN_AMOUNT } = require('../utils/config');
      payment = await Payment.create({
        id: require('uuid').v4(),
        trackId,
        artistId: user.id,
        amount: LICENSING_MIN_AMOUNT,
        paymentType: 'licensing',
        status: 'initial',
        expiry: null
      });
      return res.status(201).json({ message: 'Licensing payment created. Please complete payment before issuing license.', payment });
    }
    if (payment.status !== 'approved') return res.status(402).json({ error: 'Licensing fee payment not approved', payment });

    // Ensure fingerprint exists
    if (!track.fingerprint) return res.status(400).json({ error: 'Track does not have a fingerprint' });

    // Issue license on blockchain
    const txHash = await issueLicenseOnChain(track.fingerprint, licenseeId, terms, durationSec);

    res.json({ message: 'License issued', txHash });
  } catch (err: any) {
    res.status(500).json({ error: 'License issuing failed', details: err.message });
  }
}
