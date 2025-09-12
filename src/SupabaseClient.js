import { createClient } from '@supabase/supabase-js'

// .env.local dosyanızdan Supabase URL ve Anon Key'inizi alıyoruz.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Environment variables kontrolü
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'Present' : 'Missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Present' : 'Missing'
  });
  throw new Error('Supabase environment variables are not properly configured');
}

console.log('Supabase client initializing with URL:', supabaseUrl);

// Supabase istemcisini oluşturup dışa aktarıyoruz.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
