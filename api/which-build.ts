import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import fs from "fs";
import path from "path";

export const config = { runtime: "nodejs" };

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const filePath = path.join(process.cwd(), "api", "analyze-listing.ts");
    const file = fs.readFileSync(filePath, "utf8");

    const hash = crypto.createHash("md5").update(file).digest("hex");

    res.status(200).json({
      ok: true,
      deployedAt: new Date().toISOString(),
      envHasKey: !!process.env.GOOGLE_API_KEY,
      analyzeListingHash: hash,
    });
  } catch (err: any) {
    console.error("which-build failed", err?.message || err);
    res.status(500).json({
      ok: false,
      error: "WHICH_BUILD_FAILED",
      detail: err?.message || "Unknown error",
    });
  }
}
