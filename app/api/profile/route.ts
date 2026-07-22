// GET /api/profile — Returns user stats (XP, streak, hearts)
// Auth: Bearer token from Supabase anonymous sign-in

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabaseAdmin'
import { getSupabaseClient } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('lex_profiles')
      .select('total_xp, streak, longest_streak, last_active_date, hearts')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      totalXP: data?.total_xp ?? 0,
      streak: data?.streak ?? 0,
      longestStreak: data?.longest_streak ?? 0,
      hearts: data?.hearts ?? 5,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
