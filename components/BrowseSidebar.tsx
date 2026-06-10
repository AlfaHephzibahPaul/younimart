"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const CATEGORIES = ["All", "Electronics", "Books", "Fashion", "Food & Drinks", "Home Essentials", "Services", "Other"];
const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export default function BrowseSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [conditions, setConditions] = useState<string[]>(searchParams.getAll("condition"));

  function apply() {
    const params = new URLSearchParams();
    if (searchParams.get("q")) params.set("q", searchParams.get("q")!);
    if (category !== "All") params.set("category", category);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sort !== "newest") params.set("sort", sort);
    conditions.forEach(c => params.append("condition", c));
    router.push(`/browse?${params.toString()}`);
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-8">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Category</label>
        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border-gray-300 text-sm focus:border-brand-green focus:ring-brand-green"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Price Range (₦)</label>
        <div className="flex gap-2">
          <input 
            type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
            className="w-full rounded-lg border-gray-300 text-sm p-2"
          />
          <input 
            type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full rounded-lg border-gray-300 text-sm p-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Condition</label>
        <div className="space-y-2">
          {CONDITIONS.map(c => (
            <label key={c.value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input 
                type="checkbox" checked={conditions.includes(c.value)}
                onChange={(e) => setConditions(prev => e.target.checked ? [...prev, c.value] : prev.filter(x => x !== c.value))}
                className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
              />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Sort By</label>
        <select 
          value={sort} 
          onChange={(e) => setSort(e.target.value)}
          className="w-full rounded-lg border-gray-300 text-sm focus:border-brand-green focus:ring-brand-green"
        >
          <option value="newest">Newest First</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
      </div>

      <button 
        onClick={apply}
        className="w-full bg-brand-green text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
      >
        Apply Filters
      </button>
    </div>
  );
}