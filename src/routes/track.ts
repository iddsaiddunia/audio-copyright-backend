import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadTrack, listArtistTracks, getTrack, listPendingTracksForApproval, approveTrack, rejectTrack, listAllTracksForAdmin } from '../controllers/trackController';
import { publishTrackCopyright, checkTrackCopyrighted } from '../controllers/blockchainController';
import { authenticateJWT } from '../middleware/auth';
import { requireRole, requireAnyAdminType } from '../middleware/roles';

const router = Router();

// Configure multer for audio uploads
const upload = multer({
  dest: path.join(__dirname, '../../storage/tmp'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) cb(null, true);
    else cb(new Error('Only audio files are allowed'));
  }
});

// Only verified artists can upload
router.post('/upload', authenticateJWT, upload.single('audio'), uploadTrack);
// List tracks for current artist
router.get('/my', authenticateJWT, listArtistTracks);
// Content admin: list pending tracks with approved payment
router.get('/pending', authenticateJWT, requireRole('content'), listPendingTracksForApproval);

// Content or Technical admin: list all tracks regardless of payment/status
router.get('/all', authenticateJWT, requireAnyAdminType(['content', 'technical']), listAllTracksForAdmin);
// Content admin: approve a track
router.post('/:id/approve', authenticateJWT, requireAnyAdminType(['content', 'technical']), approveTrack);
// Content admin: reject a track
router.post('/:id/reject', authenticateJWT, requireAnyAdminType(['content', 'technical']), rejectTrack);
// Get a specific track by id
router.get('/:id', authenticateJWT, getTrack);
// Blockchain: check if track fingerprint is copyrighted
router.get('/:id/copyright/check', authenticateJWT, checkTrackCopyrighted);
// Blockchain: publish copyright (technical/super only)
router.post('/:id/publish', authenticateJWT, requireRole('technical'), publishTrackCopyright);

export default router;
