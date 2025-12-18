import { Note, Quiz, Flashcard } from "./types"
import { AI_SYSTEM_PROMPT } from "./ai-prompt"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini
// Note: In a real production app, you should proxy these requests through a backend
// to avoid exposing your API KEY. For this demo/personal usage, we use NEXT_PUBLIC.
const apiKey = (process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim()
const genAI = new GoogleGenerativeAI(apiKey)

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
    },
})

const chatModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
    },
})

/**
 * Helper to retry Gemini requests on 503 Overloaded errors
 */
async function retryGenAI<T>(
    operation: () => Promise<T>,
    retries = 3,
    delay = 2000
): Promise<T> {
    try {
        return await operation()
    } catch (error: any) {
        if (retries > 0 && (error.message?.includes("503") || error.message?.includes("overloaded"))) {
            console.log(`Gemini 503 overloaded. Retrying in ${delay / 1000}s... (${retries} retries left)`)
            await new Promise((resolve) => setTimeout(resolve, delay))
            return retryGenAI(operation, retries - 1, delay * 2)
        }
        throw error
    }
}

/**
 * Helper to convert a File object to a GenerativePart (base64)
 */
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            // reader.result is like "data:image/png;base64,....."
            const result = reader.result as string
            // Split to get the base64 part
            const base64String = result.split(",")[1]

            resolve({
                inlineData: {
                    data: base64String,
                    mimeType: file.type,
                },
            })
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}


export interface GenerationOptions {
    subject: string
    understandingLevel: number // 1-100
    writingStyle: string
}

export async function generateLearningContent(file: File, options?: GenerationOptions): Promise<{
    summary: string
    quiz: Omit<Quiz, "id" | "createdAt">
    flashcards: Omit<Flashcard, "id" | "createdAt">[]
}> {
    if (!apiKey) {
        console.warn("Gemini API Key is missing. Returning mock data.")
        return mockGenerateLearningContent(file)
    }

    try {
        const filePart = await fileToGenerativePart(file)

        let promptContext = ""
        if (options) {
            promptContext = `
      Konteks Tambahan dari Pengguna:
      - Mata Pelajaran/Topik: ${options.subject || "Umum"}
      - Tingkat Pemahaman: ${options.understandingLevel}% (0 = Pemula, 100 = Ahli)
      - Gaya Penulisan: ${options.writingStyle || "Standar"}
      
      Sesuaikan penjelasan, kesulitan kuis, dan bahasa ringkasan agar sesuai dengan preferensi di atas.
      `
        }

        const prompt = `
    ${AI_SYSTEM_PROMPT}

    ${promptContext}

    Tugas Khusus:
    Analisis materi yang diberikan dan hasilkan output dalam format JSON yang valid.

    PENTING UNTUK RINGKASAN (summary):
    - Gunakan format Markdown yang kaya dan terstruktur.
    - Judul Utama (# Judul)
    - Gunakan Headings (##, ###) untuk memisahkan bagian.
    - Sertakan bagian "Inti Konsep" berupa poin-poin (bullet points) ringkas.
    - Sertakan bagian "Penjelasan" yang mendetail.
    - Gunakan **Bold** untuk istilah penting.
    - Gunakan *Italic* untuk penekanan.
    - Gunakan Numbered Lists (1., 2.) untuk langkah-langkah atau urutan.
    - Buat tampilannya profesional seperti buku pelajaran premium.

    Struktur JSON harus mengikuti format ini secara ketat:
    {
      "summary": "String markdown ringkasan materi lengkap sesuai instruksi format di atas",
      "quiz": {
        "title": "Judul Kuis",
        "questions": [
          {
            "id": "q1",
            "question": "Pertanyaan",
            "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
            "correctAnswer": 0,
            "explanation": "Penjelasan jawaban"
          }
        ]
      },
      "flashcards": [
        {
          "question": "Pertanyaan Flashcard",
          "answer": "Jawaban Flashcard"
        }
      ]
    }
    `

        // Wrap request in retry logic
        const result = await retryGenAI(() => model.generateContent([prompt, filePart]))
        const responseText = result.response.text()

        // Ensure we parse JSON correctly
        let data;
        try {
            data = JSON.parse(responseText)
        } catch (e) {
            console.error("Failed to parse JSON directly, attempting cleanup", e)
            // Basic cleanup if markdown backticks are included despite mimeType enforcement
            const jsonStr = responseText.replace(/```json/g, "").replace(/```/g, "")
            data = JSON.parse(jsonStr)
        }

        return {
            summary: data.summary,
            quiz: {
                noteId: "", // Filled by caller
                userId: "", // Filled by caller
                ...data.quiz,
            },
            flashcards: data.flashcards.map((f: any) => ({
                noteId: "",
                userId: "",
                ...f,
                reviewCount: 0,
            })),
        }
    } catch (error) {
        console.error("Error generating content with Gemini:", error)
        return mockGenerateLearningContent(file, error instanceof Error ? error.message : String(error))
    }
}

export async function generateChatResponse(message: string, context: Note): Promise<string> {
    if (!apiKey) {
        return mockGenerateChatResponse(message, context)
    }

    try {
        const chat = chatModel.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: `Context Materi (Notes):\n${context.content}\n\n${AI_SYSTEM_PROMPT}` }],
                },
                {
                    role: "model",
                    parts: [{ text: "Mengerti. Saya siap membantu menjawab pertanyaan berdasarkan materi tersebut dengan persona sebagai asisten pembelajaran." }],
                },
            ],
        })

        const result = await chat.sendMessage(message)
        return result.response.text()
    } catch (error) {
        console.error("Error generating chat response:", error)
        return "Maaf, terjadi kesalahan saat memproses pertanyaan Anda."
    }
}

// Fallback Mock Functions
async function mockGenerateLearningContent(file: File, errorMessage?: string) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const fileName = file.name.replace(/\.[^/.]+$/, "")

    let summaryText = `# ${fileName} (Error Fallback)\n\nTerjadi kesalahan saat menghubungi Google Gemini API.\n\nDetail Error: ${errorMessage || "Unknown Error"}`

    if (!errorMessage && !apiKey) {
        summaryText = `# ${fileName} (MOCK mode - No API Key)\n\nHarap masukkan API Key di .env file dengan nama NEXT_PUBLIC_GEMINI_API_KEY.\n\n## Ringkasan\nIni adalah ringkasan placeholder karena Gemini API Key belum dikonfigurasi.`
    }

    return {
        summary: summaryText,
        quiz: {
            noteId: "",
            userId: "",
            title: "Mock Quiz (Error Mode)",
            questions: [
                {
                    id: "q1",
                    question: "Apa status API Key Anda?",
                    options: ["Aktif", "Tidak Aktif", "Error", "Tidak Tahu"],
                    correctAnswer: 2,
                    explanation: "Terjadi error saat request ke AI.",
                },
            ],
        },
        flashcards: [
            {
                question: "Setup",
                answer: "Add NEXT_PUBLIC_GEMINI_API_KEY to .env",
                reviewCount: 0,
                userId: "",
                noteId: "",
            },
        ],
    }
}

async function mockGenerateChatResponse(message: string, context: Note) {
    return "Mode Mock: Harap tambahkan NEXT_PUBLIC_GEMINI_API_KEY untuk fitur chat aktif. Saya belum bisa menjawab pertanyaan '" + message + "' tanpa API key."
}
