-- ============================================================================
-- COMPLETE DATABASE SCHEMA FOR PELAJARAN.GW
-- ============================================================================
-- This schema includes all features: Notes, Flashcards, Quiz, Summary, Chatbot
-- Each user will have their own isolated data
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE (User Information)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- 2. NOTES TABLE (Main Notes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Note',
    content TEXT DEFAULT '',
    is_favorite BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Notes Policies
CREATE POLICY "Users can view own notes" ON public.notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON public.notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. FLASHCARDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    last_reviewed TIMESTAMP WITH TIME ZONE,
    next_review TIMESTAMP WITH TIME ZONE,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Flashcards Policies
CREATE POLICY "Users can view own flashcards" ON public.flashcards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards" ON public.flashcards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards" ON public.flashcards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards" ON public.flashcards
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 4. QUIZZES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]', -- Array of {question, options, correctAnswer}
    score INTEGER,
    total_questions INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Quizzes Policies
CREATE POLICY "Users can view own quizzes" ON public.quizzes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quizzes" ON public.quizzes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quizzes" ON public.quizzes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quizzes" ON public.quizzes
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 5. SUMMARIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    original_content TEXT NOT NULL,
    summary_content TEXT NOT NULL,
    summary_type TEXT CHECK (summary_type IN ('short', 'medium', 'detailed')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- Summaries Policies
CREATE POLICY "Users can view own summaries" ON public.summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries" ON public.summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summaries" ON public.summaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own summaries" ON public.summaries
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 6. CHAT_CONVERSATIONS TABLE (Chatbot Conversations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Chat Conversations Policies
CREATE POLICY "Users can view own conversations" ON public.chat_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.chat_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.chat_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 7. CHAT_MESSAGES TABLE (Individual Chat Messages)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat Messages Policies
CREATE POLICY "Users can view own messages" ON public.chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON public.chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 8. TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON public.flashcards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_summaries_updated_at BEFORE UPDATE ON public.summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. FUNCTION TO AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 10. INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_is_favorite ON public.notes(is_favorite);

-- Flashcards indexes
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_note_id ON public.flashcards(note_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON public.flashcards(next_review);

-- Quizzes indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_note_id ON public.quizzes(note_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_completed ON public.quizzes(completed);

-- Summaries indexes
CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON public.summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_summaries_note_id ON public.summaries(note_id);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- All tables created with Row Level Security enabled
-- Each user can only access their own data
-- Automatic profile creation on signup
-- Automatic timestamp updates
-- ============================================================================
