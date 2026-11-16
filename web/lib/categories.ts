import { cache } from "react";
import { createSupabaseServer } from "./supabase-server";

// Categories live in the database (public.categories). Read once per request.
export const getCategories = cache(async (): Promise<string[]> => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("categories").select("name").order("sort_order");
  return (data ?? []).map((c) => c.name as string);
});
