
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function getSupabaseClient() {
  if (!url || !publishableKey) {
    console.error("Supabase environment variables are missing.");
    return null;
  }

  return createClient(url, publishableKey);
}
