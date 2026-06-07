"use client";

import { useState } from "react";

interface PlansClientProps {
  listingId: string;
  listingTitle: string;
}

interface PlanConfig {
  id: string;
  name: string;
  duration: string;
  price: number;
  popular?: boolean;
  features: string[];
}

const PLANS: PlanConfig[] = [
  {
    id: "3_day",
    name: "Standard",
    duration: "3 Days",
    price: 500,
    features: [
      "Active for 3 days",
      "Standard visibility on FUD feed",
      "Direct WhatsApp/Phone chats",
      "Up to 6 product images",
    ],
  },
  {
    id: "7_day",
    name: "Plus",
    duration: "7 Days",
    price: 1000,
    features: [
      "Active for 7 days",
      "Enhanced visibility on feed",
      "Direct WhatsApp/Phone chats",
      "Up to 6 product images",
    ],
  },
  {
    id: "14_day",
    name: "Premium",
    duration: "14 Days",
    price: 1800,
    popular: true,
    features: [
      "Active for 14 days",
      "High visibility on feed",
      "Featured badge on feed list",
      "Direct WhatsApp/Phone chats",
      "Up to 6 product images",
    ],
  },
  {
    id: "30_day",
    name: "Ultimate",
    duration: "30 Days",
    price: 3000,
    features: [
      "Active for 30 days",
      "Maximum visibility on feed",
      "Featured badge & top slot on feed list",
      "Direct WhatsApp/Phone chats",
      "Up to 6 product images",
    ],
  },
];

export default function PlansClient({
  listingId,
  listingTitle,
}: PlansClientProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePay(planId: string) {
    setLoadingPlan(planId);
    setError(null);

    try {
      const res = await fetch("/api/subscriptions/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId,
          plan: planId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate transaction.");
      }

      if (!data.authorization_url) {
        throw new Error("Paystack checkout URL not returned.");
      }

      // Redirect user to Paystack payment gateway
      window.location.href = data.authorization_url;
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          <svg
            className="h-5 w-5 shrink-0 text-red-500 mt-0.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <div>{error}</div>
        </div>
      )}

      {/* Plans Card Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all ${
              plan.popular
                ? "border-brand-orange ring-2 ring-brand-orange/20"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-orange px-3 py-1 text-xs font-bold text-white uppercase tracking-wider shadow-sm">
                Most Popular
              </span>
            )}

            <div>
              <div className="text-lg font-bold text-gray-900">{plan.name}</div>
              <div className="mt-2 text-3xl font-extrabold text-gray-900">
                ₦{plan.price.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">for {plan.duration}</div>

              {/* Plan Features */}
              <ul className="mt-6 space-y-3">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-650">
                    <svg
                      className="h-4 w-4 shrink-0 text-brand-green mt-0.5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              disabled={loadingPlan !== null}
              onClick={() => handlePay(plan.id)}
              className={`mt-8 w-full rounded-xl py-3 text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                plan.popular
                  ? "bg-brand-orange text-white hover:bg-orange-600 shadow-sm"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {loadingPlan === plan.id && (
                <svg
                  className="animate-spin h-4 w-4 text-current"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {loadingPlan === plan.id ? "Initiating..." : "Select & Pay"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
