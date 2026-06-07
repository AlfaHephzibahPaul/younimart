import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import PlansClient from "./PlansClient";

type SearchParams = Promise<{
  listing?: string;
}>;

interface PageProps {
  searchParams: SearchParams;
}

export const dynamic = "force-dynamic";

export default async function SubscriptionPlansPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const listingId = params.listing;

  if (!listingId) {
    redirect("/");
  }

  const supabase = await createClient();

  // 1. Get current user session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Fetch the listing
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, title, user_id, status")
    .eq("id", listingId)
    .single();

  if (listingError || !listing) {
    redirect("/");
  }

  // 3. Verify ownership
  if (listing.user_id !== user.id) {
    redirect("/");
  }

  // 4. If the listing is already active, no need to pay again
  if (listing.status === "active") {
    redirect("/payment-success?alreadyActive=true");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-1 rounded bg-brand-green/10 px-2 py-1 text-xs font-semibold text-brand-green uppercase tracking-wide">
            Draft Saved
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Activating: {listing.title}
          </h1>
          <p className="mt-3 text-base text-gray-500 max-w-md mx-auto">
            Choose a plan below to activate your listing. Payments are processed securely via Paystack.
          </p>
        </div>

        <PlansClient listingId={listing.id} listingTitle={listing.title} />
      </main>
    </div>
  );
}
