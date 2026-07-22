import type { WordToken, WordType } from '@/types'

// ─── Legal Noun List ──────────────────────────────────────────────────────────
// Philippine Civil Code legal terms that trigger spell/type-it challenges

export const LEGAL_NOUN_LIST: string[] = [
  // Property & obligations
  'usufruct', 'usufructuary', 'easement', 'servitude', 'mortgage', 'pledge',
  'hypothec', 'antichresis', 'commodatum', 'mutuum', 'deposit',
  'bailment', 'lien', 'encumbrance', 'escheat',

  // Succession
  'legitime', 'legitimes', 'intestate', 'testate', 'testator', 'testatrix',
  'intestacy', 'succession', 'heir', 'legatee', 'devisee', 'testamentary',
  'codicil', 'holographic', 'probate', 'decedent', 'predecease',
  'accretion', 'representation', 'substitution', 'fideicommissary',
  'preterition', 'disinheritance',

  // Persons & family
  'emancipation', 'patria', 'potestas', 'parens', 'patriae',
  'filiation', 'legitimation', 'adoption', 'guardianship', 'tutorship',
  'curator', 'curatorship', 'domicile', 'residence', 'absence',
  'presumptive', 'presumption',

  // Contracts
  'rescission', 'annulment', 'voidable', 'rescissible', 'unenforceable',
  'novation', 'subrogation', 'cession', 'dation', 'consignation',
  'compensation', 'confusion', 'remission', 'condonation',
  'stipulation', 'prestations', 'prestation',

  // Actions & remedies
  'accion', 'publiciana', 'reivindicatoria', 'interdictal',
  'unlawful', 'detainer', 'forcible', 'entry',

  // Latin maxims and terms
  'in', 'pari', 'delicto', 'ex', 'contractu', 'quasi',
  'delict', 'quasi-delict', 'solutio', 'indebiti', 'negotiorum', 'gestio',

  // Civil status
  'annulment', 'nullity', 'bigamy', 'concubinage', 'adultery',
  'dowry', 'conjugal', 'paraphernal', 'absolute', 'community',

  // Other
  'prescription', 'laches', 'estoppel', 'ratification', 'convalidation',
  'solidary', 'indivisible', 'alternative', 'facultative',
  'penal', 'clause', 'surety', 'guaranty', 'guarantor',
  'subrogee', 'subrogor', 'obligor', 'obligee', 'creditor', 'debtor',
  'mortgagor', 'mortgagee', 'pledgor', 'pledgee',
]

// ─── Function Word List ───────────────────────────────────────────────────────
// Articles, prepositions, conjunctions — skip hints for these

export const FUNCTION_WORD_LIST: string[] = [
  // Articles
  'a', 'an', 'the',
  // Prepositions
  'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'into',
  'onto', 'upon', 'about', 'above', 'below', 'under', 'over', 'after',
  'before', 'between', 'among', 'through', 'during', 'within', 'without',
  'against', 'toward', 'towards', 'across', 'behind', 'beyond', 'beside',
  'besides', 'along', 'around', 'throughout', 'until', 'unless', 'except',
  'per', 'via', 'vs',
  // Conjunctions
  'and', 'or', 'but', 'nor', 'so', 'yet', 'for', 'although', 'though',
  'because', 'since', 'unless', 'until', 'while', 'when', 'where', 'that',
  'which', 'who', 'whom', 'whose', 'if', 'whether', 'as', 'than',
  'both', 'either', 'neither', 'not', 'only', 'also',
  // Pronouns
  'he', 'she', 'it', 'they', 'we', 'i', 'you', 'his', 'her', 'its',
  'their', 'our', 'my', 'your', 'this', 'that', 'these', 'those',
  'him', 'them', 'us', 'me', 'who', 'whom', 'what', 'which',
  // Auxiliary verbs
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might',
  'must', 'can', 'could', 'ought',
  // Common small words
  'no', 'not', 'any', 'all', 'each', 'every', 'some', 'such',
  'same', 'own', 'other', 'another', 'one', 'two', 'three',
]

// Normalize for lookup
const LEGAL_NOUN_SET = new Set(LEGAL_NOUN_LIST.map(w => w.toLowerCase()))
const FUNCTION_WORD_SET = new Set(FUNCTION_WORD_LIST.map(w => w.toLowerCase()))

// ─── Word Classification ──────────────────────────────────────────────────────

export function isLegalNoun(word: string): boolean {
  return LEGAL_NOUN_SET.has(word.toLowerCase())
}

export function isFunctionWord(word: string): boolean {
  return FUNCTION_WORD_SET.has(word.toLowerCase())
}

function isProperNoun(word: string, rawToken: string): boolean {
  // Proper nouns: capitalized but not the first word of a sentence
  // and not a legal noun
  if (isLegalNoun(word)) return false
  if (isFunctionWord(word)) return false
  // If the raw token starts with uppercase and isn't first-word context
  // We check if the raw starts with uppercase
  return rawToken.length > 0 && rawToken[0] === rawToken[0].toUpperCase() &&
    rawToken[0] !== rawToken[0].toLowerCase() &&
    word.length > 1
}

export function classifyWord(word: string, raw?: string): WordType {
  const lower = word.toLowerCase()
  if (isFunctionWord(lower)) return 'FUNCTION_WORD'
  if (isLegalNoun(lower)) return 'LEGAL_NOUN'
  if (raw && isProperNoun(lower, raw)) return 'PROPER_NOUN'
  return 'COMMON_WORD'
}

// ─── Tokenizer ────────────────────────────────────────────────────────────────

export function tokenizeArticle(contentMd: string): WordToken[] {
  const tokens: WordToken[] = []
  // Split on whitespace, preserve original tokens
  const rawTokens = contentMd.trim().split(/\s+/)
  let index = 0

  for (let i = 0; i < rawTokens.length; i++) {
    const raw = rawTokens[i]
    if (!raw) continue

    // Strip punctuation to get the clean word
    const word = raw.toLowerCase().replace(/[^a-z0-9'-]/g, '').trim()
    if (!word) continue

    const isLastInSentence = /[.!?;]$/.test(raw)
    const wordType = classifyWord(word, raw)

    tokens.push({
      index,
      raw,
      word,
      wordType,
      isLastInSentence,
    })
    index++
  }

  return tokens
}
