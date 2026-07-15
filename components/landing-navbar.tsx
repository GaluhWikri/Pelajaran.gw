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

const navLinks = [
  { label: "Fitur", href: "/#features" },
  { label: "Cara Kerja", href: "/#cara-kerja" },
  { label: "FAQ", href: "/#faq" },
  { label: "Landasan", href: "/pendahuluan" }
]

export function LandingNavbar() {
  const pathname = usePathname()
  const isNavVisible = pathname === "/" || pathname === "/pendahuluan"
  const [isScrolled, setIsScrolled] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    // Set initial state
    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "py-3 bg-background/80 backdrop-blur-md border-b border-border/40 shadow-xs"
          : "py-5 bg-transparent border-b border-transparent"
      )}
    >
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between relative">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity z-50">
          <Logo width={32} height={32} className="h-8 w-8 md:h-10 md:w-10 object-contain" />
          <span className="text-base md:text-xl font-bold whitespace-nowrap">
            Pelajaran<span className="text-primary">ku</span>
          </span>
        </Link>

        {/* Center Desktop Navigation Links */}
        {isNavVisible && (
          <div className="hidden md:flex items-center gap-1.5 bg-muted/40 dark:bg-muted/10 border border-border/40 px-1.5 py-1 rounded-full backdrop-blur-xs">
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
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {hoveredIdx === idx && (
                  <motion.span
                    layoutId="navbar-hover-pill"
                    className="absolute inset-0 bg-primary/10 rounded-full"
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
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs font-semibold px-3 h-8.5">
              Masuk
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="h-8.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md shadow-orange-500/10 text-xs rounded-full hover:scale-105 transition-all">
              Daftar
            </Button>
          </Link>
        </div>

        {/* Mobile Control Buttons (ThemeToggle & Hamburger Menu) */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          
          {isNavVisible && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-muted/50 border border-border/30 transition-colors z-50 cursor-pointer"
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" className="text-foreground fill-none">
                <motion.path
                  strokeWidth="2"
                  stroke="currentColor"
                  strokeLinecap="round"
                  variants={{
                    closed: { d: "M 3 5 L 17 5" },
                    open: { d: "M 3 17 L 17 3" }
                  }}
                  animate={isMobileMenuOpen ? "open" : "closed"}
                  transition={{ duration: 0.2 }}
                />
                <motion.path
                  strokeWidth="2"
                  stroke="currentColor"
                  strokeLinecap="round"
                  d="M 3 10 L 17 10"
                  variants={{
                    closed: { opacity: 1 },
                    open: { opacity: 0 }
                  }}
                  animate={isMobileMenuOpen ? "open" : "closed"}
                  transition={{ duration: 0.2 }}
                />
                <motion.path
                  strokeWidth="2"
                  stroke="currentColor"
                  strokeLinecap="round"
                  variants={{
                    closed: { d: "M 3 15 L 17 15" },
                    open: { d: "M 3 3 L 17 17" }
                  }}
                  animate={isMobileMenuOpen ? "open" : "closed"}
                  transition={{ duration: 0.2 }}
                />
              </svg>
            </button>
          )}
        </div>

        {/* Mobile Nav Slide-Down Drawer Panel */}
        <AnimatePresence>
          {isMobileMenuOpen && isNavVisible && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="md:hidden border-b border-border/50 bg-background/95 backdrop-blur-md absolute top-full left-0 right-0 shadow-lg z-40"
            >
              <div className="flex flex-col gap-3 p-6 pt-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "text-sm font-bold transition-colors py-1.5 border-b border-border/30 last:border-b-0",
                      pathname === link.href
                        ? "text-primary font-extrabold"
                        : "text-muted-foreground hover:text-primary"
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
                    <Button className="w-full justify-center bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md shadow-orange-500/10 text-xs h-9 rounded-full">
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
