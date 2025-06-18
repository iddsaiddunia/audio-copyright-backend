import { Model, DataTypes, Sequelize } from 'sequelize';

export interface OwnershipTransferAttributes {
  id: string;
  trackId: string;
  currentOwnerId: string;
  newOwnerId: string;
  status: 'requested' | 'approved' | 'published';
  paymentId: string;
  blockchainTx?: string | null;
  certificateUrl?: string | null;
  requestedAt: Date;
  publishedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class OwnershipTransfer extends Model<OwnershipTransferAttributes> implements OwnershipTransferAttributes {
  public id!: string;
  public trackId!: string;
  public currentOwnerId!: string;
  public newOwnerId!: string;
  public status!: 'requested' | 'approved' | 'published';
  public paymentId!: string;
  public blockchainTx?: string | null;
  public certificateUrl?: string | null;
  public requestedAt!: Date;
  public publishedAt?: Date | null;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

export function initOwnershipTransferModel(sequelize: Sequelize): typeof OwnershipTransfer {
  OwnershipTransfer.init(
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
      currentOwnerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      newOwnerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('requested', 'approved', 'published'),
        allowNull: false,
        defaultValue: 'requested',
      },
      paymentId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      blockchainTx: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      certificateUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      requestedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      publishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'ownership_transfers',
      timestamps: true,
    }
  );
  return OwnershipTransfer;
}
