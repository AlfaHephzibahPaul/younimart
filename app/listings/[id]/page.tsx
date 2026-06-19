import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import ImageCarousel from "@/components/ImageCarousel";
import { formatPrice, formatTimeAgo } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import type { ListingCondition } from "@/types";

type ListingPageProps = {
    params: Promise<{
        id: string;
    }>;
};

const CONDITION_LABELS: Record<ListingCondition, string> = {
    new: "New",
    like_new: "Like New",
    good: "Good",
    fair: "Fair",
};

const CONDITION_STYLES: Record<ListingCondition, string> = {
    new: "bg-green-100 text-green-800 border-green-200",
    like_new: "bg-blue-100 text-blue-800 border-blue-200",
    good: "bg-orange-100 text-brand-orange border-orange-200",
    fair: "bg-gray-100 text-gray-800 border-gray-200",
};

async function getListingDetail(id: string) {
    const supabase = await createClient();

    // Explicitly include whatsapp_number in the select
    const { data, error } = await supabase
        .from("listings")
        .select("*, whatsapp_number, seller:profiles!seller_id(full_name, whatsapp)")
        .eq("id", id)
        .single();

    if (error || !data) {
        return null;
    }

    return data;
}

export default async function ListingDetailPage({ params }: ListingPageProps) {
    const resolvedParams = await params;
    const listing = await getListingDetail(resolvedParams.id);

    if (!listing) {
        notFound();
    }

    const sellerName = listing.seller?.full_name ?? "Unknown Seller";

    // Prioritize profile whatsapp, fallback to listing whatsapp_number
    const sellerWhatsapp = listing.seller?.whatsapp || listing.whatsapp_number;

    let whatsappUrl = null;
    if (sellerWhatsapp) {
        const cleanedPhone = sellerWhatsapp.toString().replace(/[^\d+]/g, "");
        const message = encodeURIComponent(
            `Hello ${sellerName}, I saw your listing for "${listing.title}" on YOUnimart. Is it still available?`
        );
        whatsappUrl = `https://wa.me/${cleanedPhone}?text=${message}`;
    }

    const rawImages = listing.image_urls && listing.image_urls.length > 0
        ? listing.image_urls
        : (listing.image_url ? [listing.image_url] : []);
    const images: string[] = rawImages.slice(0, 5);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />
            <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
                <div className="flex flex-col md:flex-row items-start gap-6 md:gap-10 w-full">
                    <div className="w-full md:w-7/12 flex flex-col gap-6">
                        <ImageCarousel images={images} title={listing.title} />
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xs font-bold text-gray-400 uppercase">Description</h2>
                            <p className="mt-2 text-sm text-gray-600">{listing.description}</p>
                        </div>
                    </div>

                    <div className="w-full md:w-5/12 flex flex-col gap-4">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h1 className="text-2xl font-extrabold text-gray-900">{listing.title}</h1>
                            <p className="mt-2 text-3xl font-black text-orange-600">{formatPrice(listing.price)}</p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <p className="text-xs text-gray-400 mb-4">Posted by {sellerName}</p>

                            {whatsappUrl ? (
                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex w-full items-center justify-center rounded-xl bg-[#1f4e37] py-4 text-white font-bold hover:bg-[#d05d16] transition-colors"
                                >
                                    Chat on WhatsApp
                                </a>
                            ) : (
                                <div className="p-4 bg-gray-50 text-center text-sm text-gray-500 rounded-xl border border-dashed">
                                    WhatsApp not available for this seller.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}