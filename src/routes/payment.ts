import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { requireRole, requireAnyAdminType } from '../middleware/roles';
import { createPayment, listAllPayments, approvePayment, rejectPayment, generateInvoice, listArtistPayments, getGlobalFinancialMetrics } from '../controllers/paymentController';

const router = Router();

// Artist creates payment for copyright registration
router.post('/create', authenticateJWT, (req, res) => {
  req.body.paymentType = 'registration';
  createPayment(req, res);
});
// Artist creates payment for copyright transfer
router.post('/transfer/create', authenticateJWT, (req, res) => {
  req.body.paymentType = 'transfer';
  createPayment(req, res);
});
// Artist creates payment for licensing
router.post('/licensing/create', authenticateJWT, (req, res) => {
  req.body.paymentType = 'licensing';
  createPayment(req, res);
});

// Artist gets all their payments
router.get('/artist/all', authenticateJWT, listArtistPayments);

// Financial admin endpoints
router.get('/all', authenticateJWT, requireRole('financial'), listAllPayments);
router.post('/:id/approve', authenticateJWT, requireRole('financial'), approvePayment);
router.post('/:id/reject', authenticateJWT, requireRole('financial'), rejectPayment);

// Generate invoice for a payment
router.post('/:id/invoice', authenticateJWT, generateInvoice);

// Admin: Global financial metrics
router.get('/metrics/global', authenticateJWT, requireAnyAdminType(['financial', 'super', 'technical', 'content']), getGlobalFinancialMetrics);

export default router;
