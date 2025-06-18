import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { listArtists, approveArtist, rejectArtist } from '../controllers/authController';

const router = Router();

// Content admin: list all artists
router.get('/', authenticateJWT, requireRole('content'), listArtists);
// Content admin: approve artist
router.post('/:id/approve', authenticateJWT, requireRole('content'), approveArtist);
// Content admin: reject artist
router.post('/:id/reject', authenticateJWT, requireRole('content'), rejectArtist);

export default router;
