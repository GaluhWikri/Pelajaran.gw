import { supabase } from './supabase'
import type { Note } from './types'

/**
 * Save note to Supabase database
 * This should be called whenever a note is created or updated
 */
export async function saveNoteToSupabase(note: Partial<Note> & { userId: string }) {
    try {
        console.log('Attempting to save note:', {
            id: note.id,
            userId: note.userId,
            title: note.title,
            tagsCount: note.tags?.length,
        })

        const { data, error } = await supabase
            .from('notes')
            .upsert({
                id: note.id,
                user_id: note.userId,
                title: note.title || 'Untitled',
                content: note.content || '',
                tags: note.tags || [],
                is_favorite: note.isFavorite || false,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            })
            throw error
        }

        console.log('Note saved successfully:', data)
        return { data, error: null }
    } catch (error: any) {
        console.error('Failed to save note:', {
            error,
            message: error?.message,
            details: error?.details,
        })
        return { data: null, error }
    }
}

/**
 * Delete note from Supabase database
 */
export async function deleteNoteFromSupabase(noteId: string) {
    try {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId)

        if (error) {
            console.error('Error deleting note from Supabase:', error)
            throw error
        }

        return { error: null }
    } catch (error) {
        console.error('Failed to delete note:', error)
        return { error }
    }
}

/**
 * Fetch all notes for a user from Supabase
 */
export async function fetchNotesFromSupabase(userId: string) {
    try {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching notes from Supabase:', error)
            throw error
        }

        return { data, error: null }
    } catch (error) {
        console.error('Failed to fetch notes:', error)
        return { data: null, error }
    }
}

/**
 * Save flashcard to Supabase database
 */
export async function saveFlashcardToSupabase(flashcard: any) {
    try {
        console.log('Saving flashcard:', flashcard.id)

        const { data, error } = await supabase
            .from('flashcards')
            .upsert({
                id: flashcard.id,
                note_id: flashcard.noteId,
                user_id: flashcard.userId,
                question: flashcard.question,
                answer: flashcard.answer,
                difficulty: flashcard.difficulty || 'medium',
                next_review: flashcard.nextReview ? new Date(flashcard.nextReview).toISOString() : null,
                review_count: flashcard.reviewCount || 0,
            })
            .select()
            .single()

        if (error) {
            console.error('Error saving flashcard:', error)
            throw error
        }

        console.log('Flashcard saved:', data?.id)
        return { data, error: null }
    } catch (error: any) {
        console.error('Failed to save flashcard:', error)
        return { data: null, error }
    }
}

/**
 * Save quiz to Supabase database
 */
export async function saveQuizToSupabase(quiz: any) {
    try {
        console.log('Saving quiz:', quiz.id)

        const { data, error } = await supabase
            .from('quizzes')
            .upsert({
                id: quiz.id,
                note_id: quiz.noteId,
                user_id: quiz.userId,
                title: quiz.title,
                questions: quiz.questions, // JSONB array
                score: quiz.score || null,
                completed_at: quiz.completedAt ? new Date(quiz.completedAt).toISOString() : null,
            })
            .select()
            .single()

        if (error) {
            console.error('Error saving quiz:', error)
            throw error
        }

        console.log('Quiz saved:', data?.id)
        return { data, error: null }
    } catch (error: any) {
        console.error('Failed to save quiz:', error)
        return { data: null, error }
    }
}

/**
 * Delete flashcard from Supabase database
 */
export async function deleteFlashcardFromSupabase(flashcardId: string) {
    try {
        const { error } = await supabase
            .from('flashcards')
            .delete()
            .eq('id', flashcardId)

        if (error) {
            console.error('Error deleting flashcard from Supabase:', error)
            throw error
        }

        return { error: null }
    } catch (error) {
        console.error('Failed to delete flashcard:', error)
        return { error }
    }
}

/**
 * Delete quiz from Supabase database
 */
export async function deleteQuizFromSupabase(quizId: string) {
    try {
        const { error } = await supabase
            .from('quizzes')
            .delete()
            .eq('id', quizId)

        if (error) {
            console.error('Error deleting quiz from Supabase:', error)
            throw error
        }

        return { error: null }
    } catch (error) {
        console.error('Failed to delete quiz:', error)
        return { error }
    }
}
