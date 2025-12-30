import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import fs from "fs";
import path from "path";

export const config = { runtime: "nodejs" };

function safeHashFile(filePath: string) {
  try {
    const file = fs.readFileSync(filePath, "utf8");
    return crypto.createHash("md5").update(file).digest("hex");
  } catch {
    return null;
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Paths to try in different environments
    const candidates = [
      path.join(process.cwd(), "api", "analyze-listing.ts"),  // local dev
      path.join(process.cwd(), ".next", "server", "pages", "api", "analyze-listing.js"), // Next style
      path.join(process.cwd(), "api", "analyze-listing.js"),  // compiled JS on Vercel
      path.join("/var/task", "api", "analyze-listing.js"),    // serverless runtime
    ];

    const hashes = candidates
      .map(p => ({ file: p, hash: safeHashFile(p) }))
      .filter(x => x.hash);

    res.status(200).json({
      ok: true,
      deployedAt: new Date().toISOString(),
      envHasKey: !!process.env.GOOGLE_API_KEY,
      filesFound: hashes,
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
