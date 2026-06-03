import { createClient } from '@supabase/supabase-js';

// Use Vite proxy in development to bypass browser adblockers and strict network filters
const proxyUrl = typeof window !== 'undefined' ? `${window.location.origin}/supabase-api` : 'http://localhost:5173/supabase-api';
const supabaseUrl = import.meta.env.DEV ? proxyUrl : import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
