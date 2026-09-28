export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://goxmrvyarieaekcwswus.supabase.co";

export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_M7DP1fFHOG3RqLO4NglUzw_2mo-IjSX";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://instabook-liard.vercel.app";

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}
