export function normalizeItemName(name: string): string {
  if (!name) return "";
  let n = name.trim().toLowerCase();
  // Remove simple plurals
  if (n.endsWith("oes")) {
    n = n.slice(0, -2); // tomatoes -> tomatoe (which is fine for fuzzy) or handle specific:
    if (n === "tomatoe") n = "tomato";
    if (n === "potatoe") n = "potato";
  } else if (n.endsWith("s") && !n.endsWith("ss") && !n.endsWith("is")) {
    n = n.slice(0, -1);
  }
  // Collapse whitespace
  return n.replace(/\s+/g, " ");
}

export function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return matrix[b.length][a.length];
}

export function findBestMatch(newName: string, existingItems: { id: string, name: string, quantity: number }[], threshold: number = 0.85): { id: string, quantity: number } | null {
  const normalizedNew = normalizeItemName(newName);
  if (!normalizedNew) return null;

  let bestMatch = null;
  let highestSimilarity = 0;

  for (const item of existingItems) {
    const normalizedExisting = normalizeItemName(item.name);
    const distance = levenshtein(normalizedNew, normalizedExisting);
    const maxLength = Math.max(normalizedNew.length, normalizedExisting.length);
    const similarity = maxLength === 0 ? 1 : 1 - distance / maxLength;

    if (similarity >= threshold && similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = item;
    }
  }

  if (bestMatch) {
    return { id: bestMatch.id, quantity: bestMatch.quantity };
  }
  return null;
}
