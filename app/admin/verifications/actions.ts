"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveVerification(requestId: string, userId: string) {
  const supabase = await createClient();

  // 1. Verify that the current user exists and is an admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_admin) {
    throw new Error("Unauthorized. Admin privileges required.");
  }

  // 2. Update the verification request status to 'approved'
  const { error: requestError } = await supabase
    .from("verification_requests")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (requestError) {
    throw new Error(`Failed to update request: ${requestError.message}`);
  }

  // 3. Update the profile verification status and is_verified flag
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      verification_status: "approved",
      is_verified: true,
    })
    .eq("id", userId);

  if (profileError) {
    throw new Error(`Failed to update profile: ${profileError.message}`);
  }

  revalidatePath("/admin/verifications");
}

export async function rejectVerification(
  requestId: string,
  userId: string,
  rejectionReason: string
) {
  const supabase = await createClient();

  // 1. Verify that the current user exists and is an admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_admin) {
    throw new Error("Unauthorized. Admin privileges required.");
  }

  if (!rejectionReason.trim()) {
    throw new Error("Rejection note is required.");
  }

  // 2. Update the verification request status to 'rejected' and add the rejection reason
  const { error: requestError } = await supabase
    .from("verification_requests")
    .update({
      status: "rejected",
      admin_note: rejectionReason,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (requestError) {
    throw new Error(`Failed to update request: ${requestError.message}`);
  }

  // 3. Update the profile verification status to 'rejected' (is_verified remains false)
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      verification_status: "rejected",
    })
    .eq("id", userId);

  if (profileError) {
    throw new Error(`Failed to update profile: ${profileError.message}`);
  }

  revalidatePath("/admin/verifications");
}
