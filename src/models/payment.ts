import { Model, DataTypes, Sequelize } from 'sequelize';

export interface PaymentAttributes {
  id: string;
  trackId: string;
  artistId: string;
  amount: number;
  paymentType: 'registration' | 'licensing' | 'transfer';
  status: 'initial' | 'pending' | 'approved' | 'rejected';
  controlNumber?: string | null;
  amountPaid?: number | null;
  paidAt?: Date | null;
  expiry?: Date | null;
  licenseId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Payment extends Model<PaymentAttributes> implements PaymentAttributes {
  public id!: string;
  public trackId!: string;
  public artistId!: string;
  public amount!: number;
  public paymentType!: 'registration' | 'licensing' | 'transfer';
  public status!: 'initial' | 'pending' | 'approved' | 'rejected';
  public controlNumber?: string | null;
  public amountPaid?: number | null;
  public paidAt?: Date | null;
  public expiry?: Date;
  public licenseId?: string | null;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

export function initPaymentModel(sequelize: Sequelize): typeof Payment {
  Payment.init(
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
      artistId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      paymentType: {
        type: DataTypes.ENUM('registration', 'licensing', 'transfer'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('initial', 'pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'initial',
      },
      controlNumber: {
        type: DataTypes.STRING(12),
        allowNull: true,
        unique: true,
      },
      amountPaid: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expiry: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // will be set in hook
      },
      licenseId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'licenses',
          key: 'id'
        }
      },
    },
    {
      sequelize,
      tableName: 'payments',
      timestamps: true,
      hooks: {
        beforeCreate: (payment: Payment) => {
          if (!payment.expiry && payment.createdAt) {
            payment.expiry = new Date(payment.createdAt.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
          } else if (!payment.expiry) {
            payment.expiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          }
        }
      }
    }
  );
  return Payment;
}

// Set up associations after both models are initialized
import { Track } from './track';
import { User } from './user';

export function associatePaymentModels() {
  Payment.belongsTo(User, { as: 'artist', foreignKey: 'artistId' });
  Payment.belongsTo(Track, { foreignKey: 'trackId', as: 'track' });
  // Add relationship with License model
  Payment.belongsTo(require('./license').License, { foreignKey: 'licenseId', as: 'license' });
  // If needed: Track.hasMany(Payment, { as: 'payments', foreignKey: 'trackId' });
}
