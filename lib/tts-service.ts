/**
 * TTS Service using Gemini 2.5 Flash TTS
 * Follows the same pattern as ai-service.ts - direct API call from client
 */

import { GoogleGenAI } from "@google/genai"
import { PodcastDialogue } from "./types"

// Gemini TTS voices
// Use 'Charon' for male (Galuh) and 'Kore' for female (Karin)
const VOICES = {
    male: "Charon",    // Host A (Galuh)
    female: "Kore"     // Host B (Karin)
}

/**
 * Generate speech audio using Gemini TTS (Single Utterance)
 * Used as a fallback or for individual lines if needed
 */
export async function textToSpeech(
    text: string,
    voice: "male" | "female"
): Promise<Blob> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
        throw new Error("Gemini API key not configured")
    }

    const ai = new GoogleGenAI({ apiKey })
    const voiceName = VOICES[voice]

    console.log(`[TTS] Generating audio for: "${text.substring(0, 30)}..." with voice: ${voiceName}`)

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: voiceName
                    }
                }
            }
        }
    })

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data

    if (!audioData) {
        throw new Error("No audio generated from Gemini TTS")
    }

    // Convert base64 to Blob
    const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0))

    // Create WAV blob from PCM data
    const wavBlob = createWavBlob(audioBuffer, 24000, 1, 16)

    return wavBlob
}

/**
 * Generate speech audio for a batch of dialogues using Multi-Speaker TTS
 * Returns raw PCM and sample rate
 */
async function generateRawAudioMultiSpeaker(
    dialogues: PodcastDialogue[]
): Promise<{ pcm: Uint8Array, sampleRate: number }> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) throw new Error("Gemini API key not configured")

    const ai = new GoogleGenAI({ apiKey })

    // Construct conversation text
    let conversationText = "TTS the following conversation between Galuh and Kq:\n\n"
    dialogues.forEach(d => {
        const speakerName = d.speaker === "A" ? "Galuh" : "Karin"
        conversationText += `${speakerName}: ${d.text}\n`
    })

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: conversationText }] }],
        config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                        {
                            speaker: "Galuh",
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICES.male } }
                        },
                        {
                            speaker: "Karin",
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICES.female } }
                        }
                    ]
                }
            }
        }
    })

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
    if (!audioData) throw new Error("No audio generated")

    const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0))
    return { pcm: audioBuffer, sampleRate: 24000 }
}

/**
 * Generate complete podcast audio from dialogues with optimized chunking
 * Balances rate limits (few requests) with sync accuracy (anchored every chunk)
 */
export async function generatePodcastAudio(
    dialogues: PodcastDialogue[],
    onProgress?: (current: number, total: number) => void
): Promise<{ audioBlob: Blob, dialogues: PodcastDialogue[] }> {
    // SINGLE REQUEST MODE:
    // BATCH_SIZE = 100 generates all dialogues at once.
    // - Pros: Only 1 API request per podcast (saves quota)
    // - Cons: Sync may drift 1-2 seconds over long audio
    // User accepted this trade-off for quota efficiency.
    const BATCH_SIZE = 100
    const updatedDialogues = [...dialogues]
    const pcmChunks: Uint8Array[] = []

    let currentTimestamp = 0
    let processedCount = 0

    // Process in chunks
    for (let i = 0; i < dialogues.length; i += BATCH_SIZE) {
        const batch = dialogues.slice(i, i + BATCH_SIZE)

        try {
            // Generate audio for the whole batch (1 request)
            const { pcm, sampleRate } = await generateRawAudioMultiSpeaker(batch)

            // Current chunk duration
            const chunkDuration = pcm.length / (sampleRate * 1 * 2) // 1 channel, 16-bit

            // Distribute duration to lines based on text length ratios
            // This is "Smart Estimation" - accurate per-chunk, estimated per-line
            const totalChars = batch.reduce((sum, d) => sum + d.text.length, 0)

            let batchTimeOffset = 0

            batch.forEach((d, index) => {
                const globalIndex = i + index
                const ratio = d.text.length / totalChars

                // Assign provisional duration
                const duration = chunkDuration * ratio

                updatedDialogues[globalIndex].timestamp = currentTimestamp + batchTimeOffset
                updatedDialogues[globalIndex].audioDuration = duration

                batchTimeOffset += duration
            })

            pcmChunks.push(pcm)
            currentTimestamp += chunkDuration

            processedCount += batch.length
            onProgress?.(processedCount, dialogues.length)

            // Polite delay to avoid burst limits
            // 3 RPM = 1 request per 20s. We wait 20s between batches.
            if (i + BATCH_SIZE < dialogues.length) {
                await new Promise(resolve => setTimeout(resolve, 20000))
            }

        } catch (err: any) {
            console.error(`Error generating chunk starting at ${i}:`, err)

            // Handle Limit Error with clearer message
            if (err.message.includes("429") || err.message.includes("quota")) {
                throw new Error("Limit Audio Tercapai. Coba kurangi panjang materi atau tunggu sebentar.")
            }
            throw err
        }
    }

    // Concatenate all PCM chunks
    const totalLength = pcmChunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const combinedPCM = new Uint8Array(totalLength)
    let offset = 0
    pcmChunks.forEach(chunk => {
        combinedPCM.set(chunk, offset)
        offset += chunk.length
    })

    // Create final WAV blob (24kHz, 1 channel, 16-bit)
    const wavBlob = createWavBlob(combinedPCM, 24000, 1, 16)

    return { audioBlob: wavBlob, dialogues: updatedDialogues }
}

/**
 * Convert audio blob to playable URL
 */
export function createAudioUrl(blob: Blob): string {
    return URL.createObjectURL(blob)
}

/**
 * Clean up audio URL when no longer needed
 */
export function revokeAudioUrl(url: string): void {
    URL.revokeObjectURL(url)
}

/**
 * Get estimated duration based on text length
 * Rough estimate: ~10 chars per second for Indonesian speech
 */
export function estimateDuration(dialogues: PodcastDialogue[]): number {
    const totalChars = dialogues.reduce((sum, d) => sum + d.text.length, 0)
    const seconds = Math.ceil(totalChars / 10)
    return seconds
}

/**
 * Helper function to create a WAV file from raw PCM data
 */
function createWavBlob(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Blob {
    const byteRate = sampleRate * numChannels * bitsPerSample / 8
    const blockAlign = numChannels * bitsPerSample / 8
    const dataSize = pcmData.length
    const bufferSize = 44 + dataSize

    const buffer = new ArrayBuffer(bufferSize)
    const view = new DataView(buffer)

    // RIFF header
    writeString(view, 0, "RIFF")
    view.setUint32(4, bufferSize - 8, true)
    writeString(view, 8, "WAVE")

    // fmt subchunk
    writeString(view, 12, "fmt ")
    view.setUint32(16, 16, true) // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true) // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitsPerSample, true)

    // data subchunk
    writeString(view, 36, "data")
    view.setUint32(40, dataSize, true)

    // Copy PCM data
    const uint8View = new Uint8Array(buffer, 44)
    uint8View.set(pcmData)

    return new Blob([buffer], { type: "audio/wav" })
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i))
    }
}
