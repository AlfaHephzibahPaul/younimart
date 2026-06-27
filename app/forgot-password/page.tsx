"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setIsLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSubmitted(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-3xl font-extrabold tracking-tight text-brand-green hover:opacity-90 transition-opacity"
          >
            YOUnimart
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700 border border-green-200">
                Check your inbox! We&apos;ve sent a password reset link to{" "}
                <span className="font-semibold">{email}</span>.
              </div>
              <Link
                href="/login"
                className="inline-block text-sm font-medium text-brand-green hover:underline"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none ring-brand-green focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                  placeholder="you@domain.edu.ng"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-brand-orange py-3 font-semibold text-white transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? "Sending..." : "Send reset link"}
              </button>

              <p className="text-center text-sm text-gray-500 pt-2">
                Remembered your password?{" "}
                <Link
                  href="/login"
                  className="font-medium text-brand-green hover:underline"
                >
                  Back to login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}