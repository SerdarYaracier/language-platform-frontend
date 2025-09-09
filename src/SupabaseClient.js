import { createClient } from '@supabase/supabase-js'

// .env.local dosyanızdan Supabase URL ve Anon Key'inizi alıyoruz.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Supabase istemcisini oluşturup dışa aktarıyoruz.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
