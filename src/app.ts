import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import sequelize from './config/database';
import { initUserModel, ensureSuperAdmin } from './models/user';
import { initTrackModel } from './models/track';
import { initPaymentModel } from './models/payment';
import { initLicenseModel } from './models/license';
import authRoutes from './routes/auth';
import trackRoutes from './routes/track';
import userRoutes from './routes/user';
import licenseRoutes from './routes/license';

// Load environment variables
dotenv.config();


// Model initialization guard
declare global {
  // eslint-disable-next-line no-var
  var modelsInitialized: boolean | undefined;
}
import { associatePaymentModels } from './models/payment';
import { associateUserModels } from './models/user';
import { associateTrackModels } from './models/track';
import { associateLicenseModels } from './models/license';

if (!global.modelsInitialized) {
  initUserModel(sequelize);
  initTrackModel(sequelize);
  initPaymentModel(sequelize);
  initLicenseModel(sequelize);
  associatePaymentModels();
  associateUserModels();
  associateTrackModels();
  associateLicenseModels();
  global.modelsInitialized = true;
  // Ensure a super admin exists
  ensureSuperAdmin();
}

const app = express();

import path from 'path';
// Serve audio files from /audio
app.use('/audio', express.static(path.join(__dirname, '../storage/tracks')));

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/users', userRoutes);
app.use('/api/licenses', licenseRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Audio Copyright Backend running' });
});

// Auth routes
app.use('/api/auth', authRoutes);
// Track routes
app.use('/api/tracks', trackRoutes);
// Payment routes
import paymentRoutes from './routes/payment';
app.use('/api/payments', paymentRoutes);
// Transfer routes
import transferRoutes from './routes/transfer';
app.use('/api/transfers', transferRoutes);
// Licensing routes
import licensingRoutes from './routes/licensing';
app.use('/api/licensing', licensingRoutes);
// License settings routes
import licenseSettingsRoutes from './routes/licenseSettings';
app.use('/api/license-settings', licenseSettingsRoutes);
// System settings routes
import systemSettingsRoutes from './routes/systemSettings';
app.use('/api/system-settings', systemSettingsRoutes);
// Artist admin routes
import artistRoutes from './routes/artist';
app.use('/api/artists', artistRoutes);

import adminDashboardRoutes from './routes/adminDashboard';
app.use('/api', adminDashboardRoutes); // Make dashboard public at /api/dashboard
app.use('/api/admin', adminDashboardRoutes); // Keep admin route for future admin-only endpoints

export default app;
