import { createHash } from 'crypto';
import { cosineSimilarity } from './text';

/**
 * Compare two audio fingerprints using Hamming distance on their hashes.
 * Returns similarity in [0,1].
 */
export function fingerprintSimilarity(hashA: string, hashB: string): number {
  if (hashA.length !== hashB.length) return 0;
  let diff = 0;
  for (let i = 0; i < hashA.length; i++) {
    if (hashA[i] !== hashB[i]) diff++;
  }
  return 1 - diff / hashA.length;
}

/**
 * Compare two lyrics using cosine similarity over their TF vectors.
 * Returns similarity in [0,1].
 */
export function lyricsSimilarity(lyricsA: string, lyricsB: string): number {
  return cosineSimilarity(lyricsA, lyricsB);
}
