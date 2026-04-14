import { createClient } from "@supabase/supabase-js";
import { isSupabaseEnabled } from "@/lib/config";

export function createSupabaseClient() {
  if (!isSupabaseEnabled()) {
    return null;
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
