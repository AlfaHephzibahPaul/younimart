import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

function calculateExpiry(startsAt: Date, plan: string): Date {
  const expiresAt = new Date(startsAt);
  switch (plan) {
    case "3_day":
      expiresAt.setDate(expiresAt.getDate() + 3);
      break;
    case "7_day":
      expiresAt.setDate(expiresAt.getDate() + 7);
      break;
    case "14_day":
      expiresAt.setDate(expiresAt.getDate() + 14);
      break;
    case "30_day":
      expiresAt.setDate(expiresAt.getDate() + 30);
      break;
    default:
      expiresAt.setDate(expiresAt.getDate() + 7); // Default fallback
  }
  return expiresAt;
}

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!signature) {
      return new Response("Missing Paystack signature", { status: 401 });
    }

    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("PAYSTACK_WEBHOOK_SECRET is missing from environment");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Verify signature
    const hash = crypto
      .createHmac("sha512", webhookSecret)
      .update(payload)
      .digest("hex");

    if (hash !== signature) {
      console.warn("Invalid Paystack signature verification failed.");
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(payload);

    // Only process charge.success events
    if (event.event === "charge.success") {
      const { reference, status: paymentStatus } = event.data;

      if (paymentStatus === "success" && reference) {
        const supabase = await createClient();

        // 1. Fetch the subscription
        const { data: sub, error: subError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("paystack_reference", reference)
          .maybeSingle();

        if (subError) {
          console.error("Error fetching subscription:", subError);
          return new Response("Database error", { status: 500 });
        }

        if (!sub) {
          console.warn(`No subscription record found for reference: ${reference}`);
          return new Response("Subscription not found", { status: 404 });
        }

        // Idempotency: If already active, return 200 OK immediately
        if (sub.status === "active") {
          return NextResponse.json({ success: true, message: "Already processed" });
        }

        const startsAt = new Date();
        const expiresAt = calculateExpiry(startsAt, sub.plan);

        // 2. Update the subscription record to active
        const { error: subUpdateError } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            starts_at: startsAt.toISOString(),
            expires_at: expiresAt.toISOString(),
          })
          .eq("id", sub.id);

        if (subUpdateError) {
          console.error("Failed to update subscription to active:", subUpdateError);
          return new Response("Database update error", { status: 500 });
        }

        // 3. Update the listing record to active
        const { error: listingUpdateError } = await supabase
          .from("listings")
          .update({
            status: "active",
          })
          .eq("id", sub.listing_id);

        if (listingUpdateError) {
          console.error("Failed to update listing status to active:", listingUpdateError);
          return new Response("Database update error", { status: 500 });
        }

        console.log(`Successfully activated listing ${sub.listing_id} via subscription reference ${reference}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return new Response(err.message || "Webhook error", { status: 500 });
  }
}
