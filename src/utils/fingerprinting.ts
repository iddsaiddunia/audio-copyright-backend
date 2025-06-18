import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { FINGERPRINT_API_URL } from './config';

export interface FingerprintResult {
  fingerprint_hash: string;
  duration: number;
  sample_rate: number;
  model_version: string;
  total_hashes: number;
  hash_map: Record<string, any>;
  success: boolean;
  message: string;
}

/**
 * Call the audio fingerprinting service and return the fingerprint result.
 * @param audioPath Absolute path to audio file
 */
export async function getAudioFingerprint(audioPath: string): Promise<FingerprintResult> {
  const form = new FormData();
  form.append('audio_file', fs.createReadStream(audioPath));
  const headers = form.getHeaders();
  const response = await axios.post(FINGERPRINT_API_URL, form, { headers });
  return response.data;
}
