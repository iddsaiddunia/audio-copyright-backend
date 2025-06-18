import { Model, DataTypes, Sequelize } from 'sequelize';

export interface TrackAttributes {
  blockchainTx?: string; // Blockchain transaction hash
  id: string;
  title: string;
  artistId: string;
  filename: string;
  genre: string;
  releaseYear: string;
  description: string;
  lyrics: string;
  collaborators: string;
  isAvailableForLicensing: boolean;
  licenseFee: number;
  licenseTerms: string;
  duration?: number;
  fingerprint?: string;
  status: 'pending' | 'approved' | 'rejected' | 'copyrighted';
  createdAt?: Date;
  updatedAt?: Date;
}

export class Track extends Model<TrackAttributes> implements TrackAttributes {
  public blockchainTx?: string; // Blockchain transaction hash
  public id!: string;
  public title!: string;
  public artistId!: string;
  public filename!: string;
  public genre!: string;
  public releaseYear!: string;
  public description!: string;
  public lyrics!: string;
  public collaborators!: string;
  public isAvailableForLicensing!: boolean;
  public licenseFee!: number;
  public licenseTerms!: string;
  public duration?: number;
  public fingerprint?: string;
  public status!: 'pending' | 'approved' | 'rejected' | 'copyrighted';
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

export function initTrackModel(sequelize: Sequelize): typeof Track {
  Track.init(
    {
      blockchainTx: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      artistId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      genre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      releaseYear: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lyrics: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      collaborators: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isAvailableForLicensing: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      licenseFee: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      licenseTerms: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      duration: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      fingerprint: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'copyrighted'),
        allowNull: false,
        defaultValue: 'pending',
      },
    },
    {
      sequelize,
      tableName: 'tracks',
      timestamps: true,
    }
  );
  return Track;
}

// Association for payments, to be called after all models are initialized
import { Payment } from './payment';
import { User } from './user';
export function associateTrackModels() {
  Track.hasMany(Payment, { as: 'payments', foreignKey: 'trackId' });
  Track.belongsTo(User, { as: 'artist', foreignKey: 'artistId' });
}


