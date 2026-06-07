import { Suspense } from "react";
import CategoryPills from "@/components/CategoryPills";
import Hero from "@/components/Hero";
import ListingCard from "@/components/ListingCard";
import Navbar from "@/components/Navbar";
import { FUD_UNIVERSITY_SLUG } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/types";

type ListingWithSeller = Listing & {
  seller: { full_name: string } | null;
};

type HomeProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

function EmptyListings() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 160"
        className="mb-6 h-40 w-48 text-brand-green/30"
        aria-hidden="true"
      >
        <rect
          x="20"
          y="40"
          width="160"
          height="100"
          rx="12"
          fill="currentColor"
          opacity="0.15"
        />
        <rect
          x="35"
          y="55"
          width="60"
          height="45"
          rx="6"
          fill="currentColor"
          opacity="0.25"
        />
        <rect
          x="105"
          y="55"
          width="60"
          height="20"
          rx="4"
          fill="currentColor"
          opacity="0.25"
        />
        <rect
          x="105"
          y="85"
          width="40"
          height="15"
          rx="4"
          fill="currentColor"
          opacity="0.2"
        />
        <circle cx="100" cy="25" r="18" fill="currentColor" opacity="0.2" />
        <path
          d="M90 25 L100 15 L110 25 L100 35 Z"
          fill="currentColor"
          opacity="0.35"
        />
      </svg>
      <h2 className="text-xl font-semibold text-gray-800">
        No listings yet. Be the first to post something!
      </h2>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        The FUD marketplace is ready — sign up, get verified, and share what you
        have with fellow students.
      </p>
    </div>
  );
}

async function getListings(
  query?: string,
  category?: string
): Promise<ListingWithSeller[]> {
  const supabase = await createClient();

  const { data: university } = await supabase
    .from("universities")
    .select("id")
    .eq("slug", FUD_UNIVERSITY_SLUG)
    .single();

  if (!university) return [];

  let listingsQuery = supabase
    .from("listings")
    .select("*, seller:profiles!seller_id(full_name)")
    .eq("university_id", university.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (category && category !== "All") {
    listingsQuery = listingsQuery.eq("category", category);
  }

  if (query?.trim()) {
    listingsQuery = listingsQuery.ilike("title", `%${query.trim()}%`);
  }

  const { data } = await listingsQuery;

  return (data as ListingWithSeller[]) ?? [];
}

export default async function HomePage({ searchParams }: HomeProps) {
  const params = await searchParams;
  const listings = await getListings(params.q, params.category);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={<div className="h-48 bg-brand-green" />}>
        <Hero defaultQuery={params.q} />
      </Suspense>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={<div className="h-10" />}>
          <CategoryPills activeCategory={params.category ?? "All"} />
        </Suspense>

        {listings.length === 0 ? (
          <EmptyListings />
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
