import { AttemptScore, Article } from '@/types'

interface SessionState {
  articleId: string
  startTime: number
  attempts: AttemptScore[]
  currentAttempt: AttemptScore | null
  hintsEnabled: boolean
}

class SessionManager {
  private session: SessionState | null = null
  private sessionStorageKey = 'lex_memoria_session'

  /**
   * Start a new session for an article
   */
  startSession(article: Article, hintsEnabled: boolean = true): SessionState {
    this.session = {
      articleId: article.id,
      startTime: Date.now(),
      attempts: [],
      currentAttempt: null,
      hintsEnabled,
    }
    this.persistSession()
    return this.session
  }

  /**
   * Resume session from localStorage if exists
   */
  resumeSession(): SessionState | null {
    if (typeof window === 'undefined') return null

    const stored = localStorage.getItem(this.sessionStorageKey)
    if (stored) {
      try {
        this.session = JSON.parse(stored)
        return this.session
      } catch {
        return null
      }
    }
    return null
  }

  /**
   * Record an attempt score in the current session
   */
  recordAttempt(score: AttemptScore): void {
    if (!this.session) throw new Error('No active session')

    this.session.attempts.push(score)
    this.session.currentAttempt = score
    this.persistSession()
  }

  /**
   * Get best score from all attempts in session
   */
  getBestScore(): number {
    if (!this.session || this.session.attempts.length === 0) return 0
    return Math.max(...this.session.attempts.map((a) => a.percentCorrect))
  }

  /**
   * Check if article is mastered (3 perfect runs)
   */
  isMastered(): boolean {
    if (!this.session) return false
    const perfectRuns = this.session.attempts.filter((a) => a.percentCorrect === 100)
    return perfectRuns.length >= 3
  }

  /**
   * End session and persist to database
   * In real app, POST to /api/session with data
   */
  async endSession(): Promise<void> {
    if (!this.session) return

    const bestScore = this.getBestScore()
    const isMastered = this.isMastered()
    const duration = Date.now() - this.session.startTime

    // TODO: POST to API
    console.log('Session ended:', {
      articleId: this.session.articleId,
      bestScore,
      isMastered,
      duration,
      attempts: this.session.attempts.length,
    })

    this.clearSession()
  }

  /**
   * Get current session state
   */
  getSession(): SessionState | null {
    return this.session
  }

  /**
   * Toggle hints on/off and persist
   */
  toggleHints(): boolean {
    if (!this.session) throw new Error('No active session')
    this.session.hintsEnabled = !this.session.hintsEnabled
    this.persistSession()
    return this.session.hintsEnabled
  }

  /**
   * Clear session from memory and storage
   */
  private clearSession(): void {
    this.session = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.sessionStorageKey)
    }
  }

  /**
   * Persist session to localStorage
   */
  private persistSession(): void {
    if (!this.session || typeof window === 'undefined') return
    localStorage.setItem(this.sessionStorageKey, JSON.stringify(this.session))
  }
}

// Singleton instance
export const sessionManager = new SessionManager()
