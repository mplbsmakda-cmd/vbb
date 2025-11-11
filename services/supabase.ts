
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://shbkbmkbvktozaargrpz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYmtibWtidmt0b3phYXJncnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMzI1NjMsImV4cCI6MjA3NzgwODU2M30.rbuzJ_5_xQlAMQZCbz8N4ckTo6jKgujbXnH176XbzOw';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
