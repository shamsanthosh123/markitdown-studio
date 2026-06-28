export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

// Rough price per 1M input tokens (USD)
export const MODEL_PRICING: Record<string, number> = {
  "GPT-4o": 2.5,
  "Claude Sonnet": 3.0,
  "Gemini 1.5 Pro": 1.25,
};

export function estCost(tokens: number, model: string): number {
  const price = MODEL_PRICING[model] ?? 0;
  return (tokens / 1_000_000) * price;
}
