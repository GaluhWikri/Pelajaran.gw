"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { LandingNavbar } from "@/components/landing-navbar"
import { Logo } from "@/components/logo"
import { 
  BookOpen, 
  Globe, 
  Users, 
  Search, 
  AlertTriangle, 
  FileX, 
  RefreshCw, 
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Cpu
} from "lucide-react"
import Link from "next/link"

export default function PendahuluanPage() {
  const [activeSection, setActiveSection] = useState("latar-belakang")

  // List of sections for navigation
  const sections = [
    { id: "latar-belakang", label: "Latar Belakang" },
    { id: "identifikasi-masalah", label: "Identifikasi Masalah" },
    { id: "tujuan-tugas-akhir", label: "Tujuan Tugas Akhir" }
  ]

  // Bulletproof active section tracker based on viewport relative position
  useEffect(() => {
    const handleScroll = () => {
      let currentSection = sections[0].id
      
      for (const sec of sections) {
        const el = document.getElementById(sec.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          // If the top of the section is within 300px from the top of the viewport
          if (rect.top <= 300) {
            currentSection = sec.id
          }
        }
      }
      
      setActiveSection(currentSection)
    }

    window.addEventListener("scroll", handleScroll)
    // Run initially to set active section
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
      // Instantly highlight the clicked section to bypass smooth scroll transit delay
      setActiveSection(id)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <LandingNavbar />

      {/* Hero Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-125 h-125 bg-orange-500/5 dark:bg-orange-500/3 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-150 h-150 bg-amber-500/5 dark:bg-amber-500/3 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-3 dark:opacity-5 mix-blend-overlay pointer-events-none" />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 pt-32 pb-24 px-4 md:px-8 relative z-10 max-w-7xl mx-auto w-full">
        {/* Breadcrumb & Navigation */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-orange-500 transition-colors bg-muted/30 px-3 py-1.5 rounded-full border border-border/40 hover:scale-102">
            <ChevronLeft className="h-3.5 w-3.5" />
            Kembali ke Beranda
          </Link>
        </div>

        {/* Page Title */}
        <div className="mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-primary/80 bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20">
            Dokumentasi Penelitian
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mt-4 leading-tight">
            Latar Belakang & <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-amber-500">Masalah Penelitian</span>
          </h1>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Sticky Sidebar Navigation (TOC) - Hidden on Mobile */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-28 space-y-6 bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-3xl">
              <div className="flex items-center gap-2 pb-4 border-b border-border/40">
                <BookOpen className="h-5 w-5 text-orange-500" />
                <h3 className="font-bold text-sm tracking-wide uppercase text-muted-foreground">Daftar Isi</h3>
              </div>
              <nav className="flex flex-col gap-1">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => handleScrollTo(sec.id)}
                    className={`flex items-center justify-between text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 group ${
                      activeSection === sec.id
                        ? "bg-primary/10 text-primary border-l-2 border-primary pl-4"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span>{sec.label}</span>
                    <ChevronRight 
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        activeSection === sec.id 
                          ? "translate-x-0 opacity-100 text-primary" 
                          : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-muted-foreground"
                      }`} 
                    />
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Body Content Column */}
          <article className="lg:col-span-9 space-y-16">
            
            {/* Latar Belakang */}
            <motion.section
              id="latar-belakang"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="scroll-mt-28 space-y-8"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-xs">
                  <BookOpen className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Latar Belakang
                </h2>
              </div>

              {/* Statistics Visual Highlights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                {[
                  { 
                    icon: Globe, 
                    value: "221.56 Juta", 
                    label: "Pengguna Internet Indonesia", 
                    sub: "Setara 79,5% Populasi (APJII, 2024)",
                    color: "text-blue-500",
                    bg: "bg-blue-500/10"
                  },
                  { 
                    icon: Users, 
                    value: "34.40%", 
                    label: "Kontribusi Terbesar Gen-Z", 
                    sub: "Didominasi Kelompok Mahasiswa Aktif",
                    color: "text-orange-500",
                    bg: "bg-orange-500/10"
                  },
                  { 
                    icon: Search, 
                    value: "83.2%", 
                    label: "Akses Utama Cari Informasi", 
                    sub: "Dari 212,9 Juta Pengguna (We Are Social, 2023)",
                    color: "text-amber-500",
                    bg: "bg-amber-500/10"
                  }
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="flex flex-col p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xs hover:border-orange-500/20 hover:bg-card/75 transition-all duration-300 relative overflow-hidden shadow-xs"
                  >
                    <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <span className="text-3xl font-extrabold tracking-tight text-foreground">{stat.value}</span>
                    <span className="text-sm font-bold text-foreground/80 mt-1">{stat.label}</span>
                    <span className="text-xs text-muted-foreground mt-2 leading-normal">{stat.sub}</span>
                  </motion.div>
                ))}
              </div>

              {/* Background Paragraphs */}
              <div className="space-y-6 text-muted-foreground leading-relaxed text-base md:text-lg">
                <p>
                  Perkembangan teknologi digital telah mengubah cara mahasiswa mengakses sumber belajar secara fundamental. Berdasarkan survei penetrasi internet yang dirilis oleh Asosiasi Penyelenggara Jasa Internet Indonesia (APJII) pada tahun 2024, pengguna internet di Indonesia telah mencapai <strong className="text-foreground font-semibold">221,56 juta orang</strong> atau setara <strong className="text-foreground font-semibold">79,5%</strong> dari total populasi, dengan Generasi Z yang mencakup kelompok usia mahasiswa aktif menjadi kelompok kontributor terbesar sebanyak <strong className="text-foreground font-semibold">34,40%</strong> dari total pengguna <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-orange-500/10 text-orange-500 text-xs font-bold border border-orange-500/10 ml-1">APJ24</span>. Kondisi ini mendorong pergeseran sumber referensi belajar mahasiswa dari buku cetak ke berbagai platform digital, termasuk dokumen PDF, video YouTube, dan materi daring lainnya yang tersedia tanpa batas.
                </p>

                {/* Pull Quote block for Information Overload */}
                <div className="border-l-4 border-orange-500 pl-6 my-8 py-2 bg-orange-500/5 dark:bg-orange-500/2 rounded-r-2xl pr-4">
                  <p className="font-medium text-foreground italic leading-relaxed">
                    "Volume informasi yang masif menyulitkan mahasiswa dalam memilah, menyaring, dan mengorganisasi poin penting. Beban informasi yang berlebihan (information overload) menghambat efisiensi belajar seseorang dan memicu perasaan kehilangan kendali akibat luapan data tidak terfilter."
                  </p>
                  <span className="block mt-2 text-xs text-muted-foreground font-bold">— Bawden & Robinson [BAW20] & Nuralmi dkk. [NUR24]</span>
                </div>

                <p>
                  Melimpahnya sumber informasi digital ini, meskipun memperluas akses belajar, justru memicu fenomena yang dikenal sebagai <strong className="text-foreground font-semibold">information overload</strong>. Berdasarkan laporan We Are Social tahun 2023, sebanyak <strong className="text-foreground font-semibold">83,2%</strong> dari 212,9 juta pengguna internet Indonesia mengakses internet dengan tujuan utama mencari informasi, sementara 167 juta di antaranya aktif menggunakan media sosial sebagai sumber informasi tambahan <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-orange-500/10 text-orange-500 text-xs font-bold border border-orange-500/10 mx-1">WAS23</span>. Volume informasi yang masif ini menyulitkan mahasiswa dalam memilah, menyaring, dan mengorganisasi poin-poin penting secara efisien. 
                </p>

                <p>
                  Penelitian yang dilakukan oleh Nuralmi dkk. <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-orange-500/10 text-orange-500 text-xs font-bold border border-orange-500/10 mr-1">NUR24</span> terhadap mahasiswa di Indonesia mengonfirmasi hal tersebut, menemukan bahwa mahasiswa mengalami tiga kondisi information overload secara bersamaan, yaitu <strong className="text-foreground">keragaman informasi yang sulit dipilah</strong>, <strong className="text-foreground">kompleksitas konten yang membingungkan</strong>, dan <strong className="text-foreground">kebingungan dalam membedakan informasi yang relevan</strong> dari yang tidak relevan, yang berdampak langsung pada penurunan fokus dan produktivitas akademik mereka.
                </p>

                <p>
                  Dalam konteks pembelajaran mandiri, mahasiswa tidak hanya membutuhkan akses ke materi mentah, tetapi juga memerlukan berbagai format instrumen bantu belajar seperti ringkasan terstruktur, kuis latihan, kartu hafalan, peta konsep, hingga media audio untuk mendukung pemahaman yang lebih mendalam. Namun, penyediaan instrumen-instrumen tersebut secara mandiri dari sumber yang sangat luas membutuhkan waktu dan energi yang signifikan. Akibatnya, waktu yang seharusnya digunakan untuk memahami substansi materi justru habis untuk kegiatan pengorganisasian dan penyaringan teks secara konvensional.
                </p>

                {/* Highlight Gemini AI Integration Card */}
                <div className="p-8 rounded-3xl bg-linear-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20 relative overflow-hidden my-8 group">
                  <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-52 h-52 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex flex-col md:flex-row gap-6 relative z-10">
                    <div className="h-12 w-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-500/20">
                      <Bookmark className="h-6 w-6" />
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                        Pemanfaatan Large Language Model (LLM) & Gemini AI
                        <span className="text-xs bg-orange-500/20 text-orange-500 px-2.5 py-0.5 rounded-full font-bold border border-orange-500/20">Teknologi Inti</span>
                      </h4>
                      <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
                        Pemanfaatan AI generatif dalam pendidikan memungkinkan transformasi teks mentah menjadi berbagai instrumen belajar yang lebih terstruktur secara otomatis <span className="text-orange-500 font-bold">[BAI23, FAH25]</span>. Namun, pada praktiknya platform AI saat ini masih mengharuskan interaksi <strong>prompting manual</strong> secara berulang, menghasilkan format tidak konsisten serta membutuhkan keahlian teknis tersendiri.
                      </p>
                    </div>
                  </div>
                </div>

                <p>
                  Berdasarkan kondisi tersebut, penelitian ini mengembangkan aplikasi web <strong className="text-foreground font-semibold">Learning Companion (Pelajaranku)</strong> dengan mengintegrasikan teknologi Google Gemini AI. Sistem ini dirancang untuk mengotomatisasi seluruh proses pengolahan konten akademik, di mana pengguna cukup mengunggah sumber materi mentah dalam berbagai format (PDF, DOCX, PPTX, atau tautan YouTube) untuk kemudian ditransformasikan secara otomatis menjadi ringkasan terstruktur, kuis interaktif, kartu hafalan (flashcard), peta pikiran (mindmap), dan konten audio podcast tanpa perlu melakukan interaksi prompting manual. Kehadiran sistem ini bertujuan untuk menyediakan ekosistem instrumen bantu belajar yang terorganisir, variatif, dan instan guna mendukung aktivitas pembelajaran mandiri yang lebih efektif dan efisien bagi mahasiswa.
                </p>
              </div>
            </motion.section>

            {/* Identifikasi Masalah */}
            <motion.section
              id="identifikasi-masalah"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="scroll-mt-28 space-y-8"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-xs">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Identifikasi Masalah
                </h2>
              </div>

              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                Berdasarkan latar belakang yang telah diuraikan, dapat diidentifikasi beberapa permasalahan yang menjadi fokus utama riset ini:
              </p>

              {/* Large Stylized List Cards */}
              <div className="space-y-6">
                {[
                  {
                    num: "1",
                    icon: AlertTriangle,
                    title: "Information Overload Sumber Belajar",
                    desc: "Kesulitan dalam menyaring dan mengorganisasi poin-poin inti dari sumber belajar digital yang jumlahnya sangat besar serta tersebar di berbagai platform, memicu penurunan fokus dan hambatan efisiensi belajar.",
                    citation: "Bawden & Robinson [BAW20]"
                  },
                  {
                    num: "2",
                    icon: FileX,
                    title: "Keterbatasan Akses Instrumen Bantu Belajar Instan",
                    desc: "Keterbatasan ketersediaan instrumen bantu belajar terpadu yang dapat dihasilkan secara otomatis dan instan (seperti ringkasan, kuis latihan, kartu hafalan, mindmap, dan audio podcast) untuk mendukung keberagaman kebutuhan pembelajaran mandiri mahasiswa.",
                    citation: "Sumber Materi Mentah"
                  },
                  {
                    num: "3",
                    icon: RefreshCw,
                    title: "Ketergantungan Proses Prompting AI Manual",
                    desc: "Penggunaan platform AI generatif yang ada saat ini masih mengharuskan pengguna melakukan proses perintah (prompting) secara manual, teknis, dan berulang kali demi mendapatkan format hasil instrumen yang diinginkan.",
                    citation: "Baidoo-Anu & Ansah [BAI23]"
                  }
                ].map((problem, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ x: 6 }}
                    className="flex flex-col md:flex-row gap-6 p-6 md:p-8 rounded-4xl border border-border/50 bg-card/40 backdrop-blur-md hover:border-orange-500/30 hover:bg-card/75 transition-all duration-300 relative shadow-sm group"
                  >
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-12 w-1.5 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0 border border-orange-500/20 shadow-xs relative">
                      <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-orange-500 text-white h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-background">
                        {problem.num}
                      </span>
                      <problem.icon className="h-5 w-5" />
                    </div>

                    <div className="space-y-2 flex-1">
                      <h4 className="text-lg md:text-xl font-bold text-foreground group-hover:text-orange-500 transition-colors">
                        {problem.title}
                      </h4>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {problem.desc}
                      </p>
                      <div className="flex items-center gap-1.5 pt-2">
                        <Bookmark className="h-3.5 w-3.5 text-orange-500/70" />
                        <span className="text-xs font-bold text-orange-500/80 tracking-wide uppercase">
                          {problem.citation}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Tujuan Tugas Akhir */}
            <motion.section
              id="tujuan-tugas-akhir"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="scroll-mt-28 space-y-8"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-xs">
                  <Bookmark className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Tujuan Tugas Akhir
                </h2>
              </div>

              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                Berdasarkan identifikasi masalah tersebut di atas, maka dapat diperoleh tujuan tugas akhir yaitu:
              </p>

              {/* Scope cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    num: "1",
                    title: "Membangun Aplikasi Web Full-Stack",
                    desc: "Membangun aplikasi web full-stack Learning Companion menggunakan framework Next.js dan Supabase yang dilengkapi dengan sistem otomatisasi untuk mengubah materi multimodal (dokumen, audio, dan video) menjadi instrumen bantu belajar yang terstruktur.",
                    badge: "Aplikasi Web & Otomatisasi",
                    icon: Layers
                  },
                  {
                    num: "2",
                    title: "Mengimplementasikan Otomasi Instruksi",
                    desc: "Mengimplementasikan otomasi instruksi (prompt engineering) di dalam sistem untuk meniadakan proses pengetikan perintah manual oleh pengguna, sehingga berbagai variasi konten belajar dapat dihasilkan secara instan hanya melalui interaksi antarmuka aplikasi.",
                    badge: "Prompt Engineering",
                    icon: Cpu
                  }
                ].map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -4 }}
                      className="flex flex-col p-6 md:p-8 rounded-3xl border border-border/50 bg-card/40 backdrop-blur-md hover:border-orange-500/20 hover:bg-card/75 transition-all duration-300 relative shadow-sm group"
                    >
                      <div className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center border-2 border-background shadow-md">
                        {item.num}
                      </div>

                      <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 mb-4 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                        <Icon className="h-5 w-5" />
                      </div>

                      <h4 className="text-lg md:text-xl font-bold text-foreground mb-2 group-hover:text-orange-500 transition-colors">
                        {item.title}
                      </h4>
                      
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed flex-1">
                        {item.desc}
                      </p>

                      <div className="mt-6 pt-4 border-t border-border/40">
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-orange-500/80 bg-orange-500/10 px-3 py-1 rounded-md border border-orange-500/10">
                          {item.badge}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.section>

          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-card/10 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Logo width={32} height={32} className="h-8 w-auto object-contain" />
              <span className="font-bold text-xl">
                Pelajaran<span className="text-primary">ku</span>
              </span>
            </div>
            <div className="text-sm text-muted-foreground text-center sm:text-right">
              <p>© 2025 Pelajaranku. All rights reserved.</p>
              <p className="text-xs mt-1">Deployed by <span className="font-medium text-orange-500">Galuh Wikri</span></p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
