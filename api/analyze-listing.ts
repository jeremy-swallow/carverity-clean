import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("Analyze listing request", req.body);

    return res.json({
      ok: true,
      message: "analyze-listing placeholder working",
    });
  } catch (err: any) {
    console.error("analyze-listing error", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Analyze failed",
    });
  }
}
