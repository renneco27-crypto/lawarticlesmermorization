import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, getSupabaseClient } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    const supabase = getSupabaseClient()

    const { error: profileError } = await supabase
      .from('lex_profiles')
      .update({ total_xp: 0, hearts: 5 })
      .eq('id', user.id)

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    const { error: progressError } = await supabase
      .from('lex_article_progress')
      .delete()
      .eq('user_id', user.id)

    if (progressError) return NextResponse.json({ error: progressError.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
