import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

function getPlanDetails(plan: string) {
  switch (plan) {
    case "3_day":
      return { price: 500 };
    case "7_day":
      return { price: 1000 };
    case "14_day":
      return { price: 1800 };
    case "30_day":
      return { price: 3000 };
    default:
      throw new Error(`Invalid plan selection: ${plan}`);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Get current user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { listingId, plan } = body;

    if (!listingId || !plan) {
      return NextResponse.json(
        { error: "Missing listingId or plan" },
        { status: 400 }
      );
    }

    // 2. Validate the plan
    let planPrice = 0;
    try {
      const planDetails = getPlanDetails(plan);
      planPrice = planDetails.price;
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 }
      );
    }

    // 3. Verify listing exists and belongs to the user
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, user_id")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized: You do not own this listing" },
        { status: 403 }
      );
    }

    // 4. Generate reference
    const reference = `sub_${crypto.randomUUID()}`;

    // 5. Create pending subscription record in DB
    const { error: insertError } = await supabase
      .from("subscriptions")
      .insert({
        listing_id: listingId,
        user_id: user.id,
        plan: plan,
        status: "pending",
        amount_paid: planPrice,
        paystack_reference: reference,
      });

    if (insertError) {
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` },
        { status: 500 }
      );
    }

    // 6. Initialize transaction on Paystack
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return NextResponse.json(
        { error: "Paystack secret key is missing in environment variables" },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: planPrice * 100, // Paystack works in kobo
        reference: reference,
        callback_url: `${appUrl}/payment-success?reference=${reference}`,
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      return NextResponse.json(
        { error: paystackData.message || "Failed to initialize payment with Paystack" },
        { status: 502 }
      );
    }

    // 7. Return authorization URL
    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      reference: reference,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
