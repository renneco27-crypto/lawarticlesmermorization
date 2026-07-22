import type { Article, Playlist, PlaylistMode, ArticleProgress } from '../types/index'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `playlist_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// ─── buildPlaylist ────────────────────────────────────────────────────────────

/**
 * Build a Playlist from a mode, an article list, and optional overrides.
 *
 * - 'linear'     → articles sorted by article_number, in order
 * - 'random'     → all articles, shuffled
 * - 'selected'   → only articles whose IDs are in selectedIds, in selection order
 * - 'weak_spots' → articles where bestScore < 80, sorted worst-first;
 *                  requires progressMap to be supplied
 */
export function buildPlaylist(
  mode: PlaylistMode,
  articles: Article[],
  selectedIds?: string[],
  progressMap?: Map<string, ArticleProgress>
): Playlist {
  let queue: string[]

  switch (mode) {
    case 'linear': {
      const sorted = [...articles].sort((a, b) => a.articleNumber - b.articleNumber)
      queue = sorted.map((a) => a.id)
      break
    }

    case 'random': {
      queue = shuffleArray(articles.map((a) => a.id))
      break
    }

    case 'selected': {
      if (!selectedIds || selectedIds.length === 0) {
        // Fallback: treat as linear
        const sorted = [...articles].sort((a, b) => a.articleNumber - b.articleNumber)
        queue = sorted.map((a) => a.id)
      } else {
        // Preserve the order the user selected them
        const articleById = new Map(articles.map((a) => [a.id, a]))
        queue = selectedIds.filter((id) => articleById.has(id))
      }
      break
    }

    case 'weak_spots': {
      if (!progressMap || progressMap.size === 0) {
        // No progress yet — treat as linear
        const sorted = [...articles].sort((a, b) => a.articleNumber - b.articleNumber)
        queue = sorted.map((a) => a.id)
      } else {
        const WEAK_THRESHOLD = 80

        const weakArticles = articles
          .filter((article) => {
            const progress = progressMap.get(article.id)
            if (!progress) return true // never attempted = definitely weak
            return progress.bestScore < WEAK_THRESHOLD
          })
          .sort((a, b) => {
            const progressA = progressMap.get(a.id)
            const progressB = progressMap.get(b.id)
            const scoreA = progressA?.bestScore ?? 0
            const scoreB = progressB?.bestScore ?? 0
            return scoreA - scoreB // worst score first
          })

        queue = weakArticles.map((a) => a.id)
      }
      break
    }

    default: {
      const sorted = [...articles].sort((a, b) => a.articleNumber - b.articleNumber)
      queue = sorted.map((a) => a.id)
    }
  }

  return {
    id: generateId(),
    mode,
    queue,
    currentIndex: 0,
    completed: [],
  }
}

// ─── nextArticle ──────────────────────────────────────────────────────────────

/**
 * Returns the next article ID in the playlist, or null if at the end.
 * Does NOT mutate the playlist — caller must update state.
 */
export function nextArticle(playlist: Playlist): string | null {
  const nextIndex = playlist.currentIndex + 1
  if (nextIndex >= playlist.queue.length) return null
  return playlist.queue[nextIndex]
}

// ─── prevArticle ──────────────────────────────────────────────────────────────

/**
 * Returns the previous article ID in the playlist, or null if at the start.
 */
export function prevArticle(playlist: Playlist): string | null {
  const prevIndex = playlist.currentIndex - 1
  if (prevIndex < 0) return null
  return playlist.queue[prevIndex]
}

// ─── markArticleDone ─────────────────────────────────────────────────────────

/**
 * Records an article as completed and advances currentIndex by one.
 * If the article is already in completed[], it is not duplicated.
 */
export function markArticleDone(playlist: Playlist, articleId: string): Playlist {
  const alreadyDone = playlist.completed.includes(articleId)
  const nextIndex = Math.min(playlist.currentIndex + 1, playlist.queue.length)

  return {
    ...playlist,
    currentIndex: nextIndex,
    completed: alreadyDone ? playlist.completed : [...playlist.completed, articleId],
  }
}

// ─── shufflePlaylist ──────────────────────────────────────────────────────────

/**
 * Re-shuffles the remaining (not yet completed) items in the queue,
 * keeping completed articles at the front and resetting currentIndex
 * to the first unfinished slot.
 */
export function shufflePlaylist(playlist: Playlist): Playlist {
  const completedSet = new Set(playlist.completed)
  const remaining = playlist.queue.filter((id) => !completedSet.has(id))
  const shuffled = shuffleArray(remaining)

  return {
    ...playlist,
    queue: [...playlist.completed, ...shuffled],
    currentIndex: playlist.completed.length,
  }
}
