type MatchableProduct = { id: string; name: string; aliases?: string[] };

function tokens(value: string): string[] {
  return (
    value
      .normalize("NFKC")
      .toLocaleLowerCase("en")
      .replace(/(\d),(\d)/g, "$1.$2")
      .replace(/\s*\/\s*/g, "/")
      .match(/[\p{L}]+|\d+(?:\.\d+)?(?:\/\d+)?/gu) || []
  );
}

function editSimilarity(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++)
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    previous = current;
  }
  return 1 - previous[b.length] / Math.max(a.length, b.length, 1);
}

function similarity(source: string[], target: string[]): number {
  const a = source.join(""),
    b = target.join("");
  if (!a || !b) return 0;
  if (a === b) return 1;
  const left = new Set(source),
    right = new Set(target);
  const overlap = [...left].filter((word) => right.has(word)).length;
  return 0.7 * editSimilarity(a, b) + 0.3 * ((2 * overlap) / (left.size + right.size));
}

function sameNumbers(a: string[], b: string[]): boolean {
  const numbers = (parts: string[]) => parts.filter((part) => /^\d/.test(part)).join("|");
  const variants = new Set([
    "mm",
    "cm",
    "m",
    "cc",
    "ml",
    "l",
    "kg",
    "gr",
    "g",
    "inch",
    "inci",
    "putih",
    "hitam",
    "merah",
    "biru",
    "hijau",
    "kuning",
    "coklat",
    "black",
    "white",
    "red",
    "blue",
    "green",
    "yellow",
    "brown",
    "grey",
    "gray",
    "bening",
    "clear",
    "orange",
    "silver",
    "gold",
    "aw",
  ]);
  const attributes = (parts: string[]) =>
    parts
      .filter((part) => variants.has(part))
      .sort()
      .join("|");
  return numbers(a) === numbers(b) && attributes(a) === attributes(b);
}

export function rankProductMatches<T extends MatchableProduct>(
  name: string,
  products: T[],
): {
  candidates: T[];
  selected: T | null;
} {
  const source = tokens(name);
  const ranked = products
    .map((product) => {
      const names = [product.name, ...(product.aliases || [])].map(tokens);
      const score = Math.max(...names.map((target) => similarity(source, target)));
      const safeScore = Math.max(
        ...names
          .filter((target) => sameNumbers(source, target))
          .map((target) => similarity(source, target)),
        0,
      );
      return { product, score, safeScore };
    })
    .filter((match) => match.score >= 0.45)
    .sort((a, b) => b.score - a.score || a.product.id.localeCompare(b.product.id));
  const top = ranked[0],
    second = ranked[1];
  const uniqueExact = top?.safeScore === 1 && (!second || second.score < 1);
  const strongSimilar =
    top &&
    source.join("").length >= 8 &&
    top.safeScore >= 0.9 &&
    top.safeScore - (second?.score || 0) >= 0.08;
  return {
    candidates: ranked.slice(0, 5).map((match) => match.product),
    selected: top && (uniqueExact || strongSimilar) ? top.product : null,
  };
}
