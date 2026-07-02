import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabasePubKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

// Export a placeholder supabase client for easy future integration
export const supabase = supabaseUrl && supabasePubKey
  ? createClient(supabaseUrl, supabasePubKey)
  : null
