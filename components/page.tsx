import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import { FUD_UNIVERSITY_SLUG } from "@/lib/constants";
import BrowseSidebar from "./BrowseSidebar";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: string | string[];
    sort?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: university } = await supabase
    .from("universities")
    .select("id")
    .eq("slug", FUD_UNIVERSITY_SLUG)
    .single();

  if (!university) return <div>University context not found.</div>;

  let query = supabase
    .from("listings")
    .select("*, seller:profiles!seller_id(full_name, is_verified)")
    .eq("university_id", university.id)
    .eq("status", "active");

  if (params.category && params.category !== "All") {
    query = query.eq("category", params.category);
  }
  if (params.minPrice) query = query.gte("price", parseFloat(params.minPrice));
  if (params.maxPrice) query = query.lte("price", parseFloat(params.maxPrice));
  if (params.condition) {
    const conditions = Array.isArray(params.condition) ? params.condition : [params.condition];
    query = query.in("condition", conditions);
  }
  if (params.q) {
    const q = params.q.trim();
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  switch (params.sort) {
    case "price_low": query = query.order("price", { ascending: true }); break;
    case "price_high": query = query.order("price", { ascending: false }); break;
    default: query = query.order("created_at", { ascending: false });
  }

  const { data: listings } = await query;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 shrink-0">
            <BrowseSidebar />
          </aside>

          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{listings?.length || 0} Listings Found</h1>
            </div>

            {listings && listings.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {listings.map((l) => <ListingCard key={l.id} listing={l as any} />)}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                <p className="text-gray-500 font-medium">No results found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}