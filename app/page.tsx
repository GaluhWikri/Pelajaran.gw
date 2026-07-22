"use client"

import { useEffect, useRef, useState, lazy, Suspense } from "react"
import { motion, useScroll, useTransform, AnimatePresence, useMotionTemplate, Variants } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowRight, Sparkles, FileText, Brain, Zap, CheckCircle2, ChevronLeft, ChevronRight, Network, HelpCircle, Mic, BookOpen, LayoutDashboard, Star, Layers, GraduationCap, Headphones, UploadCloud, Trophy, Globe } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { LandingNavbar } from "@/components/landing-navbar"
import dynamic from "next/dynamic"
import { Logo } from "@/components/logo"
import { RunningText } from "@/components/landing/running-text"
import Lenis from "lenis"
import { ParticleBackground } from "@/components/landing/particle-background"

// Dynamic import for heavy component
const ProcessDemo = dynamic(() => import("@/components/landing/process-demo").then(mod => ({ default: mod.ProcessDemo })), {
  loading: () => (
    <div className="flex items-center justify-center min-h-100">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  ),
  ssr: false
})

// ─── Feature cards data & component (outside LandingPage to prevent remounting) ─
const features = [
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
    title: "Quiz & Flashcard",
    description: "Review pemahaman materi dengan kuis dan kartu hafalan yang dibuatkan AI."
  },
  {
    icon: Network,
    title: "Mind Map",
    description: "Visualisasikan hubungan antar konsep dengan mind map yang dihasilkan AI secara otomatis."
  },
  {
    icon: Mic,
    title: "Podcast",
    description: "Ubah materi menjadi podcast dialog dua pembicara yang bisa didengarkan kapan saja."
  }
]

const iconVariants: Record<string, Variants> = {
  "Smart Notes": {
    hover: { rotate: [0, -8, 8, -5, 5, 0], transition: { duration: 0.5 } }
  },
  "AI Tutor 24/7": {
    hover: { scale: [1, 1.12, 0.96, 1.08, 1], transition: { repeat: Infinity, duration: 1.4, ease: "easeInOut" } }
  },
  "Quiz & Flashcard": {
    hover: { scale: [1, 1.22, 1.1], rotate: [0, -15, 15, 0], transition: { duration: 0.45 } }
  },
  "Mind Map": {
    hover: { rotate: [0, 45, -10, 0], scale: 1.15, transition: { duration: 0.6 } }
  },
  "Podcast": {
    hover: { y: [0, -6, 0], transition: { repeat: Infinity, duration: 0.7, ease: "easeInOut" } }
  }
}

function FeatureCard({ feature, i }: { feature: typeof features[0]; i: number }) {
  const variants = iconVariants[feature.title as keyof typeof iconVariants]
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      // once:true = animate only the first time it enters view (no re-trigger on scroll up/down)
      viewport={{ once: true, amount: 0.25 }}
      transition={{ delay: i * 0.08, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover="hover"
      className="group relative p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/10"
    >
      <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
      <div className="relative z-10 space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:bg-orange-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
          <motion.div variants={variants}>
            <feature.icon className="h-7 w-7 text-orange-600 group-hover:text-white transition-colors duration-300" />
          </motion.div>
        </div>
        <h3 className="text-2xl font-bold group-hover:text-orange-600 transition-colors duration-300">
          {feature.title}
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          {feature.description}
        </p>
      </div>
    </motion.div>
  )
}

export default function LandingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  // 3D scale animation - more dramatic size change
  const scale = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0.25, 1.05, 1.05, 0.25])
  const rotateX = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [20, 0, 0, -20])
  const blur = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [4, 0, 0, 4])
  const blurFilter = useMotionTemplate`blur(${blur}px)`

  // Carousel state
  const [[currentSlide, direction], setSlide] = useState([0, 0])
  const [isMobile, setIsMobile] = useState(false)

  const scrollRevealVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.21, 0.47, 0.32, 0.98] as const
      }
    }
  }

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  // Auto-scroll the active tab or pill into view
  useEffect(() => {
    const prefix = isMobile ? 'mobile-pill-' : 'browser-tab-';
    const activeElement = document.getElementById(`${prefix}${currentSlide}`);
    if (activeElement && activeElement.parentElement) {
      const container = activeElement.parentElement;
      const targetScrollLeft = activeElement.offsetLeft - container.offsetWidth / 2 + activeElement.offsetWidth / 2;
      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
      });
    }
  }, [currentSlide, isMobile])

  const desktopScreenshots = [
    { src: "/image/demo desktop/dashboard.png", title: "Dashboard", route: "/dashboard", icon: LayoutDashboard, description: "Overview aktivitas belajar Anda" },
    { src: "/image/demo desktop/allnotes.png", title: "All Notes", route: "/notes", icon: BookOpen, description: "Semua catatan dalam satu tempat" },
    { src: "/image/demo desktop/favorites.png", title: "Favorites", route: "/favorites", icon: Star, description: "Catatan favorit Anda" },
    { src: "/image/demo desktop/note.png", title: "Smart Notes", route: "/notes/notes-id", icon: FileText, description: "Catatan AI yang terstruktur" },
    { src: "/image/demo desktop/flashcard.png", title: "Flashcards", route: "/notes/notes-id/flashcards", icon: Layers, description: "Review cepat dengan flashcard" },
    { src: "/image/demo desktop/quiz.png", title: "Quiz", route: "/notes/notes-id/quiz", icon: GraduationCap, description: "Test pemahaman Anda" },
    { src: "/image/demo desktop/mindmap.png", title: "Mind Map", route: "/notes/notes-id/mindmap", icon: Network, description: "Visualisasikan ide Anda" },
    { src: "/image/demo desktop/podcast.png", title: "Podcast", route: "/notes/notes-id/podcast", icon: Headphones, description: "Dengarkan materi belajar Anda" },
    { src: "/image/demo desktop/upload.png", title: "Upload", route: "/upload", icon: UploadCloud, description: "Upload catatan Anda" },
    { src: "/image/demo desktop/leaderboard.png", title: "LeaderBoard", route: "/leaderboard", icon: Trophy, description: "LeaderBoard Anda" },
  ]

  const mobileScreenshots = [
    { src: "/image/demo mobile/dashboard1.png", title: "Dashboard", route: "/dashboard", icon: LayoutDashboard, description: "Overview aktivitas belajar Anda" },
    { src: "/image/demo mobile/dashboard2.png", title: "Dashboard Detail", route: "/dashboard/detail", icon: LayoutDashboard, description: "Detail statistik belajar" },
    { src: "/image/demo mobile/allnote.png", title: "All Notes", route: "/notes", icon: BookOpen, description: "Semua catatan dalam satu tempat" },
    { src: "/image/demo mobile/favorites.png", title: "Favorites", route: "/favorites", icon: Star, description: "Catatan favorit Anda" },
    { src: "/image/demo mobile/upload1.png", title: "Upload", route: "/upload", icon: UploadCloud, description: "Upload materi belajar" },
    { src: "/image/demo mobile/upload2.png", title: "Upload Process", route: "/upload/process", icon: UploadCloud, description: "Proses upload file" },
    { src: "/image/demo mobile/leaderboard.png", title: "LeaderBoard", route: "/leaderboard", icon: Trophy, description: "LeaderBoard Anda" },
  ]

  const demoScreenshots = isMobile ? mobileScreenshots : desktopScreenshots

  const nextSlide = () => {
    setSlide(([prevSlide]) => {
      const nextIdx = (prevSlide + 1) % demoScreenshots.length
      return [nextIdx, 1]
    })
  }

  const prevSlide = () => {
    setSlide(([prevSlide]) => {
      const prevIdx = (prevSlide - 1 + demoScreenshots.length) % demoScreenshots.length
      return [prevIdx, -1]
    })
  }

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      {/* Landing Page Navbar */}
      <LandingNavbar />

      {/* Hero Section */}
      <section className="pt-36 pb-12 md:pt-48 md:pb-20 px-4 relative overflow-hidden">
        {/* Background glow overlay */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-125 pointer-events-none -z-10 overflow-hidden">
          <ParallaxComponent speed={-80}>
            <div className="w-full h-125 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.08),transparent_50%)]" />
          </ParallaxComponent>
        </div>

        <div className="container mx-auto max-w-6xl relative">

          {/* Staggered Content Container */}
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.12,
                  delayChildren: 0.1
                }
              }
            }}
            initial="hidden"
            animate="visible"
            className="text-center space-y-6 max-w-4xl mx-auto"
          >
            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
              }}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-foreground"
            >
              Belajar Lebih Cerdas
              <br />
              dengan <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 via-amber-500 to-orange-600 drop-shadow-xs relative">
                AI Assistant
                <span className="absolute bottom-1.5 left-0 right-0 h-1 bg-linear-to-r from-orange-500/40 via-amber-500/40 to-orange-600/40 rounded-full blur-xs" />
              </span>
            </motion.h1>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
              }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Transform materi & video belajar Anda menjadi <span className="text-foreground font-semibold">catatan interaktif, ringkasan, flashcard, quiz, mind map</span>, dan <span className="text-foreground font-semibold">podcast</span> dengan bantuan AI dalam hitungan detik.
            </motion.p>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
              }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full sm:w-auto"
            >
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2.5 text-base h-13 px-8 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-105 transition-all duration-300">
                  Mulai Belajar
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-13 px-8 rounded-full border-border/80 hover:bg-muted/50 hover:scale-102 transition-all duration-300" onClick={() => {
                document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
              }}>
                Lihat Demo
              </Button>
            </motion.div>

            {/* Social Proof */}
            <ParallaxComponent speed={15}>
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 150 } }
                }}
                className="flex items-center justify-center gap-3 pt-6"
              >
                <div className="flex -space-x-4">
                  {[
                    { letter: "G", bg: "bg-[#29170F]", text: "text-white" },
                    { letter: "A", bg: "bg-[#422216]", text: "text-white" },
                    { letter: "L", bg: "bg-[#66361E]", text: "text-white" },
                    { letter: "U", bg: "bg-[#914F2B]", text: "text-white" },
                    { letter: "H", bg: "bg-[#F58F50]", text: "text-[#29170F]" },
                  ].map((avatar, i) => (
                    <div
                      key={i}
                      className={`h-10 w-10 rounded-full ${avatar.bg} ${avatar.text} flex items-center justify-center text-sm font-bold border-2 border-background shadow-sm`}
                      style={{ zIndex: 5 - i }}
                    >
                      {avatar.letter}
                    </div>
                  ))}
                </div>
                <span className="text-muted-foreground font-medium text-sm">
                  Disukai oleh <span className="text-foreground font-bold">2,000,000+</span> Pelajar
                </span>
              </motion.div>
            </ParallaxComponent>
          </motion.div>
        </div>
      </section>

      {/* App Screenshot Demo */}
      <section id="demo" ref={containerRef} className="py-4 md:py-6 px-4 relative scroll-mt-20 perspective-1000">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            style={{
              scale,
              rotateX,
              filter: blurFilter
            }}
            className="relative transform-style-3d"
          >
            {/* Background glow - only on desktop */}
            <div className="hidden md:block absolute inset-0 bg-linear-to-r from-orange-500/10 to-orange-600/10 rounded-3xl -z-10" />

            {/* Demo Container - Limited size for laptop fit */}
            <div className={`relative rounded-3xl border border-border bg-card shadow-2xl overflow-hidden ${
              isMobile ? 'max-w-85 mx-auto' : 'max-w-5xl mx-auto'
            }`}>
              {/* Browser Header - Only show on desktop */}
              {!isMobile && (
                <div className="bg-muted/30 border-b border-border">
                  {/* Tab Bar */}
                  <div className="flex items-center px-4 pt-3">
                    {/* Window Controls */}
                    <div className="flex gap-1.5 mr-6 shrink-0 pb-2">
                      <span className="h-3 w-3 rounded-full bg-red-500/80" />
                      <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                      <span className="h-3 w-3 rounded-full bg-green-500/80" />
                    </div>

                    {/* Interactive Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide max-w-full relative">
                      {demoScreenshots.map((shot, index) => {
                        const Icon = shot.icon;
                        const isActive = index === currentSlide;
                        return (
                          <button
                            key={index}
                            id={`browser-tab-${index}`}
                            onClick={() => {
                              setSlide(([prevSlide]) => {
                                const dir = index > prevSlide ? 1 : -1
                                return [index, dir]
                              })
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all shrink-0 border-t border-x ${
                              isActive 
                                ? 'bg-background border-border text-foreground relative z-10 -mb-px' 
                                : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                            }`}
                          >
                            <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : ''}`} />
                            <span>{shot.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation & Address Bar */}
                  <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-background/50">
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={prevSlide}
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Back"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={nextSlide}
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Forward"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <div className="h-4 w-px bg-border mx-1" />
                    </div>
                    {/* Address input */}
                    <div className="flex-1 flex items-center gap-2 bg-muted/60 px-3 py-1 rounded-lg text-xs text-muted-foreground border border-border/50">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground/60" />
                      <span>pelajaranku.ai{demoScreenshots[currentSlide].route}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Tab Pills Bar - Only show on mobile */}
              {isMobile && (
                <div className="flex items-center gap-2 p-3 overflow-x-auto no-scrollbar border-b border-border bg-muted/20 relative">
                  {demoScreenshots.map((shot, index) => {
                    const Icon = shot.icon;
                    const isActive = index === currentSlide;
                    return (
                      <button
                        key={index}
                        id={`mobile-pill-${index}`}
                        onClick={() => {
                          setSlide(([prevSlide]) => {
                            const dir = index > prevSlide ? 1 : -1
                            return [index, dir]
                          })
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                          isActive 
                            ? 'bg-primary text-primary-foreground shadow-xs' 
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{shot.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Screenshot Display Viewport */}
              <div className="relative bg-black/5 overflow-hidden">
                {/* iPhone Bezel Effect for Mobile */}
                {isMobile && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-black rounded-full z-20 flex items-center justify-center">
                    <div className="w-12 h-1 bg-neutral-800 rounded-full" />
                  </div>
                )}

                <div className={`relative w-full ${isMobile ? 'aspect-9/19 pt-8' : 'aspect-video'}`}>
                  <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                      key={currentSlide}
                      custom={direction}
                      variants={{
                        enter: (direction: number) => ({
                          x: direction > 0 ? '100%' : '-100%',
                          opacity: 0,
                        }),
                        center: {
                          x: 0,
                          opacity: 1,
                        },
                        exit: (direction: number) => ({
                          x: direction < 0 ? '100%' : '-100%',
                          opacity: 0,
                        })
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                      }}
                      className="absolute inset-0 w-full h-full flex items-center justify-center p-2 md:p-6"
                    >
                      <div className="relative w-full h-full rounded-xl overflow-hidden border border-border/40 shadow-lg bg-background">
                        <Image
                          src={demoScreenshots[currentSlide].src}
                          alt={demoScreenshots[currentSlide].title}
                          fill
                          className="object-cover"
                          priority={currentSlide === 0}
                          loading={currentSlide === 0 ? "eager" : "lazy"}
                          sizes="(max-width: 768px) 100vw, 80vw"
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Arrows */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/85 hover:bg-background backdrop-blur-md border border-border flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all z-10"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-5 w-5 text-foreground" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/85 hover:bg-background backdrop-blur-md border border-border flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all z-10"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-5 w-5 text-foreground" />
                  </button>
                </div>

                {/* Floating Glass Metadata Overlay */}
                <div className={`absolute bottom-4 left-4 right-4 md:left-8 md:bottom-8 md:right-auto md:max-w-sm bg-background/80 backdrop-blur-xl border border-border/60 p-4 md:p-5 rounded-2xl shadow-xl z-10 transition-all duration-300`}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const CurrentIcon = demoScreenshots[currentSlide].icon;
                        return <CurrentIcon className="h-4 w-4 text-primary" />;
                      })()}
                      <h4 className="font-bold text-sm md:text-base text-foreground">
                        {demoScreenshots[currentSlide].title}
                      </h4>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      {demoScreenshots[currentSlide].description}
                    </p>
                    
                    {/* Dots / Pagination */}
                    <div className="flex gap-1.5 pt-2">
                      {demoScreenshots.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSlide(([prevSlide]) => {
                              const dir = index > prevSlide ? 1 : -1
                              return [index, dir]
                            })
                          }}
                          className={`h-1.5 rounded-full transition-all ${
                            index === currentSlide ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                          }`}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Running Text / Infinite Ticker */}
      <RunningText />

      {/* Process Animation Section */}
      <motion.section
        id="cara-kerja"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={scrollRevealVariants}
        className="py-12 md:py-20 px-4 relative scroll-mt-20"
      >
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-100 bg-orange-500/20 rounded-full blur-[100px] -z-10" />
            <ProcessDemo />
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 px-4 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-linear-to-tr from-orange-500/5 to-transparent rounded-full blur-3xl -z-10" />

        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={scrollRevealVariants}
            className="text-center mb-20 space-y-4"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Fitur <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-amber-500">Unggulan</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Platform belajar all-in-one yang didukung AI untuk memaksimalkan potensi akademis Anda.
            </p>
          </motion.div>

          <div className="space-y-6">
            {/* Top row: 3 cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.slice(0, 3).map((feature, i) => (
                <FeatureCard key={feature.title} feature={feature} i={i} />
              ))}
            </div>
            {/* Bottom row: 2 cards centered */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {features.slice(3).map((feature, i) => (
                <FeatureCard key={feature.title} feature={feature} i={i + 3} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24 px-4 relative overflow-visible">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -z-10" />

        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 md:mb-16 space-y-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={scrollRevealVariants}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-medium mb-4">
                <HelpCircle className="h-4 w-4" />
                <span>FAQ</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
                Pertanyaan Umum
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-4">
                Temukan jawaban untuk pertanyaan yang paling sering diajukan oleh pengguna kami.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={scrollRevealVariants}
          >
            <Accordion type="single" collapsible className="w-full space-y-4">
            {[
              {
                id: "item-1",
                q: "Apa itu Pelajaranku?",
                a: "Pelajaranku adalah asisten belajar berbasis AI yang membantu Anda mengubah materi pelajaran (PDF, dokumen, video) menjadi ringkasan interaktif, flashcard, kuis, mind map, podcast secara otomatis. Tujuannya agar proses belajar Anda lebih efisien dan menyenangkan."
              },
              {
                id: "item-2",
                q: "Bagaimana cara kerjanya?",
                a: "Cukup upload file materi Anda atau tempel link YouTube. AI kami akan memprosesnya dalam hitungan detik untuk menghasilkan ringkasan lengkap, kartu hafalan (flashcard), dan kuis latihan."
              },
              {
                id: "item-3",
                q: "Berapa lama Proses Generate Materi?",
                a: "tergantung pada ukuran dan kompleksitas materi yang diupload. Namun, rata-rata proses generate materi memakan waktu sekitar 1-2 menit."
              },
              {
                id: "item-4",
                q: "Format file apa saja yang didukung?",
                a: "Pelajaranku mendukung berbagai format file termasuk PDF, DOCX, PPTX, dan juga link YouTube. Anda dapat mengupload catatan kuliah, slide presentasi, atau bahkan video pembelajaran untuk dirangkum oleh AI kami."
              }
            ].map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <AccordionItem
                  value={faq.id}
                  className="group border border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl hover:border-orange-500/50 hover:bg-card/80 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-orange-500/5 overflow-visible"
                >
                  <AccordionTrigger className="text-base md:text-lg font-semibold py-5 md:py-6 px-5 md:px-6 hover:no-underline group-data-[state=open]:text-orange-500 transition-colors text-left">
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="shrink-0 h-8 w-8 md:h-10 md:w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 text-sm md:text-base font-bold group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                        {index + 1}
                      </span>
                      <span className="leading-snug">{faq.q}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed overflow-visible">
                    <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0 pl-17 md:pl-20">
                      {faq.a}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 relative overflow-hidden">
        <div className="container mx-auto max-w-5xl">
          {/* Scroll Reveal Wrapper */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0, y: 40, scale: 0.97 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }
              }
            }}
          >
            {/* Looping Floating Card */}
            <motion.div
              animate={{
                y: [0, -8, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 5,
                ease: "easeInOut"
              }}
              className="relative rounded-[2.5rem] overflow-hidden bg-background/50 dark:bg-background/40 backdrop-blur-2xl border border-border/80 dark:border-white/10 shadow-2xl"
            >
              {/* Ambient background glows */}
              <div className="absolute -left-16 -top-16 w-80 h-80 bg-orange-500/20 rounded-full blur-[100px] -z-10 animate-pulse pointer-events-none" />
              <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-orange-500/15 rounded-full blur-[100px] -z-10 animate-pulse pointer-events-none" style={{ animationDelay: "1.5s" }} />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 brightness-100 dark:opacity-10 mix-blend-overlay pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center justify-center text-center p-10 md:p-20 space-y-8">
                {/* Typography */}
                <div className="space-y-4 max-w-3xl">
                  <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                    Revolusi Cara Belajarmu <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-amber-500">Jadi Lebih Mudah</span>
                  </h2>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                    Tinggalkan cara lama yang membosankan. Biarkan AI membantu Anda merangkum, membuat kuis, dan menghafal materi dalam hitungan detik.
                  </p>
                </div>

                {/* Call to Action Button with Shiny Effect */}
                <div className="pt-2 w-full sm:w-auto relative group">
                  {/* Outer Glow Ring */}
                  <div className="absolute inset-0 rounded-full bg-orange-500/25 blur-md scale-105 group-hover:scale-115 group-hover:bg-orange-500/40 transition-all duration-300 animate-pulse" />
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="relative w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg h-14 px-10 rounded-full overflow-hidden hover:scale-105 transition-all duration-300 shadow-lg shadow-orange-500/25"
                    >
                      {/* Shiny reflection streak */}
                      <motion.div
                        className="absolute inset-0 w-[50%] h-full bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
                        animate={{
                          x: ["-100%", "250%"]
                        }}
                        transition={{
                          repeat: Infinity,
                          repeatDelay: 3,
                          duration: 1.4,
                          ease: "easeInOut"
                        }}
                      />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Mulai Belajar
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>
                </div>

                {/* Feature Highlights Grid */}
                <motion.div 
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { 
                      opacity: 1, 
                      transition: { staggerChildren: 0.08 } 
                    }
                  }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full border-t border-border/40 pt-10 mt-8"
                >
                  {[
                    { icon: Zap, label: "Proses Cepat" },
                    { icon: Brain, label: "AI Cerdas" },
                    { icon: FileText, label: "Unlimited Notes" },
                    { icon: Network, label: "Mind Map" },
                    { icon: Mic, label: "Podcast" },
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                      }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/40 dark:bg-muted/10 border border-border/40 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all duration-300 group shadow-xs"
                    >
                      <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-2.5 text-orange-500 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-foreground/80 group-hover:text-foreground transition-colors text-center">{item.label}</span>
                    </motion.div>
                  ))}
                </motion.div>

              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo width={32} height={32} className="h-8 w-auto object-contain" />
              <span className="font-bold text-xl">
                Pelajaran<span className="text-primary">ku</span>
              </span>
            </div>
            <div className="text-sm text-muted-foreground text-right">
              <p>© 2025 Pelajaranku. All rights reserved.</p>
              <p className="text-xs mt-1">Deployed by <span className="font-medium text-orange-500">Galuh Wikri</span></p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ParallaxComponent({ children, speed = 40 }: { children: React.ReactNode; speed?: number }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  // Smooth parallax offset
  const y = useTransform(scrollYProgress, [0, 1], [-speed, speed])

  return (
    <div ref={ref} className="relative w-full">
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  )
}
