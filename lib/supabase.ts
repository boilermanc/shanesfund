import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
const supabaseUrl = 'https://fhinyhfvezctknrsmzgp.supabase.co';
const supabaseAnonKey = 'sb_publishable_vy2VB0GENhofRgPfh4BkYw_iz8nXUtI';
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
