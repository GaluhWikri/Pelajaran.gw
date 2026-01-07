"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ProcessDemo } from "@/components/landing/process-demo"
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
      <section className="pt-24 pb-12 md:pt-32 md:pb-20 px-4">
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

      {/* App Screenshot Demo */}
      <section id="demo" ref={containerRef} className="py-12 md:py-20 px-4 relative">
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
                <div className="flex flex-col items-center gap-4 py-4 border-t bg-muted/10">
                  <div className="text-center space-y-1 px-4">
                    <p className="font-semibold text-base">{demoScreenshots[currentSlide].title}</p>
                    <p className="text-sm text-muted-foreground">{demoScreenshots[currentSlide].description}</p>
                  </div>

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

      {/* Process Animation Section */}
      <section className="py-12 md:py-20 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Cara Kerja <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-amber-500">AI</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Otomatisasi proses belajar Anda dalam 3 langkah mudah
            </p>
          </div>

          <div className="relative z-10">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-orange-500/20 rounded-full blur-[100px] -z-10" />
            <ProcessDemo />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 px-4 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-linear-to-tr from-orange-500/5 to-transparent rounded-full blur-3xl -z-10" />

        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Fitur <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-amber-500">Unggulan</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Platform belajar all-in-one yang didukung AI untuk memaksimalkan potensi akademis Anda.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: "Smart Notes",
                description: "Upload materi apapun (PDF/Web/YouTube), AI akan merangkum poin penting secara otomatis."
              },
              {
                icon: Brain,
                title: "AI Tutor 24/7",
                description: "Bingung dengan materi? Chat langsung dengan AI yang paham konteks catatan Anda."
              },
              {
                icon: Zap,
                title: "Instant Quiz & Flashcard",
                description: "Review pemahaman materi secara instan dengan kuis dan kartu hafalan yang dibuatkan AI."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group relative p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/10"
              >
                <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />

                <div className="relative z-10 space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:bg-orange-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                    <feature.icon className="h-7 w-7 text-orange-600 group-hover:text-white transition-colors duration-300" />
                  </div>

                  <h3 className="text-2xl font-bold group-hover:text-orange-600 transition-colors duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -z-10" />

        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
              Pertanyaan Umum
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Temukan jawaban untuk pertanyaan yang paling sering diajukan oleh pengguna kami.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {[
              {
                id: "item-1",
                q: "Apa itu Pelajaran.gw?",
                a: "Pelajaran.gw adalah asisten belajar berbasis AI yang membantu Anda mengubah materi pelajaran (PDF, dokumen, video) menjadi ringkasan interaktif, flashcard, dan kuis secara otomatis. Tujuannya agar proses belajar Anda lebih efisien dan menyenangkan."
              },
              {
                id: "item-2",
                q: "Apakah aplikasi ini gratis?",
                a: "Ya! Pelajaran.gw menyediakan paket gratis yang memungkinkan Anda menggunakan fitur dasar selamanya. Kami juga menawarkan fitur premium bagi pengguna yang membutuhkan kapasitas lebih besar dan fitur AI lanjutan."
              },
              {
                id: "item-3",
                q: "Bagaimana cara kerjanya?",
                a: "Cukup upload file materi Anda atau tempel link YouTube. AI kami akan memprosesnya dalam hitungan detik untuk menghasilkan ringkasan lengkap, kartu hafalan (flashcard), dan kuis latihan."
              },
              {
                id: "item-4",
                q: "Apakah data saya aman?",
                a: "Tentu saja. Privasi Anda adalah prioritas kami. Materi yang Anda upload hanya digunakan untuk keperluan belajar Anda sendiri dan tidak dibagikan kepada pihak ketiga."
              }
            ].map((faq, index) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="group border border-border/50 bg-card/50 backdrop-blur-sm px-6 rounded-2xl hover:border-orange-500/50 hover:bg-card/80 transition-all duration-300 shadow-sm"
              >
                <AccordionTrigger className="text-lg font-semibold py-6 hover:no-underline group-data-[state=open]:text-orange-500 transition-colors">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 relative">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-[2.5rem] overflow-hidden bg-background/40 backdrop-blur-2xl border border-white/10 shadow-2xl"
          >
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/25 rounded-full blur-[100px] -z-10 animate-pulse" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay" />

            <div className="relative z-10 flex flex-col items-center justify-center text-center p-12 md:p-20 space-y-8">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 backdrop-blur-md border border-orange-500/20 text-orange-600 dark:text-orange-400 font-medium shadow-inner">
                <Sparkles className="h-4 w-4 text-orange-500 fill-orange-500" />
                <span className="text-sm">Teknologi AI Terbaru 2025</span>
              </div>

              {/* Typography */}
              <div className="space-y-6 max-w-3xl">
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                  Revolusi Cara Belajarmu <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-amber-500">Jadi Lebih Mudah</span>
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  Tinggalkan cara lama yang membosankan. Biarkan AI membantu Anda merangkum, membuat kuis, dan menghafal materi dalam hitungan detik.
                </p>
              </div>

              {/* Call to Action Button */}
              <div className="pt-4 w-full sm:w-auto">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg h-14 px-10 rounded-full shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-105 transition-all duration-300"
                  >
                    Mulai Gratis Sekarang
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 gap-y-8 w-full border-t border-border/50 pt-10 mt-8">
                {[
                  { icon: Zap, label: "Proses Cepat" },
                  { icon: CheckCircle2, label: "Gratis Selamanya" },
                  { icon: Brain, label: "AI Cerdas" },
                  { icon: FileText, label: "Unlimited Notes" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 text-foreground/80">
                    <item.icon className="h-6 w-6 text-orange-500" />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                ))}
              </div>

            </div>
          </motion.div>
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
