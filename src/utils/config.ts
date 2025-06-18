import dotenv from 'dotenv';
dotenv.config();

export const AUDIO_SIMILARITY_THRESHOLD = parseFloat(process.env.AUDIO_SIMILARITY_THRESHOLD || '0.5');
export const LYRICS_SIMILARITY_THRESHOLD = parseFloat(process.env.LYRICS_SIMILARITY_THRESHOLD || '0.8');

export const FINGERPRINT_API_URL = process.env.FINGERPRINT_API_URL || 'http://localhost:8000/api/fingerprint';

export const COPYRIGHT_PAYMENT_AMOUNT = parseInt(process.env.COPYRIGHT_PAYMENT_AMOUNT || '100', 10);
export const TRANSFER_PAYMENT_AMOUNT = parseInt(process.env.TRANSFER_PAYMENT_AMOUNT || '25000', 10);
export const LICENSING_MIN_AMOUNT = parseInt(process.env.LICENSING_MIN_AMOUNT || '10000', 10);
export const COSOTA_COMMISSION_PERCENTAGE = parseFloat(process.env.COSOTA_COMMISSION_PERCENTAGE || '10');

export const BLOCKCHAIN_PROVIDER_URL = process.env.BLOCKCHAIN_PROVIDER_URL || 'http://localhost:8545';
export const BLOCKCHAIN_PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || '';
export const COPYRIGHT_CONTRACT_ADDRESS = process.env.COPYRIGHT_CONTRACT_ADDRESS || '';

