import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface ArticleRow {
  chapter: string
  article_number: number
  title: string
  content_md: string
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    const token = auth.slice(7)

    let body: { bookId?: string; articles: ArticleRow[] }
    try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

    if (!body.articles || !Array.isArray(body.articles) || body.articles.length === 0) {
      return NextResponse.json({ error: 'Missing articles array' }, { status: 400 })
    }

    if (!body.bookId) return NextResponse.json({ error: 'Missing bookId' }, { status: 400 })

    const errors: { row: number; reason: string }[] = []
    const valid: ArticleRow[] = []

    for (let i = 0; i < body.articles.length; i++) {
      const row = body.articles[i]
      if (!row.chapter || typeof row.chapter !== 'string') errors.push({ row: i, reason: 'Missing or invalid chapter' })
      else if (!Number.isInteger(row.article_number) || row.article_number < 1) errors.push({ row: i, reason: 'Missing or invalid article_number' })
      else if (!row.title || typeof row.title !== 'string') errors.push({ row: i, reason: 'Missing or invalid title' })
      else if (!row.content_md || typeof row.content_md !== 'string') errors.push({ row: i, reason: 'Missing or invalid content_md' })
      else valid.push(row)
    }

    if (valid.length === 0) return NextResponse.json({ inserted: 0, errors }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data, error } = await supabase.from('lex_articles').insert(
      valid.map(r => ({
        book_id: body.bookId,
        book: '',
        chapter: r.chapter,
        article_number: r.article_number,
        title: r.title,
        content_md: r.content_md,
      }))
    ).select('id')

    if (error) return NextResponse.json({ inserted: 0, errors: [{ row: -1, reason: error.message }] }, { status: 500 })

    return NextResponse.json({ inserted: data.length, errors })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
