export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.status(200).json({
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? "SET" : "NOT_SET",
    keysAvailable: Object.keys(process.env).filter((k) =>
      k.includes("GOOGLE")
    ),
  });
}
