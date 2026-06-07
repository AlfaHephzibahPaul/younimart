import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user session
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
    const { document_type, document_url } = body;

    if (!document_type || !document_url) {
      return NextResponse.json(
        { error: "Missing document_type or document_url" },
        { status: 400 }
      );
    }

    // 1. Create verification_requests record
    const { error: insertError } = await supabase
      .from("verification_requests")
      .insert({
        user_id: user.id,
        document_type,
        document_url,
        status: "pending",
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // 2. Update user profile verification_status to 'pending'
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        verification_status: "pending",
      })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
