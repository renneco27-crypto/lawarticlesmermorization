import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, getSupabaseClient } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    const supabase = getSupabaseClient()

    const { data: profile, error: fetchError } = await supabase
      .from('lex_profiles')
      .select('streak, longest_streak, last_active_date')
      .eq('id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const lastActive = profile?.last_active_date
    let newStreak = 1

    if (lastActive) {
      const lastStr = lastActive.slice(0, 10)
      if (lastStr === todayStr) {
        newStreak = profile?.streak ?? 1
      } else {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().slice(0, 10)
        if (lastStr === yesterdayStr) {
          newStreak = (profile?.streak ?? 0) + 1
        } else {
          newStreak = 1
        }
      }
    }

    const newLongest = Math.max(newStreak, profile?.longest_streak ?? 0)

    const { error: updateError } = await supabase
      .from('lex_profiles')
      .update({ streak: newStreak, longest_streak: newLongest, last_active_date: todayStr })
      .eq('id', user.id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({ streak: newStreak, longestStreak: newLongest })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
