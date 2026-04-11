// ── App Lock Crypto Utilities ────────────────────────────────────────
// Uses the native Web Crypto API for SHA-256 hashing.
// No external dependencies required.

/**
 * Hash a raw string value using SHA-256.
 * Returns the hex-encoded digest.
 */
export async function hashValue(raw: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify a raw input against a stored SHA-256 hash.
 */
export async function verifyHash(
  raw: string,
  storedHash: string,
): Promise<boolean> {
  const inputHash = await hashValue(raw);
  return inputHash === storedHash;
}

/**
 * Convert a pattern grid selection (array of dot indices 0-8) to a hashable string.
 * Example: [0, 1, 4, 7, 8] → "0-1-4-7-8"
 */
export function patternToString(points: number[]): string {
  return points.join("-");
}
