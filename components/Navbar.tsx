"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSupabase } from "@/components/supabase-provider";

type UserProfile = {
  full_name: string;
  avatar_url: string | null;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Navbar() {
  const router = useRouter();
  const { supabase, user, isLoading } = useSupabase();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user, supabase]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push("/");
    router.refresh();
  }

  const displayName =
    profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email ?? "";

  return (
    <nav className="bg-brand-green px-4 py-3 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link
          href="/"
          className="shrink-0 text-xl font-bold tracking-tight text-white"
        >
          YOUnimart
        </Link>

        <div className="flex flex-1 items-center justify-center gap-4 sm:gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-white/90 transition-colors hover:text-white"
          >
            Browse
          </Link>
          {user && (
            <Link
              href="/post"
              className="text-sm font-medium text-white/90 transition-colors hover:text-white"
            >
              Post an Ad
            </Link>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {!isLoading && !user && (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-white px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
              >
                Sign Up
              </Link>
            </>
          )}

          {!isLoading && user && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white/30 bg-white/10 transition-colors hover:border-white/60"
                aria-label="User menu"
                aria-expanded={dropdownOpen}
              >
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={displayName}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-white">
                    {displayName ? getInitials(displayName) : "?"}
                  </span>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {displayName}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    My Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
