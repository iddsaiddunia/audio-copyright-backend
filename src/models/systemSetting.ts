import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';
import dotenv from 'dotenv';
dotenv.config();

export interface SystemSettingAttributes {
  id: string;
  key: string;
  value: string;
  description?: string;
  type: 'string' | 'number' | 'boolean';
}

interface SystemSettingCreationAttributes extends Optional<SystemSettingAttributes, 'id' | 'description'> {}

export const SystemSetting = sequelize.define<Model<SystemSettingAttributes, SystemSettingCreationAttributes>>('SystemSetting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('string', 'number', 'boolean'),
    allowNull: false
  }
}, {
  tableName: 'system_settings',
  timestamps: false
});

// Auto-seed system settings if not present
import { Wallet } from 'ethers';

export async function seedSystemSettingsIfNeeded() {
// Derive admin wallet address from private key
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
let derivedAdminWalletAddress = '';
if (privateKey) {
  try {
    const wallet = new Wallet(privateKey.startsWith('0x') ? privateKey : '0x' + privateKey);
    derivedAdminWalletAddress = wallet.address;
  } catch (err) {
    console.error('Failed to derive wallet address from private key:', err);
  }
}

const defaults = [
  {
    key: 'COPYRIGHT_CONTRACT_ADDRESS',
    value: process.env.COPYRIGHT_CONTRACT_ADDRESS || '',
    description: 'Address of the deployed CopyrightRegistry contract on the blockchain',
    type: 'string' as const
  },
  {
    key: 'COPYRIGHT_PAYMENT_AMOUNT',
    value: process.env.COPYRIGHT_PAYMENT_AMOUNT || '50000',
    description: 'Default copyright registration payment amount (TZS)',
    type: 'number' as const
  },
    {
      key: 'TRANSFER_PAYMENT_AMOUNT',
      value: process.env.TRANSFER_PAYMENT_AMOUNT || '25000',
      description: 'Default transfer payment amount (TZS)',
      type: 'number' as const
    },
    {
      key: 'LICENSING_MIN_AMOUNT',
      value: process.env.LICENSING_MIN_AMOUNT || '10000',
      description: 'Minimum licensing payment amount (TZS)',
      type: 'number' as const
    },
    {
      key: 'COSOTA_COMMISSION_PERCENTAGE',
      value: process.env.COSOTA_COMMISSION_PERCENTAGE || '10',
      description: 'COSOTA commission percentage',
      type: 'number' as const
    },
    {
      key: 'AUDIO_SIMILARITY_THRESHOLD',
      value: process.env.AUDIO_SIMILARITY_THRESHOLD || '0.98',
      description: 'Audio similarity threshold (0.0-1.0)',
      type: 'number' as const
    },
    {
      key: 'LYRICS_SIMILARITY_THRESHOLD',
      value: process.env.LYRICS_SIMILARITY_THRESHOLD || '0.8',
      description: 'Lyrics similarity threshold (0.0-1.0)',
      type: 'number' as const
    },
    {
      key: 'ADMIN_WALLET_ADDRESS',
      value: derivedAdminWalletAddress,
      description: 'Admin wallet address derived automatically from private key',
      type: 'string' as const
    },
    {
      key: 'MAX_FILE_SIZE',
      value: process.env.MAX_FILE_SIZE || '20',
      description: 'Maximum allowed file size for uploads (MB)',
      type: 'number' as const
    },
    {
      key: 'ALLOWED_FILE_TYPES',
      value: process.env.ALLOWED_FILE_TYPES || '.mp3,.wav,.ogg,.flac',
      description: 'Comma-separated list of allowed file types for uploads',
      type: 'string' as const
    },
    {
      key: 'MAINTENANCE_MODE',
      value: process.env.MAINTENANCE_MODE || 'false',
      description: 'Enable or disable system maintenance mode',
      type: 'boolean' as const
    },
    {
      key: 'COPYRIGHT_DURATION',
      value: process.env.COPYRIGHT_DURATION || '50',
      description: 'Copyright duration in years',
      type: 'number' as const
    },
  ];
  for (const setting of defaults) {
    const exists = await SystemSetting.findOne({ where: { key: setting.key } });
    if (!exists) {
      await SystemSetting.create(setting);
    }
  }

  // Insert missing keys
  for (const def of defaults) {
    const [setting, created] = await SystemSetting.findOrCreate({
      where: { key: def.key },
      defaults: def
    });
    if (!created && setting.get('value') === '' && def.value) {
      // Patch empty values on existing rows
      setting.set('value', def.value);
      await setting.save();
    }
  }

  // --- Auto-sync ADMIN_WALLET_ADDRESS in DB with derived value ---
  if (derivedAdminWalletAddress) {
    const [adminWalletSetting] = await SystemSetting.findOrCreate({
      where: { key: 'ADMIN_WALLET_ADDRESS' },
      defaults: {
        key: 'ADMIN_WALLET_ADDRESS',
        value: derivedAdminWalletAddress,
        description: 'Admin wallet address derived automatically from private key',
        type: 'string'
      }
    });
    if (adminWalletSetting.get('value') !== derivedAdminWalletAddress) {
      adminWalletSetting.set('value', derivedAdminWalletAddress);
      await adminWalletSetting.save();
    }
  }
}

export default SystemSetting;
