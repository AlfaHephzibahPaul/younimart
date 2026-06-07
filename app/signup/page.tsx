"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { FUD_UNIVERSITY_SLUG } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { University } from "@/types";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [university, setUniversity] = useState<University | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUniversity, setIsFetchingUniversity] = useState(true);

  useEffect(() => {
    supabase
      .from("universities")
      .select("*")
      .eq("slug", FUD_UNIVERSITY_SLUG)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError("Unable to load university. Please try again later.");
        } else if (data) {
          setUniversity(data);
        }
        setIsFetchingUniversity(false);
      });
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!university) {
      setError("University information is unavailable. Please refresh the page.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Account creation failed. Please try again.");
      setIsLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      full_name: fullName,
      email,
      university_id: university.id,
      verification_status: "pending",
    });

    if (profileError) {
      setError(profileError.message);
      setIsLoading(false);
      return;
    }

    router.push("/verify");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-brand-green"
          >
            YOUnimart
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Join the FUD campus marketplace
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none ring-brand-green focus:border-brand-green focus:ring-2"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none ring-brand-green focus:border-brand-green focus:ring-2"
                placeholder="you@fud.edu.ng"
              />
            </div>

            <div>
              <label
                htmlFor="university"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                University
              </label>
              <select
                id="university"
                disabled
                value={university?.id ?? ""}
                className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-700"
              >
                <option value="">
                  {isFetchingUniversity
                    ? "Loading..."
                    : (university?.name ?? "Federal University Dutse")}
                </option>
                {university && (
                  <option value={university.id}>{university.name}</option>
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none ring-brand-green focus:border-brand-green focus:ring-2"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none ring-brand-green focus:border-brand-green focus:ring-2"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isFetchingUniversity || !university}
            className="mt-6 w-full rounded-lg bg-brand-orange py-3 font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-brand-green hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
