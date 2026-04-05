/** Canonical friendship pair: lexicographic order for stable unique key. */
export function sortUserPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}
