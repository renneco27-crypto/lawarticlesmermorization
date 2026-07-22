// ─── Articles ───────────────────────────────────────────────────────────────

export type WordType =
  | 'LEGAL_NOUN'    // usufruct, legitime, intestate, maxims
  | 'PROPER_NOUN'   // names, places
  | 'COMMON_WORD'   // general vocabulary
  | 'FUNCTION_WORD' // a, the, of, and, but, in, to, etc.

export type WordToken = {
  index: number
  raw: string           // original text including punctuation
  word: string          // cleaned word, lowercase, no punctuation
  wordType: WordType
  isLastInSentence: boolean
}

export type Article = {
  id: string
  book: string          // 'Book 1'
  bookId: string        // UUID from lex_books
  bookName: string      // book name from lex_books
  chapter: string       // 'Chapter 1 — Effect and Application of Laws'
  articleNumber: number // 1, 2, 3…
  title: string         // 'Article 1'
  contentMd: string     // Raw markdown from DB
  tokens: WordToken[]   // Derived at load time, not stored in DB
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

export type WordStatus =
  | 'pending'   // not yet reached in playback
  | 'correct'   // matched
  | 'wrong'     // spoken but didn't match
  | 'missing'   // skipped over

export type ScoredWord = WordToken & {
  status: WordStatus
  spokenAs?: string   // what the user actually said
}

export type AttemptScore = {
  totalWords: number
  correctWords: number
  percentCorrect: number   // 0–100
  scoredWords: ScoredWord[]
}

// ─── Coach ────────────────────────────────────────────────────────────────────

export type HintType =
  | 'rhyme'
  | 'definition'
  | 'first_letter'
  | 'spell_challenge'
  | 'type_it_challenge'
  | 'skip'              // function words: no hint

export type Hint = {
  type: HintType
  targetWord: string
  text: string          // What coach says aloud
  definition?: string   // from Dictionary API
  rhymesWith?: string
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export type DifficultyLevel = 1 | 2 | 3 | 4

export type Session = {
  id: string
  articleId: string
  userId: string
  difficulty: DifficultyLevel
  hintsEnabled: boolean
  startedAt: Date
  endedAt?: Date
  attempts: AttemptScore[]
}

// ─── Progress ────────────────────────────────────────────────────────────────

export type ArticleStatus = 'not_started' | 'in_progress' | 'mastered'

export type ArticleProgress = {
  articleId: string
  status: ArticleStatus
  bestScore: number       // 0–100
  attemptCount: number
  lastAttemptAt: Date | null
  masteryCount: number    // how many perfect runs (mastered at 3)
}

export type UserStats = {
  totalXP: number
  streak: number          // current daily streak
  longestStreak: number
  masteredCount: number
  totalAttempts: number
}

// ─── Playlist ─────────────────────────────────────────────────────────────────

export type PlaylistMode = 'linear' | 'random' | 'selected' | 'weak_spots'

export type Playlist = {
  id: string
  mode: PlaylistMode
  queue: string[]           // ordered article IDs
  currentIndex: number
  completed: string[]       // article IDs finished this session
}

// ─── Cache ────────────────────────────────────────────────────────────────────

export type CacheEntry<T> = {
  value: T
  cachedAt: number        // Date.now()
  ttlMs: number
}

// ─── TTS Options ──────────────────────────────────────────────────────────────

export type TTSOptions = {
  rate?: number
  pitch?: number
  volume?: number
  voiceName?: string
}

// ─── Dictionary ───────────────────────────────────────────────────────────────

export type DictionaryResult = {
  word: string
  phonetic: string
  definitions: Array<{
    partOfSpeech: string
    definition: string
  }>
}
