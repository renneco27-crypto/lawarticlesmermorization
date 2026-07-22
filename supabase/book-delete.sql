-- Lex Memoria — Delete an Entire Book and All Its Articles
-- Run in Supabase SQL Editor.

-- 1. Delete all articles under this book (required before deleting the book row)
DELETE FROM lex_articles
WHERE book_id = 'REPLACE_WITH_BOOK_UUID';

-- 2. Delete the book itself
DELETE FROM lex_books
WHERE id = 'REPLACE_WITH_BOOK_UUID';

-- ℹ To find the book UUID, query:
--   SELECT id, name, created_at FROM lex_books ORDER BY name;

-- ℹ This only removes the book and its articles. User progress,
--   sessions, and weak spots tied to those articles remain orphaned.
--   To remove them too, add before step 1:
--     DELETE FROM lex_sessions         WHERE article_id IN (SELECT id FROM lex_articles WHERE book_id = '...');
--     DELETE FROM lex_article_progress WHERE article_id IN (SELECT id FROM lex_articles WHERE book_id = '...');
--     DELETE FROM lex_weak_spots       WHERE article_id IN (SELECT id FROM lex_articles WHERE book_id = '...');
--     DELETE FROM lex_word_classifications WHERE article_id IN (SELECT id FROM lex_articles WHERE book_id = '...');
