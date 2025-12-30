export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFileSync } from "fs";
import crypto from "crypto";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const hash = crypto
    .createHash("md5")
    .update(readFileSync("./api/analyze-listing.ts", "utf8"))
    .digest("hex");

  res.status(200).json({
    deployedAt: new Date().toISOString(),
    envHasKey: !!process.env.GOOGLE_API_KEY,
    analyzeListingHash: hash,
  });
}
