import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, getSupabaseClient } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('lex_weak_spots')
      .select('id, article_id, wrong_count, last_wrong_at')
      .eq('user_id', user.id)
      .order('wrong_count', { ascending: false })
      .order('last_wrong_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data || [])
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    let body: { articleId: string }
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!body.articleId) {
      return NextResponse.json({ error: 'Missing articleId' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Upsert: increment wrong_count on conflict
    const { data: existing } = await supabase
      .from('lex_weak_spots')
      .select('id, wrong_count')
      .eq('user_id', user.id)
      .eq('article_id', body.articleId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('lex_weak_spots')
        .update({ wrong_count: existing.wrong_count + 1, last_wrong_at: new Date().toISOString() })
        .eq('id', existing.id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await supabase
        .from('lex_weak_spots')
        .insert({ user_id: user.id, article_id: body.articleId, wrong_count: 1 })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
