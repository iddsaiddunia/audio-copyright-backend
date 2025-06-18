import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { issueTrackLicense } from '../controllers/licensingController';

const router = Router();

// Owner issues a license for a track (after payment approval)
router.post('/:trackId/issue', authenticateJWT, requireRole('artist'), issueTrackLicense);

export default router;
