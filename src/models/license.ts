import { Model, DataTypes, Sequelize } from 'sequelize';

export interface LicenseAttributes {
  id: string;
  trackId: string;
  requesterId: string; // User who requests the license (licensee or artist)
  ownerId: string;     // Track owner (artist)
  purpose: string;     // Purpose of licensing
  duration: number;    // Duration in months
  territory: string;   // Geographic territory for license
  usageType: string;   // How the track will be used
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'published';
  rejectionReason?: string | null;
  certificateUrl?: string | null;
  blockchainTx?: string | null; // Blockchain transaction hash
  createdAt?: Date;
  updatedAt?: Date;
}

export class License extends Model<LicenseAttributes> implements LicenseAttributes {
  public id!: string;
  public trackId!: string;
  public requesterId!: string;
  public ownerId!: string;
  public purpose!: string;
  public duration!: number;
  public territory!: string;
  public usageType!: string;
  public status!: 'pending' | 'approved' | 'rejected' | 'paid' | 'published';
  public rejectionReason?: string | null;
  public certificateUrl?: string | null;
  public blockchainTx?: string | null;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

export function initLicenseModel(sequelize: Sequelize): typeof License {
  License.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      trackId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      requesterId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      purpose: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      duration: {
        type: DataTypes.INTEGER, // Duration in months
        allowNull: false,
      },
      territory: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      usageType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid', 'published'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      certificateUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      blockchainTx: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'licenses',
      timestamps: true,
    }
  );
  return License;
}

// Set up associations after all models are initialized
import { Track } from './track';
import { User } from './user';
import { Payment } from './payment';

export function associateLicenseModels() {
  License.belongsTo(Track, { as: 'track', foreignKey: 'trackId' });
  License.belongsTo(User, { as: 'requester', foreignKey: 'requesterId' });
  License.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
  License.hasMany(Payment, { as: 'payments', foreignKey: 'licenseId' });
}
