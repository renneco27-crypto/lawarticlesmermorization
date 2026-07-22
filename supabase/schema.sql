-- Lex Memoria — Supabase Schema
-- Run this in the Supabase SQL editor for your project.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Articles ───────────────────────────────────────────────────────────────
CREATE TABLE articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book            TEXT NOT NULL,          -- 'Book 1'
  chapter         TEXT NOT NULL,          -- 'Chapter 1 — Effect and Application of Laws'
  article_number  INT NOT NULL,
  title           TEXT NOT NULL,          -- 'Article 1'
  content_md      TEXT NOT NULL,          -- Full article text as markdown
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book, article_number)
);

-- ─── Word classifications (pre-computed at seed time) ────────────────────────
CREATE TABLE word_classifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  UUID REFERENCES articles(id) ON DELETE CASCADE,
  word        TEXT NOT NULL,
  word_type   TEXT CHECK (word_type IN ('LEGAL_NOUN','PROPER_NOUN','COMMON_WORD','FUNCTION_WORD')),
  word_index  INT NOT NULL,             -- position in article
  UNIQUE(article_id, word_index)
);

-- ─── Users (extends Supabase auth.users) ────────────────────────────────────
CREATE TABLE profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name   TEXT,
  total_xp       INT DEFAULT 0,
  streak         INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_active_date DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Article progress (per user per article) ─────────────────────────────────
CREATE TABLE article_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id      UUID REFERENCES articles(id) ON DELETE CASCADE,
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
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id      UUID REFERENCES articles(id) ON DELETE CASCADE,
  difficulty      INT CHECK (difficulty IN (1,2,3,4)),
  hints_enabled   BOOLEAN DEFAULT TRUE,
  transcript      TEXT,
  score           FLOAT,                  -- 0–100
  scores_json     JSONB,                  -- full ScoredWord[] array
  xp_earned       INT DEFAULT 0,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions         ENABLE ROW LEVEL SECURITY;

-- Articles are public (read-only for everyone)
CREATE POLICY "articles_public_read" ON articles FOR SELECT USING (true);
CREATE POLICY "word_classifications_public_read" ON word_classifications FOR SELECT USING (true);

-- Users only see their own data
CREATE POLICY "own_profile"   ON profiles         FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_progress"  ON article_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_sessions"  ON sessions         FOR ALL USING (auth.uid() = user_id);

-- Trigger: auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
