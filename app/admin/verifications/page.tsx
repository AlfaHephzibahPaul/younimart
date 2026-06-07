import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import VerificationsTable from "./VerificationsTable";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  const supabase = await createClient();

  // 1. Fetch current user session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Fetch profile to check is_admin status
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.is_admin) {
    redirect("/");
  }

  // 3. Fetch all verification requests with profiles and universities info
  const { data: requests, error: requestsError } = await supabase
    .from("verification_requests")
    .select(`
      id,
      user_id,
      document_type,
      document_url,
      status,
      admin_note,
      created_at,
      profiles (
        full_name,
        universities (
          name
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (requestsError) {
    console.error("Error fetching verification requests:", requestsError);
  }

  const typedRequests = (requests || []).map((req: any) => ({
    id: req.id,
    user_id: req.user_id,
    document_type: req.document_type,
    document_url: req.document_url,
    status: req.status,
    admin_note: req.admin_note,
    created_at: req.created_at,
    profiles: req.profiles
      ? {
          full_name: req.profiles.full_name,
          universities: req.profiles.universities
            ? {
                name: req.profiles.universities.name,
              }
            : null,
        }
      : null,
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Verification Requests
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage, review, and audit student verification applications for FUD.
            </p>
          </div>
        </div>

        <VerificationsTable initialRequests={typedRequests} />
      </main>
    </div>
  );
}
