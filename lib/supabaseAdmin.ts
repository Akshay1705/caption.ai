import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Key is missing from .env')
}

// Initialize the client with the service_role key for admin privileges
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)