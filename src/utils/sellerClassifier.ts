// src/utils/sellerClassifier.ts

export type SellerType = 'private' | 'dealer';

/**
 * Very simple HTML heuristic to guess whether the listing is
 * from a dealer or a private seller.
 *
 * Returns:
 *   - 'dealer'
 *   - 'private'
 *   - null if we can't tell
 */
export default function classifySeller(html: string): SellerType | null {
  const lower = html.toLowerCase();

  // Phrases that usually show up on dealer sites
  const dealerHints = [
    'dealer licence',
    'dealer license',
    'dealer license number',
    'abn',
    'pty ltd',
    'our dealership',
    'our team',
    'finance available',
    'trade-in welcome',
    'fixed price',
    'workshop tested',
    'warranty available',
  ];

  // Phrases that often show up on private listings
  const privateHints = [
    'private seller',
    'no dealers',
    'genuine reason for sale',
    'rego',
    'rego till',
    'rwc supplied',
    'roadworthy included',
  ];

  const dealerScore = dealerHints.filter((h) => lower.includes(h)).length;
  const privateScore = privateHints.filter((h) => lower.includes(h)).length;

  if (dealerScore === 0 && privateScore === 0) {
    return null;
  }

  return dealerScore >= privateScore ? 'dealer' : 'private';
}
