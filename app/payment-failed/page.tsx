import { Suspense } from "react";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import FailedClient from "./FailedClient";

export const dynamic = "force-dynamic";

export default async function PaymentFailedPage() {
  const supabase = await createClient();

  // 1. Get current user session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 sm:p-10 shadow-sm">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
                <h2 className="text-xl font-bold text-gray-900">Loading details...</h2>
              </div>
            }
          >
            <FailedClient />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
