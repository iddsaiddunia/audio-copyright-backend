import { Request, Response } from 'express';
import { Track } from '../models/track';
import { Payment } from '../models/payment';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { getAudioFingerprint } from '../utils/fingerprinting';
import { fingerprintSimilarity, lyricsSimilarity } from '../utils/similarity';
import { AUDIO_SIMILARITY_THRESHOLD, LYRICS_SIMILARITY_THRESHOLD, COPYRIGHT_PAYMENT_AMOUNT } from '../utils/config';
import { User } from '../models/user';

const TRACKS_DIR = path.join(__dirname, '../../storage/tracks');
if (!fs.existsSync(TRACKS_DIR)) fs.mkdirSync(TRACKS_DIR, { recursive: true });

export async function uploadTrack(req: Request, res: Response) {
  try {
    const artist = req.user as import('../models/user').User;
    if (!artist || artist.role !== 'artist' || !artist.isVerified) {
      return res.status(403).json({ error: 'Only verified artists can upload tracks.' });
    }
    const {
      title,
      genre,
      releaseYear,
      description,
      lyrics,
      collaborators,
      isAvailableForLicensing,
      licenseFee,
      licenseTerms
    } = req.body;
    if (!title || !genre || !releaseYear  || !lyrics  || !req.file) {
      return res.status(400).json({ error: 'All fields and audio file are required.' });
    }
    const ext = path.extname(req.file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(TRACKS_DIR, filename);
    fs.renameSync(req.file.path, filepath);
    const track = await Track.create({
      id: uuidv4(),
      title,
      genre,
      releaseYear,
      description,
      lyrics,
      collaborators,
      isAvailableForLicensing: isAvailableForLicensing === 'true' || isAvailableForLicensing === true,
      licenseFee: Number(licenseFee),
      licenseTerms,
      artistId: artist.id,
      filename,
      status: 'pending',
    });
    // Create payment for this track

    const payment = await Payment.create({
      id: uuidv4(),
      trackId: track.id,
      artistId: artist.id,
      amount: COPYRIGHT_PAYMENT_AMOUNT,
      paymentType: 'registration',
      status: 'initial'
      // do not set expiry, let model default or hook handle it
    });
    res.status(201).json({
      track: {
        id: track.id,
        title: track.title,
        genre: track.genre,
        releaseYear: track.releaseYear,
        description: track.description,
        lyrics: track.lyrics,
        collaborators: track.collaborators,
        isAvailableForLicensing: track.isAvailableForLicensing,
        licenseFee: track.licenseFee,
        licenseTerms: track.licenseTerms,
        filename: track.filename,
        status: track.status
      },
      payment: payment.toJSON()
    });
  } catch (err) {
    res.status(500).json({ error: 'Track upload failed.' });
  }
}

export async function listArtistTracks(req: Request, res: Response) {
  try {
    const artist = req.user as import('../models/user').User;
    if (!artist || artist.role !== 'artist') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    // Only show tracks with approved payment or payment not required
    const tracks = await Track.findAll({ where: { artistId: artist.id } });
    res.json(tracks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tracks.' });
  }
}

// For contentAdmin: list tracks with approved payment and pending status
export async function listPendingTracksForApproval(req: Request, res: Response) {
  try {
    // Only contentAdmin can access (enforced by route)
    // Find all tracks with status 'pending' and an approved payment
    const approvedPayments = await Payment.findAll({ where: { status: 'approved' } });
    const approvedTrackIds = approvedPayments.map(p => p.trackId);
    const tracks = await Track.findAll({ where: { id: approvedTrackIds, status: 'pending' } });
    res.json(tracks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending tracks for approval.' });
  }
}

// List all tracks for admin (with artist info)
export async function listAllTracksForAdmin(req: Request, res: Response) {
  try {
    const tracks = await Track.findAll({
      include: [
        { model: User, as: 'artist', attributes: ['id', 'firstName', 'lastName', 'email', 'walletAddress'] },
        {
          model: Payment,
          as: 'payments',
          where: { paymentType: 'registration' },
          required: false,
          attributes: ['status', 'createdAt'],
          separate: true,
          order: [['createdAt', 'DESC']],
          limit: 1
        }
      ]
    });
    // Map paymentStatus, fingerprint, and artist.walletAddress into each track
    const tracksWithPayment = tracks.map(track => {
      // @ts-ignore
      const paymentStatus = track.payments && track.payments.length > 0 ? track.payments[0].status : 'unknown';
      const t = track.toJSON() as any;
      return {
        ...t,
        paymentStatus,
        fingerprint: t.fingerprint,
        artist: {
          ...(t.artist || {}),
          walletAddress: t.artist?.walletAddress || ''
        }
      };
    });
    res.json(tracksWithPayment);
  } catch (err) {
    // Log the real error for debugging
    console.error('[listAllTracksForAdmin] Error:', err);
    res.status(500).json({ error: 'Failed to fetch all tracks.' });
  }
}

// Content admin: approve a track (only if payment approved)


export async function approveTrack(req: Request, res: Response) {
  const progress: { step: string; status: 'success' | 'error'; message: string; data?: any }[] = [];
  try {
    const { id } = req.params;

    // 1. Check payment approved
    const payment = await Payment.findOne({ where: { trackId: id, status: 'approved' } });
    if (!payment) {
      progress.push({ step: 'payment_check', status: 'error', message: 'Payment for this track has not been approved.' });
      return res.status(400).json({ error: 'Payment not approved for this track', progress });
    }
    progress.push({ step: 'payment_check', status: 'success', message: 'Payment verified.' });

    // 2. Check track status
    const track = await Track.findByPk(id);
    if (!track || track.status !== 'pending') {
      progress.push({ step: 'track_check', status: 'error', message: 'Track not found or is not in pending status.' });
      return res.status(404).json({ error: 'Track not found or not pending', progress });
    }
    progress.push({ step: 'track_check', status: 'success', message: 'Track is ready for approval.' });


    // Get absolute file path
    const audioPath = path.join(TRACKS_DIR, track.filename);

    // 3. Call fingerprinting service
    const fingerprintResult = await getAudioFingerprint(audioPath);
    if (!fingerprintResult.success) {
      progress.push({ step: 'fingerprint', status: 'error', message: 'Fingerprinting failed: ' + fingerprintResult.message });
      return res.status(500).json({ error: 'Fingerprinting service failed: ' + fingerprintResult.message, progress });
    }
    progress.push({ step: 'fingerprint', status: 'success', message: 'Audio fingerprint generated.' });


    // 4. Compare fingerprint with all tracks
    const allTracks = await Track.findAll({ where: { status: ['approved', 'copyrighted'] } });
    // Find most similar audio tracks
    const audioSimilarities = allTracks
      .filter(other => other.fingerprint)
      .map(other => ({
        id: other.id,
        title: other.title,
        similarity: fingerprintSimilarity(fingerprintResult.fingerprint_hash, other.fingerprint!)
      }))
      .sort((a, b) => b.similarity - a.similarity);
    if (audioSimilarities.length && audioSimilarities[0].similarity >= AUDIO_SIMILARITY_THRESHOLD) {
      progress.push({ step: 'audio_similarity', status: 'error', message: 'Audio fingerprint too similar', data: audioSimilarities.slice(0, 3) });
      return res.status(400).json({
        error: `Audio fingerprint too similar to existing track(s)`,
        similarity: audioSimilarities[0].similarity,
        similarTracks: audioSimilarities.slice(0, 3),
        progress
      });
    }
    progress.push({ step: 'audio_similarity', status: 'success', message: 'No similar audio found.' });

    // 5. Compare lyrics
    // Find most similar lyrics tracks
    const lyricsSimilarities = allTracks
      .filter(other => other.lyrics && track.lyrics) // ensure both tracks have lyrics
      .map(other => ({
        id: other.id,
        title: other.title,
        similarity: lyricsSimilarity(track.lyrics!, other.lyrics!)
      }))
      .sort((a, b) => b.similarity - a.similarity);
    if (lyricsSimilarities.length && lyricsSimilarities[0].similarity >= LYRICS_SIMILARITY_THRESHOLD) {
      progress.push({ step: 'lyrics_similarity', status: 'error', message: 'Lyrics too similar', data: lyricsSimilarities.slice(0, 3) });
      return res.status(400).json({
        error: `Lyrics too similar to existing track(s)`,
        similarity: lyricsSimilarities[0].similarity,
        similarTracks: lyricsSimilarities.slice(0, 3),
        progress
      });
    }
    progress.push({ step: 'lyrics_similarity', status: 'success', message: 'No similar lyrics found.' });


    // 6. Approve and save track
    progress.push({ step: 'approve', status: 'success', message: 'Approving and saving track...' });
    track.status = 'approved';
    track.fingerprint = fingerprintResult.fingerprint_hash;
    track.duration = fingerprintResult.duration;
    await track.save();
    progress.push({ step: 'done', status: 'success', message: 'Track approved successfully.' });
    res.json({ track, progress });
  } catch (err) {
    console.error('Error in approveTrack:', err instanceof Error ? err.stack : err);
    progress.push({ step: 'error', status: 'error', message: 'Internal error: ' + (err instanceof Error ? err.message : String(err)) });
    res.status(500).json({ error: 'Failed to approve track.', progress });
  }
}

// Content admin: reject a track (only if payment approved)
export async function rejectTrack(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    // Check payment approved
    const payment = await Payment.findOne({ where: { trackId: id, status: 'approved' } });
    if (!payment) return res.status(400).json({ error: 'Payment not approved for this track' });
    const track = await Track.findByPk(id);
    if (!track || track.status !== 'pending') return res.status(404).json({ error: 'Track not found or not pending' });
    track.status = 'rejected';
    // Optionally, store rejection reason somewhere (not in schema yet)
    await track.save();
    res.json(track);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject track.' });
  }
}

export async function getTrack(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const track = await Track.findByPk(id);
    if (!track) return res.status(404).json({ error: 'Track not found.' });
    res.json(track);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch track.' });
  }
}
