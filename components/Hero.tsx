"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

type HeroProps = {
  defaultQuery?: string;
};

export default function Hero({ defaultQuery = "" }: HeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultQuery);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams(searchParams.toString());

    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }

    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : "/");
  }

  return (
    <section className="bg-brand-green px-4 py-14 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
          Campus Market, Your Way
        </h1>
        <p className="mt-4 text-base text-white/85 md:text-lg">
          Buy and sell within your university community. No middlemen, no hassle.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
        >
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for items, books, electronics..."
            className="flex-1 rounded-lg border-0 px-4 py-3 text-gray-900 shadow-sm outline-none ring-2 ring-transparent placeholder:text-gray-400 focus:ring-brand-orange"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-orange px-8 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Search
          </button>
        </form>
      </div>
    </section>
  );
}
