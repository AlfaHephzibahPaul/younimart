import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import VerificationForm from "@/components/VerificationForm";

export default async function ResubmitVerificationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the user's profile to inspect verification status
  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", user.id)
    .single();

  // Redirect based on current verification status
  if (profile?.verification_status === "approved") {
    redirect("/");
  }

  if (profile?.verification_status === "pending") {
    redirect("/verification-pending");
  }

  // If the user isn't rejected, they shouldn't be on this page. Redirect to normal verify page.
  if (profile?.verification_status !== "rejected") {
    redirect("/verify");
  }

  // Get the latest rejected request to read the admin rejection note
  const { data: latestRequest } = await supabase
    .from("verification_requests")
    .select("admin_note")
    .eq("user_id", user.id)
    .eq("status", "rejected")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const rejectionReason = latestRequest?.admin_note || "Please review your documents and try again.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-brand-green hover:opacity-90 transition-opacity"
          >
            YOUnimart
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Resubmit verification documents
          </h1>
          <p className="mt-3 text-base text-gray-500 max-w-lg mx-auto">
            Please update your details or upload new documents for verification.
          </p>
        </div>

        {/* Rejection Note Red Box */}
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm text-sm text-red-900">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 shrink-0 text-red-500 mt-0.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 text-base">
                Your verification request was rejected
              </h3>
              <p className="mt-1 text-red-700">
                Reason from administration:
              </p>
              <div className="mt-2 rounded-lg bg-white/70 border border-red-200/50 px-4 py-3 font-medium italic text-gray-800">
                "{rejectionReason}"
              </div>
            </div>
          </div>
        </div>

        <VerificationForm submitButtonText="Resubmit Documents" />
      </div>
    </div>
  );
}
