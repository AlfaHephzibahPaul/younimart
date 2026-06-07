import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import VerificationForm from "@/components/VerificationForm";

export default async function VerifyPage() {
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

  if (profile?.verification_status === "rejected") {
    redirect("/resubmit-verification");
  }

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
            One last step — verify your university
          </h1>
          <p className="mt-3 text-base text-gray-500 max-w-lg mx-auto">
            We verify all users to keep YOUnimart safe. This usually takes under 24 hours.
          </p>
        </div>

        <VerificationForm submitButtonText="Submit for Verification" />
      </div>
    </div>
  );
}
