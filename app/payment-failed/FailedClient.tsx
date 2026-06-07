"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function FailedClient() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listing");

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
      {/* Failed Red Cross Icon */}
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 border-2 border-red-100 text-red-600 shadow-sm">
        <svg
          className="h-10 w-10"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>

      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Payment not completed
        </h2>
        <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto">
          Your payment transaction could not be processed. Don't worry, your listing details are saved as a draft and are safe.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full justify-center pt-4">
        {listingId ? (
          <Link
            href={`/subscription-plans?listing=${listingId}`}
            className="rounded-lg bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 shadow-sm"
          >
            Try Again
          </Link>
        ) : (
          <Link
            href="/create-listing"
            className="rounded-lg bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 shadow-sm"
          >
            Try Again
          </Link>
        )}
        <Link
          href="/"
          className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 shadow-sm"
        >
          Save as Draft
        </Link>
      </div>
    </div>
  );
}
