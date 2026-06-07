"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const [status, setStatus] = useState<"loading" | "active" | "pending" | "failed">("loading");
  const [listingId, setListingId] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus("active");
      return;
    }

    let attempts = 0;
    const maxAttempts = 15; // 30 seconds max polling

    async function checkStatus() {
      try {
        const res = await fetch(`/api/subscriptions/status?reference=${reference}`);
        if (!res.ok) {
          throw new Error("Failed to check subscription status");
        }
        const data = await res.json();
        
        if (data.status === "active") {
          setStatus("active");
          setListingId(data.listingId);
          clearInterval(interval);
        } else if (data.status === "expired") {
          setStatus("failed");
          clearInterval(interval);
        } else {
          // Keep pending
          attempts++;
          if (attempts >= maxAttempts) {
            // Webhook is delayed but payment went through
            setStatus("pending");
            setListingId(data.listingId);
            clearInterval(interval);
          }
        }
      } catch (err: any) {
        console.error("Error checking subscription status:", err);
      }
    }

    // Check status immediately
    checkStatus();

    // Check status every 2 seconds
    const interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, [reference]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
          <div className="absolute h-6 w-6 rounded-full bg-brand-orange/15 animate-ping" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Finalizing Payment...</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          We are confirming your payment and activating your listing. This will only take a moment.
        </p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-500">
          <svg
            className="h-8 w-8"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Payment confirmation is pending
          </h2>
          <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto">
            Your transaction was received! Activation is being completed in the background. Your listing will go live shortly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center pt-2">
          {listingId && (
            <Link
              href={`/listings/${listingId}`}
              className="rounded-lg bg-brand-green px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              Go to Listing
            </Link>
          )}
          <Link
            href="/"
            className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Return to Feed
          </Link>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border border-red-200 text-red-500">
          <svg
            className="h-8 w-8"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Payment Verification Failed
          </h2>
          <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto">
            Your transaction could not be verified or was marked failed by Paystack.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center pt-2">
          {listingId && (
            <Link
              href={`/subscription-plans?listing=${listingId}`}
              className="rounded-lg bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Try Again
            </Link>
          )}
          <Link
            href="/"
            className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Return to Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in duration-200">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-100 text-emerald-600 shadow-sm">
        <svg
          className="h-10 w-10 animate-bounce"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Your listing is now live!
        </h2>
        <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto">
          Success! Your subscription payment is complete and your item has been successfully published to the FUD marketplace.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full justify-center pt-4">
        {listingId ? (
          <Link
            href={`/listings/${listingId}`}
            className="rounded-lg bg-brand-green px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 shadow-sm"
          >
            View Listing
          </Link>
        ) : (
          <Link
            href="/"
            className="rounded-lg bg-brand-green px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 shadow-sm"
          >
            View Marketplace
          </Link>
        )}
        <Link
          href="/create-listing"
          className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 shadow-sm"
        >
          Post Another Ad
        </Link>
      </div>
    </div>
  );
}
