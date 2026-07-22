import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) throw new Error('Missing auth token')
    const token = auth.slice(7)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
    const auth = request.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) throw new Error('Missing auth token')
    const token = auth.slice(7)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: { articleId: string }
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!body.articleId) {
      return NextResponse.json({ error: 'Missing articleId' }, { status: 400 })
    }

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
