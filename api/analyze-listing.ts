// api/analyze-listing.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import classifySeller from '../src/utils/sellerClassifier';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { listingUrl } = (req.body ?? {}) as { listingUrl?: string };

    if (!listingUrl || typeof listingUrl !== 'string') {
      return res.status(400).json({ error: 'Missing listingUrl' });
    }

    console.log('📥 Incoming listing URL:', listingUrl);

    // Fetch the listing HTML from the URL the user entered
    console.log('📡 Fetching listing HTML…', listingUrl);
    const response = await fetch(listingUrl);

    if (!response.ok) {
      console.error(
        '❌ Failed to fetch listing HTML',
        response.status,
        response.statusText
      );
      return res
        .status(500)
        .json({ error: 'Failed to fetch listing HTML from source site' });
    }

    const html = await response.text();

    // Classify seller type from the HTML
    console.log('🧩 Classifying seller type…');
    const sellerType = classifySeller(html) ?? 'unknown';

    // Minimal “analysis” object that your frontend can store/use
    const analysis = {
      sellerType,
      sections: [
        {
          title: 'Seller trust indicators',
          content:
            sellerType === 'dealer'
              ? 'Listing appears to come from a dealership website.'
              : sellerType === 'private'
              ? 'Listing appears to come from an individual / private seller.'
              : 'Could not confidently determine whether this is a dealer or private seller.',
        },
      ],
    };

    return res.status(200).json({
      ok: true,
      analysisSource: 'live',
      sellerType,
      analysis,
      htmlLength: html.length,
    });
  } catch (err: any) {
    console.error('❌ analyze-listing error', err);
    return res
      .status(500)
      .json({ error: 'Server error in analyze-listing handler' });
  }
}
