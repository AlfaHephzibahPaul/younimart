import Image from "next/image";
import Link from "next/link";
import { formatPrice, formatTimeAgo } from "@/lib/utils";
import type { Listing, ListingCondition } from "@/types";

const CONDITION_LABELS: Record<ListingCondition, string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
};

const CONDITION_STYLES: Record<ListingCondition, string> = {
  new: "bg-green-600 text-white",
  like_new: "bg-blue-600 text-white",
  good: "bg-brand-orange text-white",
  fair: "bg-gray-500 text-white",
};

export type ListingCardProps = {
  listing: Listing & {
    seller?: { full_name: string } | null;
  };
};

function PlaceholderImage() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-12 w-12"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
        />
      </svg>
    </div>
  );
}

export default function ListingCard({ listing }: ListingCardProps) {
  const imageUrl = listing.images?.[0];
  const sellerName = listing.seller?.full_name ?? "Unknown seller";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <PlaceholderImage />
        )}

        <span
          className={`absolute left-2 top-2 rounded-md px-2 py-1 text-xs font-semibold ${CONDITION_STYLES[listing.condition]}`}
        >
          {CONDITION_LABELS[listing.condition]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-brand-green">
          {listing.title}
        </h3>
        <p className="text-lg font-bold text-brand-orange">
          {formatPrice(listing.price)}
        </p>
        <p className="text-xs text-gray-500">{listing.category}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-gray-500">
          <span className="truncate">{sellerName}</span>
          <span className="shrink-0">{formatTimeAgo(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
