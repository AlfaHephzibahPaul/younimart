export type VerificationStatus = "pending" | "approved" | "rejected";
export type ListingStatus = "draft" | "active" | "expired" | "sold";
export type ListingCondition = "new" | "like_new" | "good" | "fair";
export type SubscriptionPlan = "3_day" | "7_day" | "14_day" | "30_day";
export type SubscriptionStatus = "pending" | "active" | "expired";

export interface University {
  id: string;
  name: string;
  slug: string;
  email_domain: string;
  created_at: string;
}

export interface Profile {
  id: string;
  university_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  verification_status: VerificationStatus;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  university_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: ListingCondition;
 image_urls: string[];
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface Subscription {
  id: string;
  listing_id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  amount_paid: number;
  payment_reference: string | null;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  university_id: string;
  matric_number: string;
  id_card_url: string;
  status: VerificationStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}
