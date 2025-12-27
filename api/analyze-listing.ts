export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from '@vercel/node';

// -----------------------------
// Inline seller classifier
// -----------------------------
function classifySeller(html: string): 'dealer' | 'private' | 'unknown' {
  const lower = html.toLowerCase();

  const dealerTerms = [
    'dealer', 'dealership', 'warranty', 'abn',
    'licensed motor dealer', 'statutory warranty',
  ];

  const privateTerms = [
    'rego', 'no warranty', 'priced to sell',
    'genuine reason for sale'
  ];

  if (dealerTerms.some(t => lower.includes(t))) return 'dealer';
  if (privateTerms.some(t => lower.includes(t))) return 'private';

  return 'unknown';
}

// -----------------------------
// API Handler
// -----------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { listingUrl } = req.body ?? {};

    if (!listingUrl) {
      return res.status(400).json({ error: 'Missing listingUrl' });
    }

    console.log('🔍 Fetching listing HTML:', listingUrl);

    const response = await fetch(listingUrl);
    const html = await response.text();

    console.log('🧩 Classifying seller...');
    const sellerType = classifySeller(html);

    return res.status(200).json({
      ok: true,
      analysisSource: 'live',
      sellerType,
      htmlLength: html.length,
      signals: []
    });

  } catch (err: any) {
    console.error('❌ API error:', err?.message || err);

    return res.status(500).json({
      ok: false,
      error: 'ANALYSIS_FAILED',
      detail: err?.message || 'Unknown error'
    });
  }
}
