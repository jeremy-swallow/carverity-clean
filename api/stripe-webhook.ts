// api/stripe-webhook.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}
if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  // IMPORTANT:
  // Leave apiVersion undefined to avoid TS literal mismatch.
});

/* =========================================================
   Raw body reader (required by Stripe)
========================================================= */
async function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    );
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parsePositiveInt(value: unknown): number {
  const n =
    typeof value === "string"
      ? parseInt(value, 10)
      : typeof value === "number"
      ? value
      : NaN;

  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    return res.status(400).send("Missing stripe-signature");
  }

  let event: Stripe.Event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send("Invalid signature");
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== "paid") {
        return res.status(200).json({ received: true, ignored: "not_paid" });
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      if (!paymentIntentId) {
        return res.status(200).json({ received: true, ignored: "no_payment_intent" });
      }

      const creditsToAdd = parsePositiveInt(session.metadata?.credits_granted);

      if (creditsToAdd <= 0) {
        return res.status(200).json({ received: true, ignored: "no_credits" });
      }

      const customerId = typeof session.customer === "string" ? session.customer : null;

      if (!customerId) {
        return res.status(200).json({ received: true, ignored: "no_customer" });
      }

      // Idempotency gate on PaymentIntent metadata
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (pi.metadata?.carverity_credits_applied === "true") {
        return res.status(200).json({ received: true, ignored: "already_applied" });
      }

      const customer = await stripe.customers.retrieve(customerId);

      if ((customer as any).deleted) {
        return res.status(500).send("Customer deleted");
      }

      const current = parsePositiveInt((customer as Stripe.Customer).metadata?.carverity_credits);
      const next = current + creditsToAdd;

      await stripe.customers.update(customerId, {
        metadata: {
          ...(customer as Stripe.Customer).metadata,
          carverity_credits: String(next),
        },
      });

      await stripe.paymentIntents.update(paymentIntentId, {
        metadata: {
          ...pi.metadata,
          carverity_credits_applied: "true",
          carverity_credits_added: String(creditsToAdd),
        },
      });

      return res.status(200).json({
        received: true,
        creditsAdded: creditsToAdd,
        newBalance: next,
      });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("stripe-webhook error:", err);
    return res.status(500).send("Webhook handler error");
  }
}
