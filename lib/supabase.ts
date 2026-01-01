import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================================================
// TypeScript Interfaces for Database Tables
// ============================================================================

export interface UserProfile {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    is_premium: boolean
    created_at: string
    updated_at: string
}

export interface Note {
    id: string
    user_id: string
    title: string
    content: string
    is_favorite: boolean
    tags: string[]
    created_at: string
    updated_at: string
}

export interface Flashcard {
    id: string
    user_id: string
    note_id: string | null
    question: string
    answer: string
    difficulty: 'easy' | 'medium' | 'hard'
    last_reviewed: string | null
    next_review: string | null
    review_count: number
    created_at: string
    updated_at: string
}

export interface QuizQuestion {
    question: string
    options: string[]
    correctAnswer: number
}

export interface Quiz {
    id: string
    user_id: string
    note_id: string | null
    title: string
    questions: QuizQuestion[]
    score: number | null
    total_questions: number | null
    completed: boolean
    completed_at: string | null
    created_at: string
    updated_at: string
}

export interface Summary {
    id: string
    user_id: string
    note_id: string | null
    title: string
    original_content: string
    summary_content: string
    summary_type: 'short' | 'medium' | 'detailed'
    created_at: string
    updated_at: string
}

export interface ChatConversation {
    id: string
    user_id: string
    note_id: string | null
    title: string
    created_at: string
    updated_at: string
}

export interface ChatMessage {
    id: string
    conversation_id: string
    user_id: string
    role: 'user' | 'assistant'
    content: string
    created_at: string
}
