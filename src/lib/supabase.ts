import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Creates a Supabase client.
 * If a Clerk token is provided, it injects it into the Authorization header
 * so that Supabase Row Level Security (RLS) can authenticate the user.
 */
export const getSupabaseClient = (clerkToken?: string | null) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing in environment variables.');
  }

  const options = clerkToken
    ? {
        global: {
          headers: {
            Authorization: `Bearer ${clerkToken}`,
          },
        },
      }
    : undefined;

  return createClient(supabaseUrl, supabaseAnonKey, options);
};

// Default public client
export const supabase = getSupabaseClient();
