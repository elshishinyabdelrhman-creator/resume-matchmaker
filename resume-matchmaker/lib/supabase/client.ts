/**
 * Browser Supabase client for Client Components and client-side auth listeners.
 * Session is stored in cookies; middleware refreshes the session on navigation.
 */
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
