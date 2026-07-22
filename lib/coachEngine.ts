// lib/coachEngine.ts
// Generates hints for missed words based on word type and attempt number

import type { WordToken, Hint, HintType } from '@/types'
import { getShortDefinition } from '@/lib/dictionaryService'

// ─── Rhyme generation ──────────────────────────────────────────────────────────

// Simple rhyme-word bank for common endings
const RHYME_ENDINGS: Record<string, string[]> = {
  tion: ['nation', 'station', 'motion', 'notion'],
  ment: ['cement', 'moment', 'payment'],
  ity: ['city', 'beauty', 'duty'],
  ous: ['house', 'mouse', 'blouse'],
  ight: ['night', 'bright', 'right'],
  ate: ['late', 'fate', 'rate'],
  ion: ['lion', 'pion', 'ion'],
  ing: ['ring', 'sing', 'king'],
  ful: ['pull', 'full', 'bull'],
  less: ['dress', 'stress', 'press'],
  ness: ['dress', 'press', 'stress'],
  able: ['table', 'cable', 'fable'],
  ible: ['Bible', 'visible', 'flexible'],
  ive: ['live', 'drive', 'arrive', 'give', 'strive'],
  al: ['call', 'hall', 'tall'],
  ance: ['dance', 'chance', 'glance'],
  ence: ['fence', 'sense', 'dense'],
  er: ['her', 'stir', 'blur'],
  est: ['best', 'rest', 'nest'],
  ly: ['fly', 'by', 'sky'],
  ry: ['free', 'tree', 'see'],
  ory: ['glory', 'story', 'glory'],
}

function findRhymeWord(target: string): string | null {
  const lower = target.toLowerCase()
  for (const [ending, rhymes] of Object.entries(RHYME_ENDINGS)) {
    if (lower.endsWith(ending)) {
      // Return a rhyme that isn't the word itself
      const candidate = rhymes.find((r) => r !== lower)
      if (candidate) return candidate
    }
  }
  return null
}

// ─── Hint type classification ──────────────────────────────────────────────────

export function classifyHintType(word: WordToken, attemptNumber: number): HintType {
  const { wordType } = word

  if (wordType === 'FUNCTION_WORD') return 'skip'

  if (wordType === 'LEGAL_NOUN') {
    if (attemptNumber === 1) return 'definition'
    if (attemptNumber === 2) return 'spell_challenge'
    return 'type_it_challenge'
  }

  if (wordType === 'PROPER_NOUN') {
    if (attemptNumber === 1) return 'first_letter'
    return 'type_it_challenge'
  }

  // COMMON_WORD
  if (attemptNumber === 1) return 'rhyme'
  return 'first_letter'
}

// ─── Hint builders ─────────────────────────────────────────────────────────────

export function buildRhymeHint(wordToken: WordToken): Hint {
  const rhyme = findRhymeWord(wordToken.word)
  const text = rhyme
    ? `It rhymes with "${rhyme}".`
    : `It starts with the letter "${wordToken.word.charAt(0).toUpperCase()}".`

  return {
    type: 'rhyme',
    targetWord: wordToken.word,
    text,
    rhymesWith: rhyme ?? undefined,
  }
}

export function buildFirstLetterHint(wordToken: WordToken): Hint {
  const letter = wordToken.word.charAt(0).toUpperCase()
  return {
    type: 'first_letter',
    targetWord: wordToken.word,
    text: `The word starts with the letter "${letter}".`,
  }
}

// ─── Main hint generator ───────────────────────────────────────────────────────

export async function generateHint(word: WordToken, attemptNumber: number): Promise<Hint> {
  const hintType = classifyHintType(word, attemptNumber)

  switch (hintType) {
    case 'skip':
      return {
        type: 'skip',
        targetWord: word.word,
        text: '',
      }

    case 'rhyme':
      return buildRhymeHint(word)

    case 'first_letter':
      return buildFirstLetterHint(word)

    case 'definition': {
      const definition = await getShortDefinition(word.word)
      return {
        type: 'definition',
        targetWord: word.word,
        text: definition
          ? `This word means: ${definition}`
          : `The word starts with "${word.word.charAt(0).toUpperCase()}".`,
        definition: definition ?? undefined,
      }
    }

    case 'spell_challenge':
      return {
        type: 'spell_challenge',
        targetWord: word.word,
        text: `Spell this word: "${word.word.charAt(0).toUpperCase()}${word.word.slice(1)}"`,
      }

    case 'type_it_challenge':
      return {
        type: 'type_it_challenge',
        targetWord: word.word,
        text: `Fill in the missing word.`,
      }

    default:
      return buildFirstLetterHint(word)
  }
}
