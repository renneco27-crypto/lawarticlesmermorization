// PATCH /api/sessions/[id] — Finalizes a session with score data
// Body: { transcript: string, score: number, scoredWords: object[], xpEarned: number }
// Returns: { success: true }

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabaseAdmin'
import { getSupabaseClient } from '@/lib/supabaseAdmin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request)

    let body: { transcript?: string; score?: number; scoredWords?: unknown[]; xpEarned?: number }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('lex_sessions')
      .update({
        transcript: body.transcript ?? null,
        score: body.score ?? null,
        scores_json: body.scoredWords ?? null,
        xp_earned: body.xpEarned ?? 0,
        completed_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
