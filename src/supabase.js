import { createClient } from '@supabase/supabase-js'
// La clé "anon" est publique par conception : la sécurité vient des règles RLS de la base.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://hrsvecduiiyfokbyxolu.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyc3ZlY2R1aWl5Zm9rYnl4b2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4Mzc3NjksImV4cCI6MjEwNzQxMzc2OX0.3LWMAIfP2p4C1S0oIbL9Rczoe7unDNGv-R3Ob2C-yW4'
export const sb = createClient(url, key)
