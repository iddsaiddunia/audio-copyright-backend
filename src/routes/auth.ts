import { Router } from 'express';
import { register, login, getProfile, uploadVerificationDocument } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/register', uploadVerificationDocument.single('file'), register);
router.post('/login', login);
router.post('/logout', (req, res) => {
  // For JWT, logout is handled client-side by deleting the token.
  // This endpoint is provided for extensibility (e.g., blacklisting tokens).
  res.status(200).json({ message: 'Logged out' });
});
router.get('/me', authenticateJWT, getProfile);

export default router;
