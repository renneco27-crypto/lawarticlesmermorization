import { createClient } from '@supabase/supabase-js'
import type { Article } from '@/types'
import { getCached, setCached, CACHE_KEYS, TTL } from './cacheManager'
import { tokenizeArticle } from './wordClassifier'

// ─── Supabase Client ──────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(url, key)
}

// ─── Row → Article Mapper ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToArticle(row: any): Article {
  return {
    id: row.id,
    book: row.book,
    chapter: row.chapter,
    articleNumber: row.article_number,
    title: row.title,
    contentMd: row.content_md,
    tokens: tokenizeArticle(row.content_md),
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchArticle(id: string): Promise<Article> {
  const cacheKey = CACHE_KEYS.ARTICLE(id)
  const cached = getCached<Article>(cacheKey)
  if (cached) return cached

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('lex_articles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    throw new Error(`Failed to fetch article ${id}: ${error?.message}`)
  }

  const article = rowToArticle(data)
  setCached(cacheKey, article, TTL.ARTICLES)
  return article
}

export async function fetchAllArticles(): Promise<Article[]> {
  const cacheKey = CACHE_KEYS.ALL_ARTICLES
  const cached = getCached<Article[]>(cacheKey)
  if (cached) return cached

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('lex_articles')
    .select('*')
    .order('article_number', { ascending: true })

  if (error || !data) {
    throw new Error(`Failed to fetch all articles: ${error?.message}`)
  }

  const articles = data.map(rowToArticle)
  setCached(cacheKey, articles, TTL.ARTICLES)
  return articles
}

export async function fetchArticlesByBook(book: string): Promise<Article[]> {
  const cacheKey = CACHE_KEYS.BOOK(book)
  const cached = getCached<Article[]>(cacheKey)
  if (cached) return cached

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('lex_articles')
    .select('*')
    .eq('book', book)
    .order('article_number', { ascending: true })

  if (error || !data) {
    throw new Error(`Failed to fetch articles for book "${book}": ${error?.message}`)
  }

  const articles = data.map(rowToArticle)
  setCached(cacheKey, articles, TTL.ARTICLES)
  return articles
}

export async function fetchArticlesByChapter(
  book: string,
  chapter: string
): Promise<Article[]> {
  // No dedicated cache key for chapter — filter from book cache
  const bookArticles = await fetchArticlesByBook(book)
  return bookArticles.filter(a => a.chapter === chapter)
}
