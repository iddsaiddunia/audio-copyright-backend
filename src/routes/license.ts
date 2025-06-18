import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { requireRole, requireAnyAdminType } from '../middleware/roles';
import * as licenseController from '../controllers/licenseController';

const router = express.Router();

// Routes that require authentication
router.use(authenticateJWT);

// Get all license requests for the current user (either as owner or requester)
router.get('/user', licenseController.getUserLicenses);

// Get all license requests (admin only)
router.get('/all', requireAnyAdminType(['content', 'technical', 'financial']), licenseController.getAllLicenses);

// Get available tracks for licensing (available to all authenticated users)
router.get('/available-tracks', licenseController.getAvailableTracksForLicensing);

// Get a specific license by ID
router.get('/:id', licenseController.getLicenseById);

// Create a new license request (available to all authenticated users)
router.post('/', licenseController.createLicenseRequest);

// Approve a license request (by track owner)
router.post('/:id/approve', licenseController.approveLicenseRequest);

// Reject a license request (by track owner)
router.post('/:id/reject', licenseController.rejectLicenseRequest);

// Mark license as paid (by financial admin)
router.post('/:id/mark-paid', requireAnyAdminType(['financial']), licenseController.markLicenseAsPaid);

// Publish license to blockchain (by technical admin)
router.post('/:id/publish', requireAnyAdminType(['technical']), licenseController.publishLicenseToBlockchain);

export default router;
