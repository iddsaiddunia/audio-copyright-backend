import { Router } from 'express';
import { listUsers, createAdminUser, updateUser, updateUserStatus, verifyArtist, deleteUser, searchUsers } from '../controllers/userController';
import { authenticateJWT } from '../middleware/auth';
import { requireRole, requireAnyAdminType } from '../middleware/roles';

const router = Router();

// Authenticate all user management endpoints
router.use(authenticateJWT);

// Get current user's profile
import { getCurrentUser } from '../controllers/userController';
router.get('/me', getCurrentUser);
// All user management endpoints require technical adminType (or super admin)
// router.use(requireRole('technical'));

// List users
router.get('/', listUsers);

// Search users by email
router.get('/search', searchUsers);
// Create admin user
router.post('/', createAdminUser);
// Update user info
router.put('/:id', updateUser);
// Update user status
router.put('/:id/status', updateUserStatus);

// Verify artist (separate endpoint)
router.put('/:id/verify', requireAnyAdminType(['content', 'technical', 'super']), verifyArtist);
// Delete user
router.delete('/:id', deleteUser);

export default router;
