import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// These values are public and can be exposed in the client
const SUPABASE_URL = "https://wdimedbgtyyaongtgbhl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaW1lZGJndHl5YW9uZ3RnYmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNTE0OTUsImV4cCI6MjA1MzgyNzQ5NX0.I85OBs7QkZjWiOUdKzhmhZJDWVpKkFxzFMBDcIgPlDk";

if (!SUPABASE_URL) throw new Error('Missing SUPABASE_URL');
if (!SUPABASE_ANON_KEY) throw new Error('Missing SUPABASE_ANON_KEY');

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);