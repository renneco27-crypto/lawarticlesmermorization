// lib/dictionaryService.ts
// Wrapper for https://api.dictionaryapi.dev — completely free, no API key

import { getCached, setCached, CACHE_KEYS } from '@/lib/cacheManager'

export type DictionaryResult = {
  word: string
  phonetic: string
  definitions: Array<{
    partOfSpeech: string
    definition: string
  }>
}

const DEFINE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function fetchDefinition(word: string): Promise<DictionaryResult | null> {
  const cacheKey = CACHE_KEYS.DEFINITION(word)
  const cached = getCached<DictionaryResult>(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
    if (!res.ok) return null

    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null

    const entry = data[0]
    const definitions: DictionaryResult['definitions'] = []

    for (const meaning of entry.meanings ?? []) {
      for (const def of meaning.definitions ?? []) {
        definitions.push({
          partOfSpeech: meaning.partOfSpeech ?? '',
          definition: def.definition ?? '',
        })
      }
    }

    const result: DictionaryResult = {
      word: entry.word ?? word,
      phonetic: entry.phonetic ?? '',
      definitions,
    }

    setCached(cacheKey, result, DEFINE_TTL_MS)
    return result
  } catch {
    return null
  }
}

export async function getShortDefinition(word: string): Promise<string | null> {
  const result = await fetchDefinition(word)
  if (!result || result.definitions.length === 0) return null
  // Return the first definition, truncated to a single sentence
  const def = result.definitions[0].definition
  const firstSentence = def.split(/[.!?]/)[0].trim()
  return firstSentence ? firstSentence + '.' : null
}
