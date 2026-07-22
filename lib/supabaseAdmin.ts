import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}

export async function getUserFromRequest(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) throw new Error('Missing auth token')
  const token = auth.slice(7)
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) throw new Error('Unauthorized')
  return data.user
}
