// app/api/hint/route.ts
// POST /api/hint
// Body: { word: string, context: string, hintType: 'rhyme' | 'definition' | 'encouragement' }
// Returns: { hint: string }
// Calls Mistral server-side — MISTRAL_API_KEY never leaves the server

import { NextRequest, NextResponse } from 'next/server'
import { getShortDefinition } from '@/lib/dictionaryService'

type HintRequestBody = {
  word: string
  context: string
  hintType: 'rhyme' | 'definition' | 'encouragement'
}

async function callMistral(word: string, context: string): Promise<string | null> {
  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) return null

  const prompt = `You are a friendly law tutor helping a student memorize the Philippine Civil Code.
The student is trying to recall the word: "${word}".
It appears in this sentence: "${context}"
Keep your hint to 1 sentence, under 15 words.
Do NOT say the word. Give a clue about its legal meaning.`

  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 60,
        temperature: 0.7,
      }),
    })

    if (!res.ok) return null

    const data = await res.json()
    return data?.choices?.[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  let body: HintRequestBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { word, context, hintType } = body

  if (!word || !context) {
    return NextResponse.json({ error: 'Missing word or context' }, { status: 400 })
  }

  // 1. Try Mistral
  const mistralHint = await callMistral(word, context)
  if (mistralHint) {
    return NextResponse.json({ hint: mistralHint })
  }

  // 2. Fallback: dictionary definition
  if (hintType === 'definition') {
    const definition = await getShortDefinition(word)
    if (definition) {
      return NextResponse.json({ hint: `This word means: ${definition}` })
    }
  }

  // 3. Final fallback: first-letter hint
  const firstLetter = word.charAt(0).toUpperCase()
  return NextResponse.json({ hint: `The word starts with the letter "${firstLetter}".` })
}
