/**
 * Very lightweight seller-type heuristic based on listing HTML text
 * Works offline and does not rely on AI — safe fallback classifier
 */

export type SellerType = "dealer" | "private" | "unknown";

export function classifySeller(html: string): SellerType {
  const lower = html.toLowerCase();

  const dealerTerms = [
    "dealer",
    "dealership",
    "abn",
    "warranty",
    "statutory warranty",
    "licensed motor dealer",
    "drive away",
    "on-road costs",
  ];

  const privateTerms = [
    "rego",
    "genuine reason for sale",
    "no warranty",
    "needs gone",
    "priced to sell",
  ];

  if (dealerTerms.some((t) => lower.includes(t))) {
    return "dealer";
  }

  if (privateTerms.some((t) => lower.includes(t))) {
    return "private";
  }

  return "unknown";
}
