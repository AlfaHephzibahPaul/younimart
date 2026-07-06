import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import SellerReviewForm from "@/components/SellerReviewForm";
import { createClient } from "@/lib/supabase/server";
import { formatTimeAgo } from "@/lib/utils";

type SellerPageProps = { params: Promise<{ id: string }> };

async function getSellerData(id: string) {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, is_verified, created_at, whatsapp")
    .eq("id", id).single();
  if (error || !profile) return null;
  const { data: listings } = await supabase.from("listings")
    .select("*, seller:profiles!seller_id(full_name, is_verified)")
    .eq("seller_id", id).eq("status", "active").order("created_at", { ascending: false });
  const { data: reviews } = await supabase.from("seller_reviews")
    .select("id, rating, comment, created_at, reviewer:profiles!reviewer_id(full_name, avatar_url)")
    .eq("seller_id", id).order("created_at", { ascending: false });
  const { data: { user } } = await supabase.auth.getUser();
  let userReview = null;
  if (user) {
    const { data } = await supabase.from("seller_reviews")
      .select("id, rating, comment").eq("seller_id", id).eq("reviewer_id", user.id).single();
    userReview = data;
  }
  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
  return { profile, listings: listings ?? [], reviews: reviews ?? [], user, userReview, avgRating };
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function StarDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-6 h-6" };
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`${sizes[size]} ${star <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* HERO */}
      <div className="relative bg-brand-green overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute top-4 right-1/3 w-20 h-20 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-5xl px-4 py-12 md:px-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">

            <div className="relative shrink-0">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.full_name} width={120} height={120}
                  className="rounded-full object-cover w-28 h-28 sm:w-32 sm:h-32 border-4 border-white shadow-xl" unoptimized />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white/20 border-4 border-white flex items-center justify-center text-white font-extrabold text-5xl shadow-xl">
                  {profile.full_name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              {profile.is_verified && (
                <span className="absolute -bottom-1 -right-1 bg-brand-orange border-2 border-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                  <CheckIcon className="w-4 h-4 text-white" />
                </span>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">{profile.full_name}</h1>
                {profile.is_verified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange text-white text-xs font-bold px-3 py-1 shadow">
                    <CheckIcon className="w-3 h-3" />
                    Verified Student
                  </span>
                )}
              </div>
              <p className="text-green-200 text-sm">Member since {formatTimeAgo(profile.created_at)}</p>
              {avgRating !== null && (
                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                  <StarDisplay rating={avgRating} size="md" />
                  <span className="text-white font-bold">{avgRating.toFixed(1)}</span>
                  <span className="text-green-200 text-sm">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
                </div>
              )}
            </div>

            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-white text-brand-green font-bold text-sm px-6 py-3 hover:bg-orange-50 hover:text-brand-orange transition-colors shadow-lg">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contact on WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="flex items-stretch divide-x divide-gray-100">
            <div className="flex flex-col items-center justify-center py-4 px-6 min-w-[100px]">
              <p className="text-2xl font-extrabold text-brand-green">{listings.length}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Listings</p>
            </div>
            <div className="flex flex-col items-center justify-center py-4 px-6 min-w-[100px]">
              <p className="text-2xl font-extrabold text-brand-orange">{reviews.length}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Reviews</p>
            </div>
            {avgRating !== null && (
              <div className="flex flex-col items-center justify-center py-4 px-6">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-extrabold text-gray-800">{avgRating.toFixed(1)}</span>
                  <StarDisplay rating={avgRating} size="sm" />
                </div>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Avg. Rating</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-lg font-extrabold text-gray-900">Active Listings</h2>
              <span className="bg-brand-green/10 text-brand-green text-xs font-bold px-2.5 py-1 rounded-full border border-brand-green/20">{listings.length}</span>
            </div>
            {listings.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {listings.map((listing: any) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-14 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-50 border-2 border-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-400">No active listings right now</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-lg font-extrabold text-gray-900">Reviews</h2>
              <span className="bg-brand-orange/10 text-brand-orange text-xs font-bold px-2.5 py-1 rounded-full border border-brand-orange/20">{reviews.length}</span>
            </div>

            {canReview && <SellerReviewForm sellerId={profile.id} />}

            {!user && (
              <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4 text-center text-sm mb-4">
                <Link href="/login" className="font-bold text-brand-orange hover:underline">Sign in</Link>
                <span className="text-orange-500"> to leave a review</span>
              </div>
            )}

            {userReview && (
              <div className="rounded-xl bg-green-50 border border-green-100 p-3 mb-4 text-sm text-green-700 flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-500 shrink-0" />
                You already reviewed this seller
              </div>
            )}

            <div className="space-y-3">
              {reviews.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-gray-100 bg-white p-8 text-center">
                  <p className="text-sm font-semibold text-gray-300">No reviews yet</p>
                  <p className="text-xs text-gray-200 mt-1">Be the first to review!</p>
                </div>
              )}
              {reviews.map((review: any) => (
                <div key={review.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-brand-green flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {review.reviewer?.full_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{review.reviewer?.full_name ?? "Student"}</p>
                      <p className="text-xs text-gray-400">{formatTimeAgo(review.created_at)}</p>
                    </div>
                  </div>
                  <StarDisplay rating={review.rating} size="sm" />
                  {review.comment && (
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-2">{review.comment}</p>
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