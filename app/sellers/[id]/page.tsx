import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import SellerReviewForm from "@/components/SellerReviewForm";
import { createClient } from "@/lib/supabase/server";
import { formatTimeAgo } from "@/lib/utils";

type SellerPageProps = {
  params: Promise<{ id: string }>;
};

async function getSellerData(id: string) {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, is_verified, created_at, whatsapp")
    .eq("id", id)
    .single();

  if (profileError || !profile) return null;

  const { data: listings } = await supabase
    .from("listings")
    .select("*, seller:profiles!seller_id(full_name, is_verified)")
    .eq("seller_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const { data: reviews } = await supabase
    .from("seller_reviews")
    .select("id, rating, comment, created_at, reviewer:profiles!reviewer_id(full_name, avatar_url)")
    .eq("seller_id", id)
    .order("created_at", { ascending: false });

  const { data: { user } } = await supabase.auth.getUser();

  let userReview = null;
  if (user) {
    const { data } = await supabase
      .from("seller_reviews")
      .select("id, rating, comment")
      .eq("seller_id", id)
      .eq("reviewer_id", user.id)
      .single();
    userReview = data;
  }

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  return { profile, listings: listings ?? [], reviews: reviews ?? [], user, userReview, avgRating };
}

function StarDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-3 h-3", md: "w-5 h-5", lg: "w-6 h-6" };
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`${sizes[size]} ${star <= Math.round(rating) ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default async function SellerProfilePage({ params }: SellerPageProps) {
  const { id } = await params;
  const data = await getSellerData(id);

  if (!data) notFound();

  const { profile, listings, reviews, user, userReview, avgRating } = data;

  const whatsappUrl = profile.whatsapp
    ? `https://wa.me/${profile.whatsapp.toString().replace(/[^\d+]/g, "")}?text=${encodeURIComponent(`Hello ${profile.full_name}, I found your profile on YOUnimart and I'd like to connect.`)}`
    : null;

  const canReview = !!user && user.id !== profile.id && !userReview;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">

        {/* Profile Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

            {/* Avatar */}
            <div className="relative shrink-0">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  width={96}
                  height={96}
                  className="rounded-full object-cover w-24 h-24 border-2 border-brand-green"
                  unoptimized
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-brand-green/10 border-2 border-brand-green flex items-center justify-center text-brand-green font-bold text-3xl">
                  {profile.full_name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              {profile.is_verified && (
                <span className="absolute -bottom-1 -right-1 bg-brand-green text-white text-xs rounded-full w-6 h-6 flex items-center justify-center" title="Verified Student">
                  ✓
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl font-extrabold text-gray-900">{profile.full_name}</h1>
                {profile.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 border border-green-200">
                    ✓ Verified Student
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-400 mt-1">Member since {formatTimeAgo(profile.created_at)}</p>

              <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                {avgRating !== null ? (
                  <>
                    <StarDisplay rating={avgRating} size="md" />
                    <span className="text-sm font-bold text-gray-700">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-400">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">No reviews yet</span>
                )}
              </div>

              <div className="flex gap-4 mt-3 justify-center sm:justify-start">
                <div className="text-center">
                  <p className="text-lg font-bold text-brand-green">{listings.length}</p>
                  <p className="text-xs text-gray-400">Active Listings</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-brand-green">{reviews.length}</p>
                  <p className="text-xs text-gray-400">Reviews</p>
                </div>
              </div>
            </div>

            {/* WhatsApp Button */}
            {whatsappUrl && (
              
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-white font-semibold text-sm hover:bg-green-800 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Listings */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Active Listings <span className="text-gray-400 font-normal text-base">({listings.length})</span>
            </h2>
            {listings.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {listings.map((listing: any) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
                This seller has no active listings right now.
              </div>
            )}
          </div>

          {/* Reviews */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Reviews <span className="text-gray-400 font-normal text-base">({reviews.length})</span>
            </h2>

            {canReview && <SellerReviewForm sellerId={profile.id} />}

            {!user && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-center text-sm text-gray-500 mb-4">
                <Link href="/login" className="text-brand-green font-semibold hover:underline">Sign in</Link> to leave a review
              </div>
            )}

            {userReview && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-4 text-sm text-green-700">
                ✓ You already reviewed this seller
              </div>
            )}

            <div className="space-y-3">
              {reviews.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
                  No reviews yet. Be the first!
                </div>
              )}
              {reviews.map((review: any) => (
                <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-sm">
                      {review.reviewer?.full_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{review.reviewer?.full_name ?? "Student"}</p>
                      <p className="text-xs text-gray-400">{formatTimeAgo(review.created_at)}</p>
                    </div>
                  </div>
                  <StarDisplay rating={review.rating} size="sm" />
                  {review.comment && (
                    <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}