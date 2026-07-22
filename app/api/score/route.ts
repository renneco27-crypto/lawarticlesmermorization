// POST /api/score — Scores a spoken transcript against an article
// Body: { transcript: string, articleId: string }
// Returns: AttemptScore

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabaseAdmin'
import { fetchArticle } from '@/lib/articleService'
import { scoreAttempt } from '@/lib/scoreEngine'

export async function POST(request: NextRequest) {
  try {
    await getUserFromRequest(request)

    let body: { transcript: string; articleId: string; currentStates?: (string | null)[] }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { transcript, articleId, currentStates } = body
    if (!transcript || !articleId) {
      return NextResponse.json({ error: 'Missing transcript or articleId' }, { status: 400 })
    }

    const article = await fetchArticle(articleId)
    const result = await scoreAttempt(transcript, article.tokens, currentStates as any)
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Scoring failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
