# SYSTEM FUNCTION REGISTRY

<-- AUTO-MAINTAINED BY OPENCODE -->

## Core Functions & Utilities

### `scoreAttempt(spoken, target, currentStates)` — `index.html:2580`
Client-side scoring engine with layers: exact match, homophones, Levenshtein ≤1, consonant skeleton, rhyme+onset+class, numeric reinterpretation, fuzzy number suffix matching, multi-word sub-token matching, and adaptive in-session recovery pass.

**Return:** `{totalWords, correctWords, percentCorrect, scoredWords: [{word, wordType, status, spokenAs, matchedSpokenJStart, matchedSpokenJEnd}]}`

**Recovery pass** (line 2762): When a keyword is scored wrong but flanked by two correctly-matched spoken words, extracts the spoken gap and checks syllable count (±1) + character overlap (≥3%). If both pass, marks the target word as correct for this attempt only — no DB persistence.

### `submitScore(transcript)` — `index.html:2831`
Submits a speech transcript for scoring, calls `scoreAttempt()`, updates word states, score display, and coach.

### `phoneticMatch(a, b)` — `index.html:2505`
Compares two normalized words using multi-layer phonetic matching.

### `countSyllables(w)` — `index.html:2500`
Returns approximate syllable count by collapsing vowel runs.

### `normalizeWord(w)` — `index.html:2420`
Normalizes a word: lowercase, trim, remove punctuation except hyphens/apostrophes, expand common contractions, run `normalizeNumbers`.

### `normalizeNumbers(text)` — `index.html:2440`
Expands written numbers (e.g. "thirty two" → "32") and digit strings, preserving separator patterns.

### `tryReinterpretSpokenNumber(str)` — `index.html:2490`
Returns array of plausible numeric reinterpretations for ambiguous spoken numbers (e.g. "19132" → [19132, 1932]).

### `fuzzyNumberMatch(spokenStr, targetNum)` — `index.html:2589`
Checks if a spoken number matches a target number exactly, via digit suffix, or reinterpretation.

### `mergeAdjacentNumbers(words)` — `index.html:2604`
Merges adjacent digit-only words in raw spoken output (e.g. "19 132" → "19132").
