-- Lex Memoria — Supabase Schema
-- Run this in the Supabase SQL editor for your project.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Books ───────────────────────────────────────────────────────────────────
CREATE TABLE lex_books (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Articles ───────────────────────────────────────────────────────────────
CREATE TABLE lex_articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id         UUID REFERENCES lex_books(id) ON DELETE SET NULL,
  book            TEXT NOT NULL,          -- 'Book 1'
  chapter         TEXT NOT NULL,          -- 'Chapter 1 — Effect and Application of Laws'
  article_number  INT NOT NULL,
  title           TEXT NOT NULL,          -- 'Article 1'
  content_md      TEXT NOT NULL,          -- Full article text as markdown
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book, article_number)
);

-- ─── Word classifications (pre-computed at seed time) ────────────────────────
CREATE TABLE lex_word_classifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  UUID REFERENCES lex_articles(id) ON DELETE CASCADE,
  word        TEXT NOT NULL,
  word_type   TEXT CHECK (word_type IN ('LEGAL_NOUN','PROPER_NOUN','COMMON_WORD','FUNCTION_WORD')),
  word_index  INT NOT NULL,             -- position in article
  UNIQUE(article_id, word_index)
);

-- ─── Users (extends Supabase auth.users) ────────────────────────────────────
CREATE TABLE lex_profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name   TEXT,
  total_xp       INT DEFAULT 0,
  streak         INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_active_date DATE,
  hearts         INT DEFAULT 5,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Article progress (per user per article) ─────────────────────────────────
CREATE TABLE lex_article_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id      UUID REFERENCES lex_articles(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'not_started'
                    CHECK (status IN ('not_started','in_progress','mastered')),
  best_score      FLOAT DEFAULT 0,        -- 0–100
  attempt_count   INT DEFAULT 0,
  mastery_count   INT DEFAULT 0,          -- perfect runs; mastered at 3
  last_attempt_at TIMESTAMPTZ,
  bookmark_index  INT DEFAULT 0,          -- last word index (for resume)
  UNIQUE(user_id, article_id)
);

-- ─── Sessions (individual practice attempts) ─────────────────────────────────
CREATE TABLE lex_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id      UUID REFERENCES lex_articles(id) ON DELETE CASCADE,
  difficulty      INT CHECK (difficulty IN (1,2,3,4)),
  hints_enabled   BOOLEAN DEFAULT TRUE,
  transcript      TEXT,
  score           FLOAT,                  -- 0–100
  scores_json     JSONB,                  -- full ScoredWord[] array
  xp_earned       INT DEFAULT 0,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- ─── Weak spots (tracks frequently missed articles per user) ─────────────────
CREATE TABLE lex_weak_spots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id      UUID REFERENCES lex_articles(id) ON DELETE CASCADE,
  wrong_count     INT DEFAULT 1,
  last_wrong_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Schema Permissions ───────────────────────────────────────────────────────
-- PostgREST executes API calls as the anon/authenticated role.
-- Without USAGE on public schema, PostgREST returns 500 before RLS runs.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE lex_books              ENABLE ROW LEVEL SECURITY;
ALTER TABLE lex_articles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lex_word_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lex_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lex_article_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lex_sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lex_weak_spots         ENABLE ROW LEVEL SECURITY;

-- Books: read-only for everyone, insert/update/delete for authenticated users
CREATE POLICY "books_public_read" ON lex_books FOR SELECT USING (true);
CREATE POLICY "books_auth_insert" ON lex_books FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "books_auth_update" ON lex_books FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "books_auth_delete" ON lex_books FOR DELETE USING (auth.role() = 'authenticated');

-- Articles are public (read-only for everyone)
CREATE POLICY "articles_public_read" ON lex_articles FOR SELECT USING (true);
CREATE POLICY "articles_auth_insert" ON lex_articles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "articles_auth_update" ON lex_articles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "articles_auth_delete" ON lex_articles FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "word_classifications_public_read" ON lex_word_classifications FOR SELECT USING (true);
CREATE POLICY "word_classifications_auth_insert" ON lex_word_classifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users only see their own data
-- Note: FOR ALL covers SELECT/UPDATE/DELETE but NOT INSERT.
-- INSERT requires a separate WITH CHECK policy; without it new signups crash.
CREATE POLICY "own_profile"           ON lex_profiles         FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_profile_insert"    ON lex_profiles         FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own_progress"          ON lex_article_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_sessions"          ON lex_sessions         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_weak_spots"        ON lex_weak_spots        FOR ALL USING (auth.uid() = user_id);

-- Trigger: auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.lex_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
