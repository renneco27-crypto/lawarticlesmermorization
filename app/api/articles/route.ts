// GET /api/articles — Returns all articles with word tokens
// Auth: Bearer token from Supabase anonymous sign-in

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabaseAdmin'
import { fetchAllArticles } from '@/lib/articleService'

export async function GET(request: NextRequest) {
  try {
    await getUserFromRequest(request)
    const articles = await fetchAllArticles()
    return NextResponse.json(articles)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
