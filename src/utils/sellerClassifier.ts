// /src/utils/sellerClassifier.ts

export type SellerType = "private" | "dealer" | "unknown";

/**
 * Very simple, rule-based seller classifier.
 * This does NOT use your paid AI key yet – it's just heuristics
 * so we can prove the pipeline end-to-end.
 */
export default function classifySeller(html: string): SellerType {
  const lower = html.toLowerCase();

  // Heuristic keywords for dealerships
  const dealerKeywords = [
    "dealer licence",
    "dealer license",
    "lmct",
    "pty ltd",
    "pty. ltd",
    "abn",
    "registered motor dealer",
    "dealer number",
    "licence number",
    "licensed motor car trader",
  ];

  if (dealerKeywords.some((k) => lower.includes(k))) {
    return "dealer";
  }

  // Heuristic keywords for private sellers
  const privateKeywords = [
    "genuine reason for sale",
    "no time wasters",
    "no swaps",
    "no dealers",
    "rego until",
    "priced to sell",
    "one owner",
  ];

  if (privateKeywords.some((k) => lower.includes(k))) {
    return "private";
  }

  return "unknown";
}
