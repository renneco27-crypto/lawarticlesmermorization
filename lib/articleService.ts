import { createClient } from '@supabase/supabase-js'
import type { Article } from '@/types'
import { getCached, setCached, CACHE_KEYS, TTL } from './cacheManager'
import { tokenizeArticle } from './wordClassifier'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase environment variables')
  return createClient(url, key)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToArticle(row: any): Article {
  return {
    id: row.id,
    book: row.book || '',
    bookId: row.book_id || '',
    bookName: row.lex_books?.name || row.book || '',
    chapter: row.chapter || '',
    articleNumber: row.article_number,
    title: row.title,
    contentMd: row.content_md,
    tokens: tokenizeArticle(row.content_md),
  }
}

export async function fetchArticle(id: string): Promise<Article> {
  const cacheKey = CACHE_KEYS.ARTICLE(id)
  const cached = getCached<Article>(cacheKey)
  if (cached) return cached

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('lex_articles')
    .select('*, lex_books(name)')
    .eq('id', id)
    .single()

  if (error || !data) throw new Error(`Failed to fetch article ${id}: ${error?.message}`)

  const article = rowToArticle(data)
  setCached(cacheKey, article, TTL.ARTICLES)
  return article
}

export async function fetchAllArticles(bookId?: string): Promise<Article[]> {
  const cacheKey = bookId ? CACHE_KEYS.BOOK(bookId) : CACHE_KEYS.ALL_ARTICLES
  const cached = getCached<Article[]>(cacheKey)
  if (cached) return cached

  const supabase = getSupabase()
  let query = supabase
    .from('lex_articles')
    .select('*, lex_books(name)')
    .order('article_number', { ascending: true })

  if (bookId) query = query.eq('book_id', bookId)

  const { data, error } = await query

  if (error || !data) throw new Error(`Failed to fetch articles: ${error?.message}`)

  const articles = data.map(rowToArticle)
  setCached(cacheKey, articles, TTL.ARTICLES)
  return articles
}

export async function fetchArticlesByBook(book: string): Promise<Article[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('lex_articles')
    .select('*, lex_books(name)')
    .eq('book', book)
    .order('article_number', { ascending: true })

  if (error || !data) throw new Error(`Failed to fetch articles for book "${book}": ${error?.message}`)

  return data.map(rowToArticle)
}

export async function fetchArticlesByChapter(book: string, chapter: string): Promise<Article[]> {
  const bookArticles = await fetchArticlesByBook(book)
  return bookArticles.filter(a => a.chapter === chapter)
}
