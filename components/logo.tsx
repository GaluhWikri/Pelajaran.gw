"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface LogoProps {
  width?: number
  height?: number
  className?: string
}

export function Logo({ width = 40, height = 40, className = "h-10 w-auto object-contain" }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Wait until mounted on client to check resolvedTheme
  useEffect(() => {
    setMounted(true)
  }, [])

  // Default to dark theme logo during SSR / initial load to match default theme
  const themeDir = mounted && resolvedTheme === "light" ? "light" : "dark"

  return (
    <img
      src={`/favicon/${themeDir}/android-chrome-192x192.png?v=3`}
      alt="Pelajaranku Logo"
      width={width}
      height={height}
      className={className}
    />
  )
}
