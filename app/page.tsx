"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, FileText, Brain, Zap, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { LandingNavbar } from "@/components/landing-navbar"

export default function LandingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1])
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0.5, 1])

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const desktopScreenshots = [
    { src: "/image/demo desktop/dashboard.png", title: "Dashboard", description: "Overview aktivitas belajar Anda" },
    { src: "/image/demo desktop/allnotes.png", title: "All Notes", description: "Semua catatan dalam satu tempat" },
    { src: "/image/demo desktop/favorites.png", title: "Favorites", description: "Catatan favorit Anda" },
    { src: "/image/demo desktop/note.png", title: "Smart Notes", description: "Catatan AI yang terstruktur" },
    { src: "/image/demo desktop/flashcard.png", title: "Flashcards", description: "Review cepat dengan flashcard" },
    { src: "/image/demo desktop/quiz.png", title: "Quiz", description: "Test pemahaman Anda" },
    { src: "/image/demo desktop/upload.png", title: "Upload", description: "Upload catatan Anda" },
    { src: "/image/demo desktop/leaderboard.png", title: "LeaderBoard", description: "LeaderBoard Anda" },
  ]

  const mobileScreenshots = [
    { src: "/image/demo mobile/dashboard1.png", title: "Dashboard", description: "Overview aktivitas belajar Anda" },
    { src: "/image/demo mobile/dashboard2.png", title: "Dashboard Detail", description: "Detail statistik belajar" },
    { src: "/image/demo mobile/allnote.png", title: "All Notes", description: "Semua catatan dalam satu tempat" },
    { src: "/image/demo mobile/favorites.png", title: "Favorites", description: "Catatan favorit Anda" },
    { src: "/image/demo mobile/upload1.png", title: "Upload", description: "Upload materi belajar" },
    { src: "/image/demo mobile/upload2.png", title: "Upload Process", description: "Proses upload file" },
    { src: "/image/demo mobile/leaderboard.png", title: "LeaderBoard", description: "LeaderBoard Anda" }, 
  ]

  const demoScreenshots = isMobile ? mobileScreenshots : desktopScreenshots

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % demoScreenshots.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + demoScreenshots.length) % demoScreenshots.length)

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/20">
      {/* Landing Page Navbar */}
      <LandingNavbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-muted/50 text-sm">
              <Sparkles className="h-4 w-4 text-orange-500" />
              <span>Powered by AI</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Belajar Lebih Cerdas
              <br />
              dengan <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-orange-600">AI Assistant</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform materi belajar Anda menjadi catatan interaktif, flashcard, dan quiz dengan bantuan AI dalam hitungan detik.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="gap-2 text-lg h-12 px-8">
                  Coba Sekarang
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg h-12 px-8" onClick={() => {
                document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
              }}>
                Lihat Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Demo Section with Scroll Animation */}
      <section id="demo" ref={containerRef} className="py-20 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            style={{ scale, opacity }}
            className="relative"
          >
            <div className="absolute inset-0 bg-linear-to-r from-orange-500/20 to-orange-600/20 blur-3xl -z-10" />

            {/* Demo Container */}
            <div className={`relative rounded-3xl border-8 border-foreground/10 bg-background shadow-2xl overflow-hidden ${isMobile ? 'max-w-sm mx-auto' : ''
              }`}>
              {/* Browser/Phone Header - Only show on desktop */}
              {!isMobile && (
                <div className="bg-muted/50 px-6 py-4 border-b flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-sm text-muted-foreground ml-4">pelajaran.gw - DEMO</span>
                </div>
              )}

              {/* Screenshot/Demo Carousel */}
              <div className="relative bg-background overflow-hidden">
                {/* Main Image Container - Auto height based on image */}
                <div className={`relative w-full ${isMobile ? 'aspect-390/844' : 'aspect-2/1'} rounded-xl`}>
                  <AnimatePresence initial={false} custom={currentSlide}>
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 w-full h-full flex items-start justify-center"
                    >
                      <Image
                        src={demoScreenshots[currentSlide].src}
                        alt={demoScreenshots[currentSlide].title}
                        width={isMobile ? 390 : 1920}
                        height={isMobile ? 844 : 1080}
                        className="w-full h-full object-contain object-top"
                        priority={currentSlide === 0}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Buttons */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm border flex items-center justify-center hover:bg-background transition-colors z-10"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm border flex items-center justify-center hover:bg-background transition-colors z-10"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Bottom Info & Dots */}
                {/* Bottom Info & Dots */}
                <div className="flex flex-col items-center gap-4 py-4 border-t bg-muted/10">
                  {/* Title & Description */}
                  <div className="text-center space-y-1 px-4">
                    <p className="font-semibold text-base">{demoScreenshots[currentSlide].title}</p>
                    <p className="text-sm text-muted-foreground">{demoScreenshots[currentSlide].description}</p>
                  </div>

                  {/* Dots Indicator */}
                  <div className="flex gap-2">
                    {demoScreenshots.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`h-2 rounded-full transition-all ${index === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'
                          }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Fitur Unggulan</h2>
            <p className="text-xl text-muted-foreground">Semua yang Anda butuhkan untuk belajar lebih efektif</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: "Smart Notes",
                description: "Upload PDF, DOCX, atau link YouTube. AI akan membuat catatan terstruktur otomatis."
              },
              {
                icon: Brain,
                title: "AI Assistant",
                description: "Tanya jawab langsung dengan AI tentang materi yang sedang Anda pelajari."
              },
              {
                icon: Zap,
                title: "Auto Generate",
                description: "Flashcard dan quiz dibuat otomatis dari catatan Anda untuk review cepat."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="h-12 w-12 rounded-xl bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative rounded-3xl bg-linear-to-r from-orange-500 to-orange-600 p-12 text-center text-white overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl font-bold">Siap Belajar Lebih Cerdas?</h2>
              <p className="text-xl opacity-90">Mulai gratis sekarang, tidak perlu kartu kredit</p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="gap-2 text-lg h-12 px-8">
                    Mulai Gratis
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-8 pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Gratis selamanya</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Unlimited notes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>AI powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/favicon/android-chrome-192x192.png"
                alt="Pelajaran.gw Logo"
                width={32}
                height={32}
                className="h-8 w-auto object-contain"
              />
              <span className="font-bold text-xl">
                Pelajaran<span className="text-primary">.gw</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Pelajaran.gw. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
