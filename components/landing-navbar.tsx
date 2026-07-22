"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"

const navLinks = [
  { label: "Fitur", href: "/#features" },
  { label: "Cara Kerja", href: "/#cara-kerja" },
  { label: "FAQ", href: "/#faq" },
  { label: "Landasan", href: "/pendahuluan" }
]

export function LandingNavbar() {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const isNavVisible = pathname === "/" || pathname === "/pendahuluan"
  const [scrollY, setScrollY] = useState(0)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollProgress = Math.min(1, scrollY / 80)
  const isAtTop = scrollY < 20

  // Use resolvedTheme only after mount to avoid hydration mismatch
  const isDark = mounted && resolvedTheme === "dark"

  // Glass bg for scroll — computed inline so we can use exact RGBA
  const glassBg = isDark
    ? "rgba(15, 6, 0, 0.55)"       // dark: warm black-orange tinted glass
    : "rgba(255, 252, 248, 0.80)"  // light: warm white glass

  return (
    <motion.nav
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-[padding] duration-300",
        isAtTop ? "py-5" : "py-3"
      )}
    >
      {/* Glassmorphism background layer */}
      <div
        className="absolute inset-0 pointer-events-none backdrop-blur-xl transition-opacity duration-300"
        style={{ opacity: scrollProgress, background: glassBg }}
      />

      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between relative z-10">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity z-50">
          <Logo width={32} height={32} className="h-8 w-8 md:h-10 md:w-10 object-contain" />
          <span className="text-base md:text-xl font-bold whitespace-nowrap text-foreground">
            Pelajaran<span className="text-primary">ku</span>
          </span>
        </Link>

        {/* Center Desktop Navigation Links */}
        {isNavVisible && (
          <div className={cn(
            "hidden md:flex items-center gap-1.5 border px-1.5 py-1 rounded-full backdrop-blur-sm",
            isDark
              ? "bg-white/6 border-white/15"
              : "bg-black/5 border-black/10"
          )}>
            {navLinks.map((link, idx) => (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={cn(
                  "relative px-4 py-1.5 text-xs font-semibold rounded-full transition-colors",
                  pathname === link.href
                    ? "text-primary"
                    : isDark
                      ? "text-white/90 hover:text-white"
                      : "text-stone-700 hover:text-stone-900"
                )}
              >
                {hoveredIdx === idx && (
                  <motion.span
                    layoutId="navbar-hover-pill"
                    className={cn("absolute inset-0 rounded-full", isDark ? "bg-white/10" : "bg-black/8")}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Right Desktop Auth Controls */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "border text-xs font-semibold px-4 h-8.5 rounded-full transition-all",
                isDark
                  ? "border-white/25 text-white hover:bg-white/10 hover:text-white"
                  : "border-stone-300 text-stone-700 hover:bg-stone-100 hover:text-stone-950"
              )}
            >
              Masuk
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="h-8.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/30 text-xs rounded-full hover:scale-105 transition-all">
              Daftar
            </Button>
          </Link>
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          {isNavVisible && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "p-2 rounded-lg border transition-colors z-50 cursor-pointer",
                isDark
                  ? "hover:bg-white/10 border-white/20 text-white"
                  : "hover:bg-stone-100 border-stone-300 text-stone-700"
              )}
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <motion.path strokeWidth="2" strokeLinecap="round"
                  variants={{ closed: { d: "M 3 5 L 17 5" }, open: { d: "M 3 17 L 17 3" } }}
                  animate={isMobileMenuOpen ? "open" : "closed"} transition={{ duration: 0.2 }} />
                <motion.path strokeWidth="2" strokeLinecap="round"
                  d="M 3 10 L 17 10"
                  variants={{ closed: { opacity: 1 }, open: { opacity: 0 } }}
                  animate={isMobileMenuOpen ? "open" : "closed"} transition={{ duration: 0.2 }} />
                <motion.path strokeWidth="2" strokeLinecap="round"
                  variants={{ closed: { d: "M 3 15 L 17 15" }, open: { d: "M 3 3 L 17 17" } }}
                  animate={isMobileMenuOpen ? "open" : "closed"} transition={{ duration: 0.2 }} />
              </svg>
            </button>
          )}
        </div>

        {/* Mobile Nav Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && isNavVisible && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "md:hidden absolute top-full left-0 right-0 shadow-lg z-40 backdrop-blur-xl",
                isDark
                  ? "bg-[rgba(15,6,0,0.85)] border-b border-white/10"
                  : "bg-white/90 border-b border-stone-200"
              )}
            >
              <div className="flex flex-col gap-3 p-6 pt-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "text-sm font-bold transition-colors py-1.5 border-b last:border-b-0",
                      isDark ? "border-white/10" : "border-stone-200",
                      pathname === link.href
                        ? "text-primary font-extrabold"
                        : isDark ? "text-white/80 hover:text-primary" : "text-stone-600 hover:text-primary"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex items-center gap-3 pt-3">
                  <Link href="/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center text-xs font-semibold h-9 rounded-full">
                      Masuk
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 rounded-full">
                      Daftar
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
