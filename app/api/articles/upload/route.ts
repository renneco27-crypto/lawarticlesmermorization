import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, getSupabaseClient } from '@/lib/supabaseAdmin'

interface ArticleRow {
  chapter: string
  article_number: number
  title: string
  content_md: string
}

export async function POST(request: NextRequest) {
  console.log('[upload] POST hit')
  try {
    await getUserFromRequest(request)
    console.log('[upload] auth OK')

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

    // Deduplicate by article_number within this batch — last row wins
    const deduped = Object.values(
      valid.reduce((acc, r) => {
        acc[r.article_number] = r
        return acc
      }, {} as Record<number, ArticleRow>)
    )
    const dupesStripped = valid.length - deduped.length

    // Use the service role client — bypasses RLS cleanly, no token state to degrade
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from('lex_articles').upsert(
      deduped.map(r => ({
        book_id: body.bookId,
        book: '',
        chapter: r.chapter,
        article_number: r.article_number,
        title: r.title,
        content_md: r.content_md,
      })),
      { onConflict: 'book_id,article_number', ignoreDuplicates: false }
    ).select('id')

    if (error) {
      console.error('[upload] Supabase error:', JSON.stringify(error, null, 2))
      return NextResponse.json({ inserted: 0, errors: [{ row: -1, reason: error.message }] }, { status: 500 })
    }

    return NextResponse.json({ inserted: data.length, errors, dupesStripped })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
