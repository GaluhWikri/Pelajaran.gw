-- =============================================
-- PODCAST PERSISTENCE MIGRATION
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create podcasts table
CREATE TABLE IF NOT EXISTS podcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    dialogues JSONB NOT NULL,
    audio_url TEXT,
    duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for faster lookup by note
CREATE INDEX IF NOT EXISTS idx_podcasts_note_id ON podcasts(note_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_user_id ON podcasts(user_id);

-- 3. Enable Row Level Security
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies - Users can only access their own podcasts
CREATE POLICY "Users can read own podcasts"
ON podcasts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own podcasts"
ON podcasts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own podcasts"
ON podcasts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own podcasts"
ON podcasts FOR DELETE
USING (auth.uid() = user_id);

-- 5. Create storage bucket for podcast audio files
-- NOTE: You may need to run this separately or create via Dashboard
INSERT INTO storage.buckets (id, name, public) 
VALUES ('podcasts', 'podcasts', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage policies for podcast files
CREATE POLICY "Users can upload podcast audio"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'podcasts' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read podcast audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'podcasts');

CREATE POLICY "Users can delete own podcast audio"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'podcasts' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);
