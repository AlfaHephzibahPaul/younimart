export const FUD_UNIVERSITY_SLUG = "fud";

export const CATEGORIES = [
  "All",
  "Electronics",
  "Books",
  "Fashion",
  "Food & Drinks",
  "Home Essentials",
  "Services",
] as const;

export type Category = (typeof CATEGORIES)[number];
