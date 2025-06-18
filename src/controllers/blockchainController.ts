import { Request, Response } from 'express';
import { Track } from '../models/track';
import { isFingerprintRegistered, publishCopyrightToBlockchain } from '../utils/blockchain';

// POST /api/tracks/:id/publish
// Only for technical/super admins
export async function publishTrackCopyright(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { txHash } = req.body;
    const track = await Track.findByPk(id);
    if (!track) return res.status(404).json({ error: 'Track not found' });
    if (!track.fingerprint) return res.status(400).json({ error: 'Track does not have a fingerprint' });
    if (!txHash || typeof txHash !== 'string' || !txHash.startsWith('0x') || txHash.length !== 66) {
      return res.status(400).json({ error: 'A valid txHash must be provided from MetaMask publishing.' });
    }
    // Only allow publishing if approved
    if (track.status === 'copyrighted') return res.status(409).json({ error: 'Track is already marked as copyrighted in the database.' });
    if (track.status !== 'approved') return res.status(400).json({ error: 'Track must be approved before blockchain registration' });
    // Update DB only (MetaMask already published)
    track.status = 'copyrighted';
    track.blockchainTx = txHash;
    await track.save();
    res.json({ message: 'Track blockchain status updated', txHash });
  } catch (err: any) {
    res.status(500).json({ error: 'Blockchain publish failed', details: err.message });
  }
}

// GET /api/tracks/:id/copyright/check
export async function checkTrackCopyrighted(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const track = await Track.findByPk(id);
    if (!track || !track.fingerprint) return res.status(404).json({ error: 'Track not found or no fingerprint' });
    const registered = await isFingerprintRegistered(track.fingerprint);
    res.json({ fingerprint: track.fingerprint, registered });
  } catch (err: any) {
    res.status(500).json({ error: 'Blockchain check failed', details: err.message });
  }
}
