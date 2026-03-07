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
 * Generate speech audio for a batch of dialogues using Multi-Speaker TTS
 * Returns raw PCM and sample rate
 */
async function generateRawAudioMultiSpeaker(
    dialogues: PodcastDialogue[]
): Promise<{ pcm: Uint8Array, sampleRate: number }> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) throw new Error("Gemini API key not configured")

    const ai = new GoogleGenAI({ apiKey })

    // Construct conversation text with explicit verbatim instruction
    let conversationText = "Read the following conversation between Galuh and Karin EXACTLY as written, word for word. Do not add, remove, or change any words:\n\n"
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
 * Generate complete podcast audio from ALL dialogues in a SINGLE TTS request.
 * Total per podcast: 1 script request + 1 TTS request = 2 requests.
 * 
 * Note: Dialogue highlight timestamps are proportional estimates.
 * Perfect sync would require 1 TTS request per dialogue (20+ requests).
 */
export async function generatePodcastAudio(
    dialogues: PodcastDialogue[],
    onProgress?: (current: number, total: number) => void
): Promise<{ audioBlob: Blob, dialogues: PodcastDialogue[], actualDuration: number }> {
    const updatedDialogues = [...dialogues]

    onProgress?.(0, dialogues.length)

    try {
        // Single TTS request for ALL dialogues
        const { pcm, sampleRate } = await generateRawAudioMultiSpeaker(dialogues)

        // Calculate actual audio duration from PCM data (24kHz, 1ch, 16-bit)
        const totalDuration = pcm.length / (sampleRate * 1 * 2)

        console.log(`[TTS] Generated ${totalDuration.toFixed(1)}s audio for ${dialogues.length} dialogues in 1 request`)

        // Distribute timestamps proportionally (approximate, not exact)
        const PAUSE_WEIGHT = 15
        const weights = dialogues.map(d => d.text.length + PAUSE_WEIGHT)
        const totalWeight = weights.reduce((sum, w) => sum + w, 0)

        let currentTimestamp = 0
        dialogues.forEach((d, index) => {
            const ratio = weights[index] / totalWeight
            const dialogueDuration = totalDuration * ratio

            updatedDialogues[index].timestamp = currentTimestamp
            updatedDialogues[index].audioDuration = dialogueDuration

            currentTimestamp += dialogueDuration
        })

        onProgress?.(dialogues.length, dialogues.length)

        // Create WAV blob (24kHz, 1 channel, 16-bit)
        const wavBlob = createWavBlob(pcm, 24000, 1, 16)

        return { audioBlob: wavBlob, dialogues: updatedDialogues, actualDuration: totalDuration }

    } catch (err: any) {
        console.error(`Error generating podcast audio:`, err)

        if (err.message.includes("429") || err.message.includes("quota")) {
            throw new Error("Limit Audio Tercapai. Coba kurangi panjang materi atau tunggu sebentar.")
        }
        throw err
    }
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
