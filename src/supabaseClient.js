import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
// These will be provided by Vite as import.meta.env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate that environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Missing Supabase environment variables. Please check your .env file.')
  }
}

// Create and export the Supabase client
// IMPORTANT: persistSession: true persists auth sessions in localStorage
// so users remain logged in after browser refresh or redirect back from Stripe
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? localStorage : undefined
  }
});
