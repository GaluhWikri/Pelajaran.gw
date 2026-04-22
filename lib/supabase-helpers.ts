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
                material_id: note.materialId || null,
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
        // Pre-fetch `material_id` to delete the material too
        const { data: note } = await supabase
            .from('notes')
            .select('material_id')
            .eq('id', noteId)
            .single()

        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId)

        if (error) {
            console.error('Error deleting note from Supabase:', error)
            throw error
        }

        // Delete associated material
        if (note?.material_id) {
            // First we need the file URL to extract the path.
            const { data: material } = await supabase
                .from('materials')
                .select('file_url')
                .eq('id', note.material_id)
                .single()
            
            // Delete from database
            await supabase.from('materials').delete().eq('id', note.material_id)

            // Delete from storage if it is a Supabase Storage URL
            if (material?.file_url && material.file_url.includes('/storage/v1/object/public/materials/')) {
                try {
                    const url = new URL(material.file_url)
                    const pathParts = url.pathname.split('/public/materials/')
                    if (pathParts.length > 1) {
                        const filePath = decodeURIComponent(pathParts[1])
                        if (filePath) {
                            await supabase.storage.from('materials').remove([filePath])
                            console.log('Deleted material file from storage:', filePath)
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse or delete material file from storage', e);
                }
            }
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

/**
 * Save mindmap to Supabase database
 */
export async function saveMindmapToSupabase(mindmap: {
    id: string
    noteId: string
    userId: string
    nodes: any[]
}) {
    try {
        console.log('Saving mindmap for note:', mindmap.noteId)

        const { data, error } = await supabase
            .from('mindmaps')
            .upsert({
                id: mindmap.id,
                note_id: mindmap.noteId,
                user_id: mindmap.userId,
                nodes: mindmap.nodes,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (error) {
            console.error('Error saving mindmap:', error)
            throw error
        }

        console.log('Mindmap saved:', data?.id)
        return { data, error: null }
    } catch (error: any) {
        console.error('Failed to save mindmap:', error)
        return { data: null, error }
    }
}

/**
 * Get mindmap by note ID from Supabase
 */
export async function getMindmapByNoteIdFromSupabase(noteId: string) {
    try {
        const { data, error } = await supabase
            .from('mindmaps')
            .select('*')
            .eq('note_id', noteId)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Error fetching mindmap:', error)
            throw error
        }

        return { data, error: null }
    } catch (error) {
        console.error('Failed to fetch mindmap:', error)
        return { data: null, error }
    }
}

/**
 * Delete mindmap from Supabase database
 */
export async function deleteMindmapFromSupabase(mindmapId: string) {
    try {
        const { error } = await supabase
            .from('mindmaps')
            .delete()
            .eq('id', mindmapId)

        if (error) {
            console.error('Error deleting mindmap from Supabase:', error)
            throw error
        }

        return { error: null }
    } catch (error) {
        console.error('Failed to delete mindmap:', error)
        return { error }
    }
}

// ============================================================================
// PODCAST FUNCTIONS
// ============================================================================

/**
 * Save podcast metadata to Supabase database
 */
export async function savePodcastToSupabase(podcast: {
    id: string
    noteId: string
    userId: string
    title: string
    dialogues: { speaker: string; text: string }[]
    audioUrl?: string
    duration?: number
}) {
    try {
        console.log('Saving podcast for note:', podcast.noteId)

        const { data, error } = await supabase
            .from('podcasts')
            .upsert({
                id: podcast.id,
                note_id: podcast.noteId,
                user_id: podcast.userId,
                title: podcast.title,
                dialogues: podcast.dialogues,
                audio_url: podcast.audioUrl || null,
                duration: podcast.duration || null,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (error) {
            console.error('Error saving podcast:', error)
            throw error
        }

        console.log('Podcast saved:', data?.id)
        return { data, error: null }
    } catch (error: any) {
        console.error('Failed to save podcast:', error)
        return { data: null, error }
    }
}

/**
 * Get podcast by note ID from Supabase
 */
export async function getPodcastByNoteIdFromSupabase(noteId: string) {
    try {
        const { data, error } = await supabase
            .from('podcasts')
            .select('*')
            .eq('note_id', noteId)
            .maybeSingle()

        if (error) {
            console.error('Error fetching podcast:', error)
            return { data: null, error: error }
        }

        return { data, error: null }
    } catch (error: any) {
        console.error('Failed to fetch podcast:', error)
        return { data: null, error: error }
    }
}

/**
 * Upload podcast audio to Supabase Storage
 * Returns the public URL of the uploaded file
 */
export async function uploadPodcastAudio(
    userId: string,
    noteId: string,
    audioBlob: Blob
): Promise<{ url: string | null; error: any }> {
    try {
        const fileName = `${userId}/${noteId}.wav`

        console.log('Uploading podcast audio:', fileName)

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from('podcasts')
            .upload(fileName, audioBlob, {
                contentType: 'audio/wav',
                upsert: true,
            })

        if (uploadError) {
            console.error('Error uploading podcast audio:', uploadError)
            throw uploadError
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('podcasts')
            .getPublicUrl(fileName)

        console.log('Podcast audio uploaded:', urlData.publicUrl)
        return { url: urlData.publicUrl, error: null }
    } catch (error: any) {
        console.error('Failed to upload podcast audio:', error)
        return { url: null, error }
    }
}

/**
 * Delete podcast from Supabase database and storage
 */
export async function deletePodcastFromSupabase(podcastId: string, userId: string, noteId: string) {
    try {
        // Delete audio from storage
        const fileName = `${userId}/${noteId}.wav`
        await supabase.storage
            .from('podcasts')
            .remove([fileName])

        // Delete from database
        const { error } = await supabase
            .from('podcasts')
            .delete()
            .eq('id', podcastId)

        if (error) {
            console.error('Error deleting podcast from Supabase:', error)
            throw error
        }

        return { error: null }
    } catch (error) {
        console.error('Failed to delete podcast:', error)
        return { error }
    }
}

// ============================================================================
// MATERIALS FUNCTIONS
// ============================================================================

/**
 * Upload material file (PDF, Video, Audio) to Supabase Storage
 * Returns the public URL of the uploaded file
 */
export async function uploadMaterialToStorage(
    userId: string,
    file: File
): Promise<{ url: string | null; error: any }> {
    try {
        // Create unique filename to prevent overwrites
        const fileExt = file.name.split('.').pop()
        const uniqueId = crypto.randomUUID()
        const fileName = `${userId}/${uniqueId}.${fileExt}`

        console.log('Uploading material to storage:', fileName)

        // Upload to storage bucket
        const { error: uploadError } = await supabase.storage
            .from('materials')
            .upload(fileName, file, {
                upsert: false,
            })

        if (uploadError) {
            console.error('Error uploading material:', uploadError)
            throw uploadError
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('materials')
            .getPublicUrl(fileName)

        console.log('Material uploaded successfully:', urlData.publicUrl)
        return { url: urlData.publicUrl, error: null }
    } catch (error: any) {
        console.error('Failed to upload material:', error)
        return { url: null, error }
    }
}

/**
 * Save material metadata to Supabase database
 */
export async function saveMaterialToSupabase(material: {
    id: string
    userId: string
    title: string
    type: string
    fileUrl: string
    fileName: string
    fileSize: number
}) {
    try {
        console.log('Saving material metadata:', material.id)

        const { data, error } = await supabase
            .from('materials')
            .upsert({
                id: material.id,
                user_id: material.userId,
                title: material.title,
                type: material.type,
                file_url: material.fileUrl,
                file_name: material.fileName,
                file_size: material.fileSize,
            })
            .select()
            .single()

        if (error) {
            console.error('Error saving material:', error)
            throw error
        }

        console.log('Material saved successfully:', data?.id)
        return { data, error: null }
    } catch (error: any) {
        console.error('Failed to save material:', error)
        return { data: null, error }
    }
}

