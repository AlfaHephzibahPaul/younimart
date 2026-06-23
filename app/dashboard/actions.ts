"use server";

import { revalidatePath } from "next/cache";

export async function revalidateListings() {
  revalidatePath("/");
  revalidatePath("/dashboard");
}
