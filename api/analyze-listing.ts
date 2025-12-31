// api/analyze-listing.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadProgress, saveProgress, type ScanProgress } from '../src/utils/scanProgress';

type ExtractedVehicle = {
  make?: string;
  model?: string;
  year?: string;
  variant?: string;
  importStatus?: string;
};

type ExtractServiceResponse = {
  ok: boolean;
  source?: string;
  title?: string;
  extracted?: ExtractedVehicle;
  error?: string;
};

/**
 * Call the existing /api/extract-vehicle-from-listing endpoint
 * from the server side so the browser only hits /api/analyze-listing.
 */
async function runExtraction(url: string): Promise<ExtractServiceResponse> {
  const base =
    process.env.VERCEL_URL && process.env.VERCEL_URL.length > 0
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

  const resp = await fetch(`${base}/api/extract-vehicle-from-listing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`extract-vehicle-from-listing failed: ${text}`);
  }

  return (await resp.json()) as ExtractServiceResponse;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const { url } = (req.body || {}) as { url?: string };

    if (!url) {
      return res.status(400).json({ ok: false, error: 'Missing URL' });
    }

    // 1) Run extraction via the helper API
    const extraction = await runExtraction(url);
    console.log('ANALYSIS RESULT >>>', extraction);

    if (!extraction.ok) {
      throw new Error(extraction.error || 'Extraction failed');
    }

    const extracted = (extraction.extracted || {}) as ExtractedVehicle;

    // 2) Load existing scan progress (may be null)
    const existing: ScanProgress | null = loadProgress();

    // 3) Merge vehicle fields safely
    const vehicle = {
      make: extracted.make ?? existing?.vehicle?.make ?? '',
      model: extracted.model ?? existing?.vehicle?.model ?? '',
      year: extracted.year ?? existing?.vehicle?.year ?? '',
      variant: extracted.variant ?? existing?.vehicle?.variant ?? '',
      importStatus:
        extracted.importStatus ??
        existing?.vehicle?.importStatus ??
        'Sold new in Australia (default)',
    };

    // 4) Persist scan progress
    saveProgress({
      ...(existing || {}),
      type: 'online',
      step: 'online/vehicle',
      listingUrl: url,
      vehicle,
    });

    console.log('✔ Stored vehicle:', vehicle);

    // 5) Return JSON for the frontend
    return res.status(200).json({
      ok: true,
      source: extraction.source ?? 'analysis-parser',
      title: extraction.title ?? '',
      extracted: vehicle,
    });
  } catch (err: any) {
    console.error('❌ analyze-listing failed:', err);

    // Always return JSON so the frontend .json() call never blows up
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Server error',
    });
  }
}
