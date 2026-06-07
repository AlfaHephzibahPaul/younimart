import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import CreateListingForm from "@/components/CreateListingForm";

export const dynamic = "force-dynamic";

export default async function CreateListingPage() {
  const supabase = await createClient();

  // 1. Get current user session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Fetch profile to check verification status
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_verified, university_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/");
  }

  // 3. Ensure the user is verified
  if (!profile.is_verified) {
    redirect("/verify");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-8">
        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Create a New Listing
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Fill out the details below to list your item on the FUD student marketplace.
          </p>
        </div>

        <CreateListingForm
          userId={user.id}
          universityId={profile.university_id}
        />
      </main>
    </div>
  );
}
