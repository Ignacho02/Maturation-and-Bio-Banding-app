export const APP_NAME = "Maduration";
export const STORAGE_KEY = "maduration-app-state";
export const DEFAULT_EMAIL =
  process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "coach@maduration.app";
export const DEFAULT_PASSWORD =
  process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "Maduration2026!";

export function isSupabaseEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
