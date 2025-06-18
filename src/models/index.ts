import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// Defensive: throw if any critical DB env var is missing
const requiredVars = ['DB_NAME', 'DB_USER', 'DB_PASS', 'DB_HOST', 'DB_PORT'];
for (const v of requiredVars) {
  if (!process.env[v]) {
    throw new Error(`Missing required env var: ${v}`);
  }
}

import { initUserModel } from './user';
import { initTrackModel } from './track';
import { initPaymentModel } from './payment';
import { initOwnershipTransferModel } from './ownershipTransfer';
import { SystemSetting } from './systemSetting';

export const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASS!,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: 'mysql',
    logging: false,
  }
);

export const User = initUserModel(sequelize);
export const Track = initTrackModel(sequelize);
export const Payment = initPaymentModel(sequelize);
export const OwnershipTransfer = initOwnershipTransferModel(sequelize);
export { SystemSetting };

// Associations
import { associateTrackModels } from './track';
import { associatePaymentModels } from './payment';

associateTrackModels();
associatePaymentModels();
// TODO: Add OwnershipTransfer associations if needed
