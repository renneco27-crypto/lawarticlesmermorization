// app/api/define/route.ts
// GET /api/define?word=usufruct
// Proxies to dictionaryapi.dev with server-side caching

import { NextRequest, NextResponse } from 'next/server'
import { getShortDefinition } from '@/lib/dictionaryService'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const word = searchParams.get('word')?.trim()

  if (!word || word.length === 0) {
    return NextResponse.json({ error: 'Missing word parameter' }, { status: 400 })
  }

  try {
    const definition = await getShortDefinition(word)
    return NextResponse.json({ definition })
  } catch {
    return NextResponse.json({ definition: null })
  }
}
