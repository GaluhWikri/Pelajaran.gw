import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { FloatingAudioPlayer } from "@/components/floating-audio-player"
import "./globals.css"
import "./print.css"

import { ThemeProvider } from "@/components/theme-provider"

const geist = Geist({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  variable: '--font-geist-sans',
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: "Pelajaranku - Learning Platform",
  description: "Transform your learning materials into interactive notes, flashcards, and quizzes with AI assistance",
  icons: {
    icon: [
      { url: "/favicon/dark/favicon.ico", sizes: "any" },
      { url: "/favicon/dark/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon/dark/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon/dark/android-chrome-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon/dark/android-chrome-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/favicon/dark/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/favicon/dark/site.webmanifest",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <AuthProvider>
            {children}
            <FloatingAudioPlayer />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
