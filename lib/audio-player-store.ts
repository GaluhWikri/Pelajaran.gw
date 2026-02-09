"use client"

import { create } from "zustand"
import { PodcastDialogue } from "./types"

interface AudioPlayerState {
    // Audio state
    isPlaying: boolean
    currentTime: number
    duration: number
    volume: number
    playbackSpeed: number

    // Podcast data
    audioUrl: string | null
    podcastTitle: string
    noteId: string | null
    dialogues: PodcastDialogue[]

    // Mini player visibility
    showMiniPlayer: boolean

    // Position for draggable
    position: { x: number; y: number }

    // Actions
    setAudioData: (data: {
        audioUrl: string
        podcastTitle: string
        noteId: string
        dialogues: PodcastDialogue[]
        duration?: number
    }) => void
    play: () => void
    pause: () => void
    setCurrentTime: (time: number) => void
    setDuration: (duration: number) => void
    setVolume: (volume: number) => void
    setPlaybackSpeed: (speed: number) => void
    showMini: () => void
    hideMini: () => void
    setPosition: (position: { x: number; y: number }) => void
    closePlayer: () => void
    reset: () => void
}

const initialState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackSpeed: 1,
    audioUrl: null,
    podcastTitle: "",
    noteId: null,
    dialogues: [],
    showMiniPlayer: false,
    position: { x: -1, y: -1 }, // -1 means use default position
}

import { persist, createJSONStorage } from "zustand/middleware"

export const useAudioPlayerStore = create<AudioPlayerState>()(
    persist(
        (set, get) => ({
            ...initialState,

            setAudioData: (data) => set({
                audioUrl: data.audioUrl,
                podcastTitle: data.podcastTitle,
                noteId: data.noteId,
                dialogues: data.dialogues,
                duration: data.duration || 0,
                // Don't reset time if it's the same audio
                currentTime: get().audioUrl === data.audioUrl ? get().currentTime : 0,
                isPlaying: false,
            }),

            play: () => set({ isPlaying: true }),

            pause: () => set({ isPlaying: false }),

            setCurrentTime: (time) => set({ currentTime: time }),

            setDuration: (duration) => set({ duration }),

            setVolume: (volume) => set({ volume }),

            setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

            showMini: () => set({ showMiniPlayer: true }),

            hideMini: () => set({ showMiniPlayer: false }),

            setPosition: (position) => set({ position }),

            closePlayer: () => {
                set({
                    isPlaying: false,
                    showMiniPlayer: false,
                    audioUrl: null,
                    noteId: null,
                    podcastTitle: "",
                    dialogues: [],
                    currentTime: 0,
                    duration: 0,
                })
            },

            reset: () => set(initialState),
        }),
        {
            name: "audio-player-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // Only persist certain fields
                volume: state.volume,
                playbackSpeed: state.playbackSpeed,
                position: state.position,
                // We persist playback state too to recover after navigation
                audioUrl: state.audioUrl,
                podcastTitle: state.podcastTitle,
                noteId: state.noteId,
                currentTime: state.currentTime,
                duration: state.duration,
                showMiniPlayer: state.showMiniPlayer,
                // Don't persist large data or playing state if not needed
                // isPlaying: state.isPlaying // Maybe don't auto-play on reload? Let's check.
                // Actually, let's persist isPlaying so it continues
                isPlaying: state.isPlaying,
            }),
        }
    )
)
