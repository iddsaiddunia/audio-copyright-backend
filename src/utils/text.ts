/**
 * Compute cosine similarity between two text strings using term frequency vectors.
 */
export function cosineSimilarity(a: string, b: string): number {
  const freq = (s: string) => {
    const map: Record<string, number> = {};
    s.toLowerCase().split(/\W+/).forEach(word => {
      if (!word) return;
      map[word] = (map[word] || 0) + 1;
    });
    return map;
  };
  const fa = freq(a);
  const fb = freq(b);
  const allWords = new Set([...Object.keys(fa), ...Object.keys(fb)]);
  let dot = 0, normA = 0, normB = 0;
  for (const w of allWords) {
    const va = fa[w] || 0;
    const vb = fb[w] || 0;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
