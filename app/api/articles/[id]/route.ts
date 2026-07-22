import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, getSupabaseClient } from '@/lib/supabaseAdmin'
import { fetchArticle } from '@/lib/articleService'
import { createClient } from '@supabase/supabase-js'

function getAuthedClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('Missing Supabase env vars')
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

function extractToken(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) throw new Error('Missing auth token')
  return auth.slice(7)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getUserFromRequest(request)
    const article = await fetchArticle(params.id)
    return NextResponse.json(article)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Not found'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractToken(request)
    await getUserFromRequest(request)

    let body: { book?: string; chapter?: string; article_number?: number; title?: string; content_md?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (body.book !== undefined) updates.book = body.book
    if (body.chapter !== undefined) updates.chapter = body.chapter
    if (body.article_number !== undefined) updates.article_number = body.article_number
    if (body.title !== undefined) updates.title = body.title
    if (body.content_md !== undefined) updates.content_md = body.content_md

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const supabase = getAuthedClient(token)
    const { data, error } = await supabase
      .from('lex_articles')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractToken(request)
    await getUserFromRequest(request)

    const supabase = getAuthedClient(token)
    const { error } = await supabase
      .from('lex_articles')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Delete failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
