// api/stripe-webhook.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET!;

if (!STRIPE_SECRET_KEY)
  throw new Error("Missing STRIPE_SECRET_KEY");
if (!STRIPE_WEBHOOK_SECRET)
  throw new Error("Missing STRIPE_WEBHOOK_SECRET");

const stripe = new Stripe(STRIPE_SECRET_KEY);

/* =========================================================
   Raw body reader (Stripe requirement)
========================================================= */
async function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) =>
      chunks.push(
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      )
    );
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function toInt(value: unknown): number {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    return res
      .status(400)
      .send("Missing stripe-signature");
  }

  let event: Stripe.Event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return res
      .status(400)
      .send("Webhook signature verification failed");
  }

  try {
    if (event.type !== "checkout.session.completed") {
      return res.status(200).json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return res.status(200).json({ received: true });
    }

    if (session.metadata?.purchase_type !== "credit_pack") {
      return res.status(200).json({ received: true });
    }

    const customerId = session.customer as string;
    if (!customerId) {
      return res.status(200).json({ received: true });
    }

    const items =
      await stripe.checkout.sessions.listLineItems(
        session.id,
        { expand: ["data.price"] }
      );

    let creditsToAdd = 0;

    for (const item of items.data) {
      const qty = item.quantity ?? 1;
      const price = item.price;
      creditsToAdd +=
        toInt(price?.metadata?.credits_granted) * qty;
    }

    if (creditsToAdd <= 0) {
      return res.status(200).json({ received: true });
    }

    const customer =
      await stripe.customers.retrieve(customerId);

    if (customer.deleted) {
      return res.status(200).json({ received: true });
    }

    const current = toInt(
      customer.metadata?.carverity_credits
    );

    await stripe.customers.update(customerId, {
      metadata: {
        ...customer.metadata,
        carverity_credits: String(
          current + creditsToAdd
        ),
      },
    });

    return res
      .status(200)
      .json({ received: true, creditsAdded: creditsToAdd });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).send("Webhook error");
  }
}
