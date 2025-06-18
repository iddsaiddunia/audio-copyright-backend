import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import * as licenseSettingsController from '../controllers/licenseSettingsController';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Get license settings for all tracks owned by the current user
router.get('/', licenseSettingsController.getLicenseSettings);

// Update license settings for a specific track
router.put('/:id', licenseSettingsController.updateTrackLicenseSettings);

// Update license settings for multiple tracks at once
router.put('/bulk/update', licenseSettingsController.updateBulkLicenseSettings);

// Get license analytics for the current user's tracks
router.get('/analytics', licenseSettingsController.getLicenseAnalytics);

export default router;
