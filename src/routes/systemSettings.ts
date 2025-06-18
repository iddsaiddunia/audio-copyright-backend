import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  createSetting,
  deleteSetting
} from '../controllers/systemSettingsController';

const router = Router();

// Only allow technical/super admins
router.use(authenticateJWT, requireRole('technical'));

router.get('/', getAllSettings);
router.get('/:key', getSettingByKey);
router.put('/:key', updateSetting);
router.post('/', createSetting);
router.delete('/:key', deleteSetting);

export default router;
