import { createBrowserClient } from "@supabase/ssr";

// Singleton browser client. Using @supabase/ssr's createBrowserClient (instead of
// the plain @supabase/supabase-js createClient) makes it write the session as
// cookies in the same format middleware.js and supabaseServer.js expect,
// instead of localStorage-only. This also fixes the "Multiple GoTrueClient
// instances detected" warning if every client file imports this one instance
// instead of creating its own.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);