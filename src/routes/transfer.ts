import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { requireRole, requireAnyAdminType, requireAnyRole } from '../middleware/roles';
import { requestTransfer, listPendingTransfersForPublish, publishTransferToBlockchain, listMyOutgoingTransfers, listMyIncomingTransfers } from '../controllers/transferController';

const router = Router();

// Owner requests ownership transfer
router.post('/:trackId/transfer', authenticateJWT, requireAnyRole(['artist', 'licensee']), requestTransfer);

// User: List outgoing transfers (as current owner)
router.get('/my-outgoing', authenticateJWT, requireAnyRole(['artist', 'licensee']), listMyOutgoingTransfers);

// User: List incoming transfers (as new owner)
router.get('/my-incoming', authenticateJWT, requireAnyRole(['artist', 'licensee']), listMyIncomingTransfers);

// Admin: List all pending transfers ready for blockchain publishing
router.get('/pending-for-publish', authenticateJWT, requireAnyAdminType(['technical', 'super']), listPendingTransfersForPublish);

// Admin: Publish a transfer to blockchain
router.post('/:trackId/publish', authenticateJWT, requireAnyAdminType(['technical', 'super']), publishTransferToBlockchain);

export default router;
