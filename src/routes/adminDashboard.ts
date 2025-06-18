import { Router } from 'express';
import { getAdminDashboard } from '../controllers/adminDashboardController';

const router = Router();
// Public dashboard endpoint (no auth)
router.get('/dashboard', getAdminDashboard);

// Optionally, keep admin-only endpoint if needed
// router.get('/admin-dashboard', authenticateJWT, requireAnyAdmin, getAdminDashboard);

export default router;
