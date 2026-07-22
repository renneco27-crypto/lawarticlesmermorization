import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabaseAdmin'
import { fetchAllArticles } from '@/lib/articleService'

export async function GET(request: NextRequest) {
  try {
    await getUserFromRequest(request)
    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('book_id') || undefined
    const articles = await fetchAllArticles(bookId)
    return NextResponse.json(articles)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
