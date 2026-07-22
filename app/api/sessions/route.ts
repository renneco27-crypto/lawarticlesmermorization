// POST /api/sessions — Creates a new practice session
// Body: { articleId: string, difficulty: number, hintsEnabled: boolean }
// Returns: { sessionId: string }

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabaseAdmin'
import { getSupabaseClient } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    let body: { articleId: string; difficulty: number; hintsEnabled: boolean }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { articleId, difficulty = 1, hintsEnabled = true } = body
    if (!articleId) {
      return NextResponse.json({ error: 'Missing articleId' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('lex_sessions')
      .insert({
        user_id: user.id,
        article_id: articleId,
        difficulty,
        hints_enabled: hintsEnabled,
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sessionId: data.id })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Session creation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
