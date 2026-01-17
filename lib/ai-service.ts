import { Note, Quiz, Flashcard, MindmapNode } from "./types"
import { AI_SYSTEM_PROMPT, MINDMAP_SYSTEM_PROMPT } from "./ai-prompt"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { extractTextFromPPTX } from "./ppt-parser"

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

// Separate model for mindmap generation - lower temperature for consistent structure
const mindmapModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
        temperature: 0.5, // Lower for more consistent JSON structure
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 8192, // Increased to accommodate detailed prompt output
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
    retries = 5,
    delay = 3000
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
    understandingLevel: string
    writingStyle: string
}

export async function generateLearningContent(file: File, options?: GenerationOptions): Promise<{
    title?: string
    summary: string
    quiz: Omit<Quiz, "id" | "createdAt">
    flashcards: Omit<Flashcard, "id" | "createdAt">[]
}> {
    if (!apiKey) {
        console.warn("Gemini API Key is missing. Returning mock data.")
        return mockGenerateLearningContent(file)
    }

    try {
        // Handle PPTX files specifically
        if (file.name.toLowerCase().endsWith(".pptx")) {
            console.log("Detected PPTX file, extracting text...")
            try {
                const pptText = await extractTextFromPPTX(file)
                if (pptText.length > 15) {
                    console.log("PPTX text extracted successfully, using text generation pipeline. Length:", pptText.length)
                    // Delegate to text-based generation

                    // Add specific handling for very short content
                    const isShortContent = pptText.length < 500;
                    if (isShortContent) {
                        console.log("Short content detected, adjusting options...");
                    }

                    const result = await generateLearningContentFromText(pptText, options)
                    return result
                }

                // If text is too short, it's likely image-based or empty
                console.warn("PPTX text extraction failed or empty (<15 chars). Likely image-based.");
                throw new Error("PPT ini sepertinya hanya berisi gambar atau kosong. Sistem belum mendukung OCR untuk slide gambar.");
            } catch (pptError: any) {
                console.error("Failed to parse PPTX:", pptError)
                // Rethrow if it's our custom error message
                if (pptError.message?.includes("hanya berisi gambar")) {
                    throw pptError;
                }
                // Otherwise fall through to default handling
            }
        }

        const filePart = await fileToGenerativePart(file)
        const promptContext = buildPromptContext(options)

        const prompt = `
    ${AI_SYSTEM_PROMPT}

    Tugas: Analisis materi yang diberikan (File/Gambar) dan buat output JSON.

    ${promptContext}

    INSTRUKSI KONTEN:
    1. RINGKASAN (Summary): Tulis rangkuman materi di field 'summary'. Sesuaikan kedalaman dan gaya bahasa dengan 'KONTEKS PENGGUNA' di atas.
       - Gunakan format Markdown LLENGKAP & KAYA (Rich Markdown) JIKA DIPERLUKAN/RELEVAN:
         * TABEL: WAJIB gunakan tabel untuk perbandingan, data terstruktur, atau list kategori.
         * CODE BLOCK: Gunakan untuk kode program, command line, atau rumus matematika kompleks.
         * BLOCKQUOTE (>): Gunakan untuk definisi penting, rumus singkat, atau kesimpulan utama.
         * BOLD & ITALIC: Gunakan untuk menekankan kata kunci penting.
         * LIST: Gunakan bullet points atau numbering untuk langkah-langkah atau poin materi.
       - Gunakan Header (#, ##, ###) untuk struktur yang rapi.
       - JANGAN pakai pembuka/penutup basa-basi.
    2. KUIS (Quiz): Wajib buat 10 soal pilihan ganda yang relevan.
    3. FLASHCARDS: Wajib buat minimal 5 flashcards.

    FORMAT OUTPUT (Wajib JSON Valid, tanpa teks lain):
    {
      "title": "Judul Materi (Max 5-7 kata)",
      "summary": "String markdown ringkasan...",
      "quiz": {
        "title": "Judul Kuis",
        "questions": [
          { "id": "q1", "question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "..." }
        ]
      },
      "flashcards": [
        { "question": "...", "answer": "..." }
      ]
    }
    `

        // Wrap request in retry logic
        const result = await retryGenAI(() => model.generateContent([prompt, filePart]))
        const responseText = result.response.text()

        return parseGeminiResponse(responseText)

    } catch (error: any) {
        console.error("Error generating content with Gemini:", error)
        // Rethrow the error so the UI sees it as a failure
        throw error
    }
}

export async function generateLearningContentFromText(text: string, options?: GenerationOptions): Promise<{
    title?: string
    summary: string
    quiz: Omit<Quiz, "id" | "createdAt">
    flashcards: Omit<Flashcard, "id" | "createdAt">[]
}> {
    if (!apiKey) {
        console.warn("Gemini API Key is missing. Returning mock data.")
        // Reuse mock function but wrap text in a dummy file object representation
        return mockGenerateLearningContent({ name: "YouTube Video.txt" } as File)
    }

    try {
        const promptContext = buildPromptContext(options)

        const prompt = `
    ${AI_SYSTEM_PROMPT}

    Tugas: Analisis TEKS/MATERI berikut (bisa berupa Transkrip Video atau Teks Slide Presentasi) dan buat output JSON.

    MATERI:
    "${text.substring(0, 50000)}..."

    ${promptContext}

    INSTRUKSI KONTEN:
    1. RINGKASAN (Summary): Tulis rangkuman materi di field 'summary'. Sesuaikan kedalaman dan gaya bahasa dengan 'KONTEKS PENGGUNA' di atas.
       - Gunakan format Markdown LLENGKAP & KAYA (Rich Markdown) JIKA DIPERLUKAN/RELEVAN:
         * TABEL: WAJIB gunakan tabel untuk perbandingan, data terstruktur, atau list kategori.
         * CODE BLOCK: Gunakan untuk kode program, command line, atau rumus matematika kompleks.
         * BLOCKQUOTE (>): Gunakan untuk definisi penting, rumus singkat, atau kesimpulan utama.
         * BOLD & ITALIC: Gunakan untuk menekankan kata kunci penting.
         * LIST: Gunakan bullet points atau numbering untuk langkah-langkah atau poin materi.
       - Gunakan Header (#, ##, ###) untuk struktur yang rapi.
       - JANGAN pakai pembuka/penutup basa-basi.
    2. KUIS (Quiz): WAJIB ADA. Buat 10 soal pilihan ganda yang relevan. Jika materi SEDIKIT, buatlah minimal 5 soal.
    3. FLASHCARDS: WAJIB ADA. Buat minimal 5 flashcards. Jika materi sedikit, sesuaikan dengan definisi yang ada.

    PENTING:
    - Kuis dan Flashcards TIDAK BOLEH KOSONG.
    - Jika materi sangat singkat, fokus buat pertanyaan dari informasi kunci yang tersedua.

    FORMAT OUTPUT (Wajib JSON Valid, tanpa teks lain):
    {
      "title": "Judul Materi (Max 5-7 kata)",
      "summary": "String markdown ringkasan...",
      "quiz": {
        "title": "Judul Kuis",
        "questions": [
          { "id": "q1", "question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "..." }
        ]
      },
      "flashcards": [
        { "question": "...", "answer": "..." }
      ]
    }
    `

        // Send text directly vs filePart
        const result = await retryGenAI(() => model.generateContent(prompt))
        const responseText = result.response.text()

        return parseGeminiResponse(responseText)

    } catch (error: any) {
        console.error("Error generating content from text with Gemini:", error)
        throw error
    }
}

/**
 * Generate learning content directly from a YouTube URL.
 * Gemini will analyze the video content (audio, visuals, transcript if available).
 */
export async function generateLearningContentFromYouTube(youtubeUrl: string, options?: GenerationOptions): Promise<{
    title?: string
    summary: string
    quiz: Omit<Quiz, "id" | "createdAt">
    flashcards: Omit<Flashcard, "id" | "createdAt">[]
}> {
    if (!apiKey) {
        console.warn("Gemini API Key is missing. Returning mock data.")
        return mockGenerateLearningContent({ name: "YouTube Video.txt" } as File)
    }

    try {
        const promptContext = buildPromptContext(options)

        const prompt = `
    ${AI_SYSTEM_PROMPT}

    Tugas: Analisis VIDEO YOUTUBE berikut dan buat output JSON berisi ringkasan, kuis, dan flashcards.

    URL Video: ${youtubeUrl}

    ${promptContext}

    INSTRUKSI KONTEN:
    1. RINGKASAN (Summary): Tulis rangkuman lengkap dari isi video di field 'summary'. 
       - Analisis konten audio/narasi dalam video
       - Jika ada teks atau slide yang ditampilkan, sertakan informasinya
       - Gunakan format Markdown yang kaya:
         * TABEL: WAJIB gunakan tabel untuk perbandingan, data terstruktur, atau list kategori.
         * CODE BLOCK: Gunakan untuk kode program atau rumus.
         * BLOCKQUOTE (>): Gunakan untuk definisi penting atau kesimpulan utama.
         * BOLD & ITALIC: Gunakan untuk menekankan kata kunci penting.
         * LIST: Gunakan bullet points atau numbering untuk langkah-langkah.
       - Gunakan Header (#, ##, ###) untuk struktur yang rapi.
       - JANGAN pakai pembuka/penutup basa-basi.
    2. KUIS (Quiz): WAJIB ADA. Buat 10 soal pilihan ganda yang relevan dengan isi video.
    3. FLASHCARDS: WAJIB ADA. Buat minimal 5 flashcards berisi konsep penting dari video.

    PENTING:
    - Kuis dan Flashcards TIDAK BOLEH KOSONG.
    - Fokus pada poin-poin pembelajaran utama dari video.

    FORMAT OUTPUT (Wajib JSON Valid, tanpa teks lain):
    {
      "title": "Judul berdasarkan isi video (Max 5-7 kata)",
      "summary": "String markdown ringkasan...",
      "quiz": {
        "title": "Judul Kuis",
        "questions": [
          { "id": "q1", "question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "..." }
        ]
      },
      "flashcards": [
        { "question": "...", "answer": "..." }
      ]
    }
    `

        // Send prompt with YouTube URL directly to Gemini
        const result = await retryGenAI(() => model.generateContent(prompt))
        const responseText = result.response.text()

        return parseGeminiResponse(responseText)

    } catch (error: any) {
        console.error("Error generating content from YouTube with Gemini:", error)
        throw error
    }
}

// --- Helper Functions ---

function buildPromptContext(options?: GenerationOptions): string {
    if (!options) return ""

    const level = options.understandingLevel || "Menengah"
    let styleGuide = "Penjelasan seimbang untuk pemahaman umum"

    if (["Pemula", "Dasar"].includes(level)) {
        styleGuide = "Penjelasan detail dengan analogi sederhana, hindari jargon rumit."
    } else if (level === "Menengah") {
        styleGuide = "Penjelasan seimbang, informatif, dan mudah dipahami."
    } else if (["Mahir", "Ahli"].includes(level)) {
        styleGuide = "Penjelasan ringkas, padat, dan menggunakan istilah teknis yang tepat."
    }

    // Map writing style to prompt instruction
    const styleMap: Record<string, string> = {
        "relaxed": "Gunakan bahasa yang santai, ramah, dan seperti teman belajar (conversational). Boleh menggunakan sapaan akrab.",
        "formal": "Gunakan bahasa yang formal, akademis, dan baku. Hindari slang.",
        "concise": "Langsung pada poinnya (to-the-point), bullet points, tanpa basa-basi.",
        "humorous": "Gunakan gaya yang lucu, menyenangkan, slang, dan mungkin sedikit jenaka untuk membuat belajar tidak membosankan."
    }
    const toneInstruction = styleMap[options.writingStyle] || styleMap["relaxed"]

    return `
    KONTEKS PENGGUNA (Gunakan informasi ini untuk menyesuaikan Ringkasan, Kuis, dan Flashcard):
    - Mata Pelajaran/Topik: ${options.subject || "Umum"}
    - Tingkat Pemahaman: ${level}
    - Kompleksitas Penjelasan: ${styleGuide}
    - Gaya Penulisan & Tone: ${toneInstruction}
    `
}

function parseGeminiResponse(responseText: string) {
    let data;
    try {
        let cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        // Ensure we only have the JSON object if there's preamble text
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }

        data = JSON.parse(cleanText);
    } catch (e) {
        console.warn("JSON parse failed, attempting regex fallback. Raw text:", responseText);

        const titleMatch = responseText.match(/"title":\s*"([^"]+)"/);

        // Robust Summary Extraction
        let summaryText = "";
        const summaryStart = responseText.indexOf('"summary": "');
        if (summaryStart !== -1) {
            const startContent = summaryStart + 12; // Length of '"summary": "'
            // Find the next top-level key (quiz or flashcards)
            // We search for ", "key": pattern
            const nextKeyIndex = responseText.substring(startContent).search(/",\s*"(quiz|flashcards)":/);

            if (nextKeyIndex !== -1) {
                summaryText = responseText.substring(startContent, startContent + nextKeyIndex);
            } else {
                // If not found, take until the end but strip typical JSON closing chars
                summaryText = responseText.substring(startContent).replace(/["}\]\s]+$/, "");
            }

            // Basic unescape
            summaryText = summaryText
                .replace(/\\n/g, "\n")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, "\\");
        } else {
            summaryText = "Summary generation incomplete.";
        }

        // Extract Quiz Object (Partial support)
        let quizData = { title: "Generated Quiz", questions: [] };
        try {
            // Attempt to find the full quiz object first
            const quizMatch = responseText.match(/"quiz":\s*({[\s\S]*?})(,\s*"flashcards"|}$)/);
            if (quizMatch && quizMatch[1]) {
                quizData = JSON.parse(quizMatch[1]);
            }
        } catch (err) {
            // If object parse fails, try extracting questions array directly
            const questionsMatch = responseText.match(/"questions":\s*(\[[\s\S]*?\])/);
            if (questionsMatch && questionsMatch[1]) {
                try {
                    const parsedQuestions = JSON.parse(questionsMatch[1]);
                    if (Array.isArray(parsedQuestions)) {
                        quizData.questions = parsedQuestions as any;
                    }
                } catch (qErr) {
                    console.log("Failed to parse questions array");
                }
            }
        }

        // Extract Flashcards (Partial support)
        let flashcardsData: any[] = [];
        try {
            const fcMatch = responseText.match(/"flashcards":\s*(\[[\s\S]*?\])/);
            if (fcMatch && fcMatch[1]) {
                flashcardsData = JSON.parse(fcMatch[1]);
            } else {
                // Try manual object matching for flashcards if array is broken
                const regex = /{\s*"question":\s*"(.*?)",\s*"answer":\s*"(.*?)"\s*}/g;
                let match;
                while ((match = regex.exec(responseText)) !== null) {
                    flashcardsData.push({
                        question: match[1],
                        answer: match[2]
                    });
                }
            }
        } catch (err) {
            console.log("Failed to extract flashcards");
        }

        // Construct fallback object
        data = {
            title: titleMatch ? titleMatch[1] : "Generated Content (Partial)",
            summary: summaryText,
            quiz: quizData,
            flashcards: flashcardsData
        };
    }

    return {
        title: data.title || "Untitled Note",
        summary: data.summary || "",
        quiz: {
            noteId: "",
            userId: "",
            title: data.quiz?.title || "Quiz",
            questions: Array.isArray(data.quiz?.questions) ? data.quiz.questions : [],
        },
        flashcards: Array.isArray(data.flashcards)
            ? data.flashcards.map((f: any) => ({
                noteId: "",
                userId: "",
                ...f,
                reviewCount: 0,
            }))
            : [],
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
                    parts: [{ text: `Judul Materi/Topik Utama: ${context.title}\n\nIsi Materi (Notes):\n${context.content}\n\n${AI_SYSTEM_PROMPT}` }],
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

export async function generateQuizFromNote(
    noteContent: string,
    questionCount: number = 10
): Promise<Omit<Quiz, "id" | "createdAt" | "noteId" | "userId">> {
    if (!apiKey) {
        console.warn("Gemini API Key is missing. Returning mock quiz.")
        return mockGenerateQuizFromNote(questionCount)
    }

    try {
        const prompt = `
  ${AI_SYSTEM_PROMPT}

  Tugas Khusus:
  Buatlah kuis pilihan ganda berdasarkan materi yang disediakan di bawah ini.
  
  Materi:
  "${noteContent.substring(0, 15000)}..."

  PENTING - INSTRUKSI KUANTITAS:
  Anda HARUS menghasilkan TEPAT ${questionCount} pertanyaan. Tidak boleh kurang dari ${questionCount}.
  Jika materi terbatas, gali lebih dalam ke detail spesifik untuk mencapai target ${questionCount} pertanyaan.

  Instruksi:
  1. Jumlah Pertanyaan: ${questionCount} (WAJIB).
  2. Pertanyaan harus relevan dengan materi.
  3. Berikan 4 pilihan jawaban untuk setiap pertanyaan.
  4. Sertakan penjelasan singkat untuk jawaban yang benar.
  
  Output JSON format:
  {
    "title": "Judul Kuis (Relevan dengan materi)",
    "questions": [
      {
        "id": "q1",
        "question": "Pertanyaan...",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": 0,
        "explanation": "Penjelasan..."
      }
    ]
  }
  `

        const result = await retryGenAI(() => model.generateContent(prompt))
        const responseText = result.response.text()

        let data
        try {
            data = JSON.parse(responseText)
        } catch (e) {
            const jsonStr = responseText.replace(/```json/g, "").replace(/```/g, "")
            data = JSON.parse(jsonStr)
        }

        if (data.questions && Array.isArray(data.questions)) {
            data.questions = data.questions.map((q: any) => ({
                ...q,
                id: Math.random().toString(36).substring(2, 9)
            }))
        }

        return data
    } catch (error) {
        console.error("Error generating quiz:", error)
        return mockGenerateQuizFromNote(questionCount)
    }
}

async function mockGenerateQuizFromNote(questionCount: number) {
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return {
        title: "Mock Generated Quiz",
        questions: Array.from({ length: questionCount }).map((_, i) => ({
            id: Math.random().toString(36).substring(2, 9),
            question: `This is a mock question #${i + 1} generated because API key is missing.`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 0,
            explanation: "This is a mock explanation.",
        })),
    }
}

export async function generateFlashcardsFromNote(
    noteContent: string,
    count: number = 5
): Promise<Omit<Flashcard, "id" | "createdAt" | "noteId" | "userId">[]> {
    if (!apiKey) {
        console.warn("Gemini API Key is missing. Returns mock flashcards.")
        return mockGenerateFlashcardsFromNote(count)
    }

    try {
        const prompt = `
  ${AI_SYSTEM_PROMPT}

  Note Content:
  "${noteContent.substring(0, 15000)}..."

  Task:
  Create EXACTLY ${count} flashcards based on the note content above.
  Do not create more or less than ${count}.
  Focus on identifying the most critical concepts, definitions, and key takeaways.
  
  Output JSON:
  {
    "flashcards": [
      {
        "question": "Front of card (Concept/Question)",
        "answer": "Back of card (Definition/Answer)"
      }
    ]
  }
  `
        const result = await retryGenAI(() => model.generateContent(prompt))
        const responseText = result.response.text()

        let data
        try {
            data = JSON.parse(responseText.replace(/```json/g, "").replace(/```/g, ""))
        } catch (e) {
            console.error("Failed to parse flashcards JSON", e)
            return []
        }

        // Strictly limit the number of cards returned to the requested count
        return (data.flashcards || []).slice(0, count)
    } catch (error) {
        console.error("Error generating flashcards:", error)
        return mockGenerateFlashcardsFromNote(count)
    }
}

async function mockGenerateFlashcardsFromNote(count: number) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return Array.from({ length: count }).map((_, i) => ({
        question: `Mock generated question ${i + 1}?`,
        answer: `Mock generated answer ${i + 1}`,
        reviewCount: 0
    }))
}

/**
 * Generate mindmap structure from note content using AI
 */
export async function generateMindmapFromNote(
    noteContent: string,
    noteTitle: string
): Promise<MindmapNode[]> {
    if (!apiKey) {
        console.warn("Gemini API Key is missing. Returning mock mindmap.")
        return mockGenerateMindmap(noteTitle)
    }

    try {
        // Limit content to reduce input tokens, leaving more room for output
        const truncatedContent = noteContent.substring(0, 5000)

        const prompt = `${MINDMAP_SYSTEM_PROMPT}

TOPIK: "${noteTitle}"
KONTEN: "${truncatedContent}"

Buat mindmap JSON untuk konten di atas. Output HANYA JSON valid.`

        const result = await retryGenAI(() => mindmapModel.generateContent(prompt))
        const responseText = result.response.text()

        let data
        try {
            // Clean up AI response - remove code blocks and extra whitespace
            let cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim()

            // Extract JSON object
            const firstBrace = cleanText.indexOf('{')
            let lastBrace = cleanText.lastIndexOf('}')

            // Check if response is truncated (no closing brace or incomplete array)
            if (firstBrace === -1) {
                throw new Error("No valid JSON object found in response")
            }

            // If response seems truncated, try to fix it
            if (lastBrace === -1 || lastBrace < firstBrace) {
                console.warn("Response appears truncated, attempting to fix...")
                // Find the last complete node in the array
                const lastCompleteNode = cleanText.lastIndexOf('},')
                if (lastCompleteNode > firstBrace) {
                    cleanText = cleanText.substring(0, lastCompleteNode + 1) + ']}'
                    lastBrace = cleanText.lastIndexOf('}')
                } else {
                    throw new Error("Cannot recover truncated JSON response")
                }
            }

            let jsonStr = cleanText.substring(firstBrace, lastBrace + 1)

            // Sanitize common JSON issues from AI responses
            jsonStr = jsonStr
                .replace(/,\s*}/g, '}')  // Remove trailing commas before }
                .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
                .replace(/[\r\n]+/g, ' ') // Replace newlines with spaces
                .replace(/\t/g, ' ')      // Replace tabs with spaces
                .replace(/"\s+"/g, '" "') // Fix spacing between strings

            data = JSON.parse(jsonStr)
        } catch (e) {
            console.error("Failed to parse mindmap JSON:", e)
            console.error("Raw response:", responseText.substring(0, 500))
            return mockGenerateMindmap(noteTitle)
        }

        if (data.nodes && Array.isArray(data.nodes)) {
            return data.nodes.map((node: any) => ({
                id: node.id || crypto.randomUUID(),
                label: node.label || "Untitled",
                parentId: node.parentId,
                edgeLabel: node.edgeLabel || undefined,
                position: undefined // Will be calculated by layout
            }))
        }

        return mockGenerateMindmap(noteTitle)
    } catch (error) {
        console.error("Error generating mindmap:", error)
        return mockGenerateMindmap(noteTitle)
    }
}

function mockGenerateMindmap(title: string): MindmapNode[] {
    return [
        { id: "root", label: title || "Mindmap", parentId: null },
        { id: "1", label: "Topik 1", parentId: "root", edgeLabel: "meliputi" },
        { id: "1-1", label: "Sub-topik 1.1", parentId: "1", edgeLabel: "adalah" },
        { id: "1-2", label: "Sub-topik 1.2", parentId: "1", edgeLabel: "yaitu" },
        { id: "2", label: "Topik 2", parentId: "root", edgeLabel: "memiliki" },
        { id: "2-1", label: "Sub-topik 2.1", parentId: "2", edgeLabel: "contohnya" },
        { id: "3", label: "Topik 3", parentId: "root", edgeLabel: "termasuk" },
    ]
}

