import type { CacheEntry } from '@/types'

// ─── Cache Key Constants ──────────────────────────────────────────────────────
// Always use these, never hardcode strings

export const CACHE_KEYS = {
  ALL_ARTICLES:     'articles:all',
  BOOK:             (book: string) => `articles:book:${book}`,
  ARTICLE:          (id: string)   => `article:${id}`,
  PROGRESS:         (userId: string) => `progress:${userId}`,
  CURRENT_SESSION:  'session:current',
  PHONETIC:         (word: string) => `phonetic:${word}`,
  DEFINITION:       (word: string) => `define:${word}`,
} as const

// ─── TTL Constants (milliseconds) ─────────────────────────────────────────────

export const TTL = {
  ARTICLES:   24 * 60 * 60 * 1000,  // 24 hours
  PROGRESS:    5 * 60 * 1000,        // 5 minutes
  DEFINITION:  7 * 24 * 60 * 60 * 1000, // 7 days
  PHONETIC:    7 * 24 * 60 * 60 * 1000, // 7 days
  SESSION:     0,                    // no TTL (cleared manually)
} as const

// ─── In-Memory Layer (Layer 1) ────────────────────────────────────────────────

const memoryCache = new Map<string, CacheEntry<unknown>>()

function isExpired(entry: CacheEntry<unknown>): boolean {
  if (entry.ttlMs === 0) return false // no expiry
  return Date.now() - entry.cachedAt > entry.ttlMs
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getCached<T>(key: string): T | null {
  // Layer 1: in-memory
  const memEntry = memoryCache.get(key) as CacheEntry<T> | undefined
  if (memEntry && !isExpired(memEntry)) {
    return memEntry.value
  }

  // Layer 2: localStorage (only in browser)
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const lsEntry = JSON.parse(raw) as CacheEntry<T>
    if (isExpired(lsEntry)) {
      localStorage.removeItem(key)
      return null
    }
    // Repopulate memory cache
    memoryCache.set(key, lsEntry as CacheEntry<unknown>)
    return lsEntry.value
  } catch {
    return null
  }
}

export function setCached<T>(key: string, value: T, ttlMs: number): void {
  const entry: CacheEntry<T> = {
    value,
    cachedAt: Date.now(),
    ttlMs,
  }

  // Layer 1: in-memory (always)
  memoryCache.set(key, entry as CacheEntry<unknown>)

  // Layer 2: localStorage (browser only, skip for session with no TTL)
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(entry))
  } catch (e) {
    // localStorage full — silently fail, memory cache still works
    console.warn('[cacheManager] localStorage write failed:', key, e)
  }
}

export function invalidateCache(key: string): void {
  memoryCache.delete(key)
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }
}

export function clearAllCache(): void {
  memoryCache.clear()
  if (typeof window !== 'undefined') {
    try {
      // Only remove keys we own (prefixed by our known patterns)
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && (
          k.startsWith('articles:') ||
          k.startsWith('article:') ||
          k.startsWith('progress:') ||
          k.startsWith('session:') ||
          k.startsWith('define:') ||
          k.startsWith('phonetic:')
        )) {
          keysToRemove.push(k)
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k))
    } catch {
      // ignore
    }
  }
}
