import { DataTypes, Model, Sequelize } from 'sequelize';

export interface UserAttributes {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  phoneNumber: string;
  idNumber: string;
  role: 'admin' | 'artist' | 'licensee';
  adminType?: 'super' | 'content' | 'technical' | 'financial' | null;
  isVerified: boolean;
  status: 'active' | 'inactive' | 'suspended';
  walletAddress?: string | null;
  verificationDocumentType?: 'passport' | 'national_id' | 'driving_license' | null;
  verificationDocumentUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Model<UserAttributes> implements UserAttributes {
  public id!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public passwordHash!: string;
  public phoneNumber!: string;
  public idNumber!: string;
  public role!: 'admin' | 'artist' | 'licensee';
  public adminType?: 'super' | 'content' | 'technical' | 'financial';
  public isVerified!: boolean;
  public status!: 'active' | 'inactive' | 'suspended';
  public walletAddress?: string | null;
  public verificationDocumentType?: 'passport' | 'national_id' | 'driving_license' | null;
  public verificationDocumentUrl?: string | null;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

export function initUserModel(sequelize: Sequelize): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      idNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('admin', 'artist', 'licensee'),
        allowNull: false,
        defaultValue: 'artist',
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      adminType: {
        type: DataTypes.ENUM('super', 'content', 'technical', 'financial'),
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        allowNull: false,
        defaultValue: 'active',
      },
      walletAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      verificationDocumentType: {
        type: DataTypes.ENUM('passport', 'national_id', 'driving_license'),
        allowNull: true,
        defaultValue: null,
      },
      verificationDocumentUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: true,
    }
  );
  return User;
}

// Utility: Create a default super admin if none exists
import { Payment } from './payment';

export function associateUserModels() {
  User.hasMany(Payment, { as: 'payments', foreignKey: 'artistId' });
}

import { Track } from './track';

export function associateTrackModels() {
  Track.belongsTo(User, { as: 'artist', foreignKey: 'artistId' });
}


import bcrypt from 'bcrypt';
export async function ensureSuperAdmin() {
  const existing = await User.findOne({ where: { role: 'admin', adminType: 'super' } });
  if (!existing) {
    const passwordHash = await bcrypt.hash('SuperSecure123!', 10);
    await User.create({
      id: require('uuid').v4(),
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@cosota.com',
      passwordHash,
      phoneNumber: '+255000000000',
      idNumber: 'COSOTA-SUPERADMIN',
      role: 'admin',
      adminType: 'super',
      isVerified: true,
      status: 'active',
    });
    console.log('[SYSTEM] Super admin created: superadmin@cosota.com');
  }
}

