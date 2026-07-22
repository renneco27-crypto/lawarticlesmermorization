// lib/scoreEngine.ts
// Phase 3: Word comparison, levenshtein, and full phonetic matching pipeline (Section 19)
// Plus number-to-word normalization (Section 20)

import type { WordToken, AttemptScore, ScoredWord, WordStatus } from '@/types'

// ─── Number-to-Word Normalization ───────────────────────────────────────────

const DIGIT_WORDS: Record<string, string> = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
  '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen', '14': 'fourteen',
  '15': 'fifteen', '16': 'sixteen', '17': 'seventeen', '18': 'eighteen', '19': 'nineteen',
  '20': 'twenty', '30': 'thirty', '40': 'forty', '50': 'fifty',
  '60': 'sixty', '70': 'seventy', '80': 'eighty', '90': 'ninety',
  '100': 'hundred', '1000': 'thousand',
}

const ORDINAL_WORDS: Record<number, string> = {
  1: 'first', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth',
  6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth',
  11: 'eleventh', 12: 'twelfth', 13: 'thirteenth', 14: 'fourteenth', 15: 'fifteenth',
  16: 'sixteenth', 17: 'seventeenth', 18: 'eighteenth', 19: 'nineteenth', 20: 'twentieth',
  30: 'thirtieth', 40: 'fortieth', 50: 'fiftieth', 60: 'sixtieth', 70: 'seventieth',
  80: 'eightieth', 90: 'ninetieth', 100: 'hundredth',
}

function numberToWords(num: number): string {
  if (num === 0) return DIGIT_WORDS['0']
  
  let words: string[] = []
  let n = num
  
  if (n >= 1000) {
    const thousands = Math.floor(n / 1000)
    words.push(convertUnderThousand(thousands))
    words.push('thousand')
    n %= 1000
  }
  
  if (n >= 100) {
    const hundreds = Math.floor(n / 100)
    words.push(DIGIT_WORDS[hundreds.toString()])
    words.push('hundred')
    n %= 100
  }
  
  if (n >= 20) {
    const tens = Math.floor(n / 10) * 10
    words.push(DIGIT_WORDS[tens.toString()])
    n %= 10
    if (n > 0) {
      words.push(DIGIT_WORDS[n.toString()])
    }
  } else if (n > 0) {
    words.push(DIGIT_WORDS[n.toString()])
  }
  
  return words.join(' ')
}

function convertUnderThousand(num: number): string {
  if (num === 0) return ''
  if (num < 20) return DIGIT_WORDS[num.toString()] || ''
  
  const tens = Math.floor(num / 10) * 10
  const ones = num % 10
  
  let result = DIGIT_WORDS[tens.toString()] || ''
  if (ones > 0) {
    result += ' ' + (DIGIT_WORDS[ones.toString()] || '')
  }
  
  return result.trim()
}

function isOrdinalFormat(text: string): boolean {
  return /^\d+(st|nd|rd|th)$/.test(text)
}

function getOrdinalNumber(text: string): number | null {
  const match = text.match(/^(\d+)(st|nd|rd|th)$/)
  return match ? parseInt(match[1], 10) : null
}

export function normalizeNumbers(text: string): string {
  return text.replace(/\d+(?:st|nd|rd|th)?|\d{1,3}(?:,\d{3})*(?:\.\d+)?/g, (match) => {
    // Handle ordinals: "1st" → "first", "21st" → "twenty first"
    if (isOrdinalFormat(match)) {
      const num = getOrdinalNumber(match)
      if (num !== null) {
        if (ORDINAL_WORDS[num]) {
          return ORDINAL_WORDS[num]
        }
        // Composite ordinal: 21st → twenty first, 101st → one hundred first
        if (num % 10 === 0 && ORDINAL_WORDS[num]) return ORDINAL_WORDS[num]
        // Fall back to "twenty" + ordinal suffix
        const base = Math.floor(num / 10) * 10
        const remainder = num % 10
        if (remainder === 0) return ORDINAL_WORDS[num] || numberToWords(num)
        const baseWord = DIGIT_WORDS[base.toString()] || ''
        const ordinalWord = ORDINAL_WORDS[remainder] || ''
        return baseWord + ' ' + ordinalWord
      }
    }
    
    // Handle plain numbers: remove commas, convert to words
    const cleanNum = match.replace(/,/g, '')
    const parsed = parseInt(cleanNum, 10)
    
    if (isNaN(parsed)) return match
    
    // Special case: years (assume 4-digit numbers as potential years)
    if (match.length === 4 && parsed >= 1000 && parsed <= 2999) {
      // e.g., "1998" → "nineteen ninety-eight"
      const firstTwo = Math.floor(parsed / 100)
      const lastTwo = parsed % 100
      let yearWords = numberToWords(firstTwo)
      if (lastTwo > 0) {
        yearWords += ' ' + numberToWords(lastTwo)
      } else {
        yearWords += ' hundred'
      }
      return yearWords
    }
    
    // Regular number conversion
    if (parsed > 999) {
      return numberToWords(parsed)
    }
    
    return numberToWords(parsed)
  })
}

// ─── Diacritic Normalization ─────────────────────────────────────────────────

function stripDiacritics(word: string): string {
  return word.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// ─── Levenshtein Distance ────────────────────────────────────────────────────

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

export function normalizeWord(word: string): string {
  return stripDiacritics(word.toLowerCase().replace(/[^a-z0-9]/gi, '').trim())
}

export function isCloseEnough(spoken: string, target: string): boolean {
  return levenshteinDistance(normalizeWord(spoken), normalizeWord(target)) <= 1
}

// ─── Layer 1: Static Homophone Groups ────────────────────────────────────────

const HOMOPHONE_GROUPS: string[][] = [
  ['flower', 'flour'],
  ['knight', 'night'],
  ['sea', 'see'],
  ['to', 'too', 'two'],
  ['their', 'there', "they're"],
  ['right', 'write', 'rite'],
  ['know', 'no'],
  ['new', 'knew'],
  ['hear', 'here'],
  ['bare', 'bear'],
  ['been', 'bin'],
  ['buy', 'by', 'bye'],
  ['for', 'four', 'fore'],
  ['hole', 'whole'],
  ['mail', 'male'],
  ['meat', 'meet', 'mete'],
  ['pair', 'pear', 'pare'],
  ['peace', 'piece'],
  ['plain', 'plane'],
  ['principal', 'principle'],
  ['road', 'rode', 'rowed'],
  ['role', 'roll'],
  ['sale', 'sail'],
  ['sole', 'soul'],
  ['son', 'sun'],
  ['stair', 'stare'],
  ['tale', 'tail'],
  ['wait', 'weight'],
  ['week', 'weak'],
  ['which', 'witch'],
  ['wood', 'would'],
  // Philippine Civil Code legal terms
  ['heir', 'air'],
  ['cite', 'site', 'sight'],
  ['compliment', 'complement'],
  ['council', 'counsel'],
]

const HOMOPHONE_MAP = new Map<string, string>()
for (const group of HOMOPHONE_GROUPS) {
  const key = [...group].sort().join('|')
  for (const word of group) HOMOPHONE_MAP.set(word, key)
}

function inSameHomophoneGroup(a: string, b: string): boolean {
  const keyA = HOMOPHONE_MAP.get(a)
  return !!keyA && keyA === HOMOPHONE_MAP.get(b)
}

// ─── Layer 2: Consonant Skeleton ─────────────────────────────────────────────

const SILENT_PATTERNS: [RegExp, string][] = [
  [/^kn/, 'n'],
  [/^wr/, 'r'],
  [/gh/g, ''],
  [/^ps/, 's'],
  [/mb$/, 'm'],
  [/^gn/, 'n'],
]

function consonantSkeleton(word: string): string {
  let w = stripDiacritics(word.toLowerCase())
  for (const [pattern, replacement] of SILENT_PATTERNS) {
    w = w.replace(pattern, replacement)
  }
  return w.replace(/[aeiou]/g, '')
}

// ─── Layer 3: Syllable Count ─────────────────────────────────────────────────

function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^aeiouy]/g, '')
  const merged = cleaned.replace(/[aeiou]{2,}/g, 'a')
  return merged.length || 1
}

// ─── Layer 4: Rhyme Tail ─────────────────────────────────────────────────────

function rhymeTail(word: string): string {
  return consonantSkeleton(word).slice(-3)
}

// ─── Layer 4.5: Phonetic Onset + Consonant Class Match ─────────────────────────

const CONSONANT_CLASSES: Record<string, string> = {
  b: 'P', p: 'P',
  d: 'T', t: 'T',
  g: 'K', k: 'K', c: 'K', q: 'K',
  f: 'F', v: 'F', ph: 'F',
  s: 'S', z: 'S', x: 'S',
  m: 'M', n: 'N',
  l: 'L', r: 'R',
  w: 'W', y: 'Y', h: 'H',
  j: 'J',
}

function consonantClass(word: string): string {
  let result = ''
  for (const ch of word.toLowerCase()) {
    const cls = CONSONANT_CLASSES[ch] ?? ''
    if (cls && (!result || result[result.length - 1] !== cls)) {
      result += cls
    }
  }
  return result
}

function sameOnsetAndClass(wordA: string, wordB: string): boolean {
  const a = normalizeWord(wordA)
  const b = normalizeWord(wordB)
  if (!a || !b) return false

  // Same first letter
  if (a[0] !== b[0]) return false

  // Consonant class skeleton is similar (lev <= 1)
  const clsA = consonantClass(a)
  const clsB = consonantClass(b)
  if (levenshteinDistance(clsA, clsB) <= 1) return true

  // Same length and similar edit distance proportional to length
  const maxLen = Math.max(a.length, b.length)
  if (maxLen <= 5 && levenshteinDistance(a, b) <= 2) return true

  return false
}

// ─── Layer 5: IPA API Fallback ────────────────────────────────────────────────

// In-memory cache for phonetic lookups (supplements localStorage cache)
const phoneticMemoryCache = new Map<string, string | null>()

async function fetchPhonetic(word: string): Promise<string | null> {
  if (phoneticMemoryCache.has(word)) return phoneticMemoryCache.get(word) ?? null

  // Check localStorage cache first (TTL: 7 days as per cache strategy)
  const localKey = `phonetic:${word}`
  try {
    const cached = localStorage.getItem(localKey)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.cachedAt < 7 * 24 * 60 * 60 * 1000) {
        phoneticMemoryCache.set(word, parsed.value)
        return parsed.value
      }
    }
  } catch {
    // localStorage unavailable — proceed to fetch
  }

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
    const data = await res.json()
    const phonetic = data?.[0]?.phonetic ?? null
    phoneticMemoryCache.set(word, phonetic)
    try {
      localStorage.setItem(localKey, JSON.stringify({ value: phonetic, cachedAt: Date.now() }))
    } catch {
      // localStorage write failed — in-memory still works
    }
    return phonetic
  } catch {
    phoneticMemoryCache.set(word, null)
    return null
  }
}

function normalizeIPA(ipa: string): string {
  return ipa.replace(/[ˈˌ.\\/]/g, '').trim()
}

async function phoneticAPIMatch(a: string, b: string): Promise<boolean> {
  const [ipaA, ipaB] = await Promise.all([fetchPhonetic(a), fetchPhonetic(b)])
  if (!ipaA || !ipaB) return false
  return normalizeIPA(ipaA) === normalizeIPA(ipaB)
}

// ─── Composed: phoneticMatch() ────────────────────────────────────────────────

export async function phoneticMatch(spoken: string, target: string): Promise<boolean> {
  const a = stripDiacritics(spoken.toLowerCase().trim())
  const b = stripDiacritics(target.toLowerCase().trim())

  // Layer 0: exact after normalization
  if (a === b) return true

  // Layer 1: static homophone groups
  if (inSameHomophoneGroup(a, b)) return true

  // Layer 2: levenshtein typo tolerance
  if (levenshteinDistance(a, b) <= 1) return true

  // Layer 3: identical consonant skeleton
  const skelA = consonantSkeleton(a)
  const skelB = consonantSkeleton(b)
  if (skelA === skelB) return true

  // Layer 4: skeleton length within 1 + same rhyme tail + same syllable count
  if (
    Math.abs(skelA.length - skelB.length) <= 1 &&
    rhymeTail(a) === rhymeTail(b) &&
    countSyllables(a) === countSyllables(b)
  ) return true

  // Layer 5: same onset + consonant class match (handles "app"/"act", "law"/"low")
  if (sameOnsetAndClass(a, b)) return true

  // Layer 6: IPA API fallback (async, cached)
  return await phoneticAPIMatch(a, b)
}

// ─── Core: scoreAttempt() ────────────────────────────────────────────────────

/**
 * Compares the user's spoken transcript against the article tokens.
 * Uses a greedy forward-scan: for each spoken word, we walk forward through
 * the token list looking for a match within a window to allow for skip/stutter.
 *
 * Numbers are normalized to words before matching.
 * FUNCTION_WORDs that were skipped are forgiven (not counted as wrong).
 * Final score = correct / non-function-words * 100
 */
export async function scoreAttempt(
  spoken: string,
  target: WordToken[],
  currentStates?: (WordStatus | null)[]
): Promise<AttemptScore> {
  const normalizedSpoken = normalizeNumbers(spoken)

  const spokenWords = normalizedSpoken
    .trim()
    .split(/\s+/)
    .map((w) => normalizeWord(w))
    .filter(Boolean)

  const scoredWords: ScoredWord[] = target.map((token, i) => ({
    ...token,
    status: currentStates?.[i] === 'correct' ? 'correct' : ('pending' as WordStatus),
  }))

  const WINDOW = 5

  // Pass 1: sequential cursor scan
  // Each spoken word looks ahead WINDOW tokens from cursor; if matched, mark correct and advance.
  // If none match, the spoken word is simply a miss — do NOT consume or advance the cursor.
  // This prevents premature wrong-marking and allows subsequent correct words to still match.
  let cursor = target.findIndex((_, i) => scoredWords[i].status === 'pending')
  if (cursor < 0) cursor = 0

  for (const spokenWord of spokenWords) {
    if (cursor >= target.length) break
    let matchIdx = -1
    for (let look = 0; look < WINDOW && cursor + look < target.length; look++) {
      const idx = cursor + look
      if (scoredWords[idx].status !== 'pending') continue
      const token = target[idx]
      const normalizedToken = normalizeNumbers(token.word)
      const targetNorm = normalizeWord(normalizedToken)
      const isMatch = await phoneticMatch(spokenWord, targetNorm)
      if (isMatch) {
        matchIdx = idx
        break
      }
    }
    if (matchIdx >= 0) {
      scoredWords[matchIdx].status = 'correct'
      scoredWords[matchIdx].spokenAs = spokenWord
      cursor = matchIdx + 1
    }
    // No match: spoken word is a miss — cursor stays, next spoken word still gets a fair shot
  }

  // Pass 2: anything still pending after all spoken words are consumed gets marked.
  // Function words that were skipped over are forgiven (correct); content words are wrong.
  for (let i = 0; i < scoredWords.length; i++) {
    if (scoredWords[i].status === 'pending') {
      scoredWords[i].status =
        target[i].wordType === 'FUNCTION_WORD' ? 'correct' : 'wrong'
    }
  }

  const nonFunctionWords = target.filter((t) => t.wordType !== 'FUNCTION_WORD')
  const correctWords = scoredWords.filter(
    (w, i) => w.status === 'correct' && target[i].wordType !== 'FUNCTION_WORD'
  ).length

  const totalWords = target.length
  const percentCorrect =
    nonFunctionWords.length > 0
      ? Math.round((correctWords / nonFunctionWords.length) * 100)
      : 100

  return {
    totalWords,
    correctWords,
    percentCorrect,
    scoredWords,
  }
}
