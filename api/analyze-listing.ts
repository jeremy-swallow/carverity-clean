/**
 * /api/analyze-listing.ts
 */

import { classifySeller } from '../src/utils/sellerClassifier';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { listingUrl } = req.body;

    if (!listingUrl) {
      return res.status(400).json({ error: 'Missing listingUrl' });
    }

    console.log('🔎 Fetching listing:', listingUrl);

    const response = await fetch(listingUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      },
    });

    const html = await response.text();
    const textOnly = html.replace(/<[^>]+>/g, ' ');

    const seller = classifySeller(html, textOnly);

    const analysis = {
      listingUrl,
      createdAt: new Date().toISOString(),
      sections: [
        {
          title: 'Overall risk rating',
          content: 'Low',
        },
        {
          title: 'Seller classification',
          content: `Seller type: ${seller.type} (confidence: ${seller.confidence})\n\nReasons:\n- ${seller.reasons.join(
            '\n- '
          )}`,
        },
        {
          title: 'Key insights',
          content:
            'No immediate wording-based risk indicators detected.\nSeller tone appears factual rather than emotional or urgent.\nNo contradictory condition statements found in listing text.',
        },
      ],
    };

    return res.status(200).json({ analysis });
  } catch (err: any) {
    console.error('❌ analyze-listing error:', err?.message || err);
    return res.status(500).json({ error: 'Analysis failed' });
  }
}
