"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";

type CategoryPillsProps = {
  activeCategory?: string;
};

export default function CategoryPills({
  activeCategory = "All",
}: CategoryPillsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleCategorySelect(category: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (category === "All") {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : "/");
  }

  return (
    <div className="scrollbar-hide -mx-4 overflow-x-auto px-4">
      <div className="flex gap-2 pb-1 md:gap-3">
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => handleCategorySelect(category)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-green text-white"
                  : "border border-brand-green bg-white text-brand-green hover:bg-brand-green/5"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
