"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let rafId: number
    let stars: Star[] = []
    const isLight = resolvedTheme === "light"

    // ─── Background palette ───────────────────────────────────────────────────
    // Dark:  very dark orange-black (like ember/charcoal) — #0d0500
    // Light: near-white warm cream — #fffaf5
    const BG_DARK  = { r: 12,  g: 5,   b: 0   }   // #0c0500 — near-black with warm orange tint
    const BG_LIGHT = { r: 255, g: 250, b: 245 }   // #fffaf5 — warm white cream

    // Aurora colours — always bright vivid orange in dark, soft in light
    const AURORA = {
      orange1: "255,95,20",    // vivid hot orange
      orange2: "255,140,30",   // bright amber-orange
      orange3: "255,180,60",   // warm golden orange
      orangeLight: "230,90,10", // burnt orange for light mode
    }

    // ─── Stars ────────────────────────────────────────────────────────────────
    class Star {
      x: number; y: number; vx: number; vy: number
      size: number; opacity: number; baseOpacity: number
      twinkleOffset: number; color: string

      constructor(canvas: HTMLCanvasElement) {
        const W = canvas.width, H = canvas.height
        this.x = Math.random() * W
        this.y = Math.random() * H
        const r = Math.random()
        if (r > 0.96) {
          this.size = Math.random() * 1.4 + 1.0
          this.baseOpacity = Math.random() * 0.3 + 0.55
        } else if (r > 0.82) {
          this.size = Math.random() * 0.7 + 0.5
          this.baseOpacity = Math.random() * 0.35 + 0.35
        } else {
          this.size = Math.random() * 0.35 + 0.2
          this.baseOpacity = Math.random() * 0.25 + 0.15
        }
        const sp = this.size * 0.11
        this.vx = -3.2 * sp
        this.vy =  2.0 * sp
        this.opacity = this.baseOpacity
        this.twinkleOffset = Math.random() * Math.PI * 2

        if (isLight) {
          // Light: dark burnt-orange specs on cream
          const c = ["rgba(160,60,0,", "rgba(120,50,0,", "rgba(100,80,60,", "rgba(80,50,30,"]
          this.color = c[Math.floor(Math.random() * c.length)]
          this.baseOpacity *= 0.5
        } else {
          // Dark: white + warm orange-gold glowing stars
          const c = ["rgba(255,255,255,", "rgba(255,230,180,", "rgba(255,200,130,", "rgba(255,170,80,"]
          this.color = c[Math.floor(Math.random() * c.length)]
        }
        this.opacity = this.baseOpacity
      }

      update(canvas: HTMLCanvasElement) {
        const W = canvas.width, H = canvas.height
        this.x += this.vx; this.y += this.vy
        if (this.x < 0) this.x = W
        if (this.x > W) this.x = 0
        if (this.y < 0) this.y = H
        if (this.y > H) this.y = 0
        const t = Date.now() * 0.000125
        this.opacity = Math.max(0.05, Math.min(1,
          this.baseOpacity + Math.sin(t + this.twinkleOffset) * 0.08
        ))
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `${this.color}${this.opacity})`
        ctx.fill()
      }
    }

    // ─── Aurora: vivid orange blobs ───────────────────────────────────────────
    type AuroraSpot = {
      bx: number; by: number
      dx: number; dy: number
      px: number; py: number
      phx: number; phy: number
      rgb: string; alpha: number
      ellipse: number; r: number
    }

    const spotsDark: AuroraSpot[] = [
      // Main large vivid orange — top-left
      { bx:0.10, by:0.20, dx:0.08, dy:0.06, px:0.011, py:0.008, phx:0.0, phy:1.0, rgb:AURORA.orange1, alpha:0.38, ellipse:0.52, r:0.62 },
      // Bright amber-orange — top-right
      { bx:0.80, by:0.15, dx:0.07, dy:0.08, px:0.009, py:0.012, phx:2.1, phy:0.4, rgb:AURORA.orange2, alpha:0.28, ellipse:0.60, r:0.55 },
      // Warm golden — bottom center
      { bx:0.50, by:0.60, dx:0.06, dy:0.05, px:0.007, py:0.010, phx:3.7, phy:2.1, rgb:AURORA.orange3, alpha:0.18, ellipse:0.48, r:0.58 },
      // Accent hot orange — far right edge
      { bx:0.90, by:0.45, dx:0.05, dy:0.07, px:0.010, py:0.007, phx:5.0, phy:3.2, rgb:AURORA.orange1, alpha:0.14, ellipse:0.55, r:0.40 },
    ]

    const spotsLight: AuroraSpot[] = [
      { bx:0.12, by:0.22, dx:0.06, dy:0.05, px:0.011, py:0.008, phx:0.0, phy:1.0, rgb:AURORA.orangeLight, alpha:0.06, ellipse:0.52, r:0.55 },
      { bx:0.78, by:0.18, dx:0.05, dy:0.06, px:0.009, py:0.010, phx:2.1, phy:0.4, rgb:AURORA.orange2,     alpha:0.04, ellipse:0.58, r:0.48 },
      { bx:0.50, by:0.58, dx:0.05, dy:0.04, px:0.007, py:0.009, phx:3.7, phy:2.1, rgb:AURORA.orange3,     alpha:0.03, ellipse:0.45, r:0.50 },
    ]

    const spots = isLight ? spotsLight : spotsDark

    const drawBackground = () => {
      const bg = isLight ? BG_LIGHT : BG_DARK
      // Draw a solid base background so the canvas has the right dark color
      ctx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (!isLight) {
        // Add a subtle radial vignette glow from center — deeper dark at edges
        const vignette = ctx.createRadialGradient(
          canvas.width * 0.5, canvas.height * 0.45, 0,
          canvas.width * 0.5, canvas.height * 0.45, canvas.width * 0.85
        )
        vignette.addColorStop(0.0, "rgba(30,10,0,0)")       // warm dark center
        vignette.addColorStop(0.6, "rgba(10,2,0,0.3)")      // medium vignette
        vignette.addColorStop(1.0, "rgba(0,0,0,0.65)")      // deep black edges
        ctx.fillStyle = vignette
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }

    const drawAurora = (timeSec: number) => {
      ctx.save()
      ctx.globalCompositeOperation = isLight ? "multiply" : "screen"
      const W = canvas.width, H = canvas.height

      spots.forEach(s => {
        const cx = (s.bx + Math.sin(timeSec * s.px + s.phx) * s.dx) * W
        const cy = (s.by + Math.cos(timeSec * s.py + s.phy) * s.dy) * H
        const rx = s.r * W
        const ry = rx * s.ellipse

        ctx.save()
        ctx.translate(cx, cy)
        ctx.scale(1, ry / rx)
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
        grad.addColorStop(0.00, `rgba(${s.rgb},${s.alpha})`)
        grad.addColorStop(0.40, `rgba(${s.rgb},${+(s.alpha * 0.45).toFixed(3)})`)
        grad.addColorStop(0.80, `rgba(${s.rgb},${+(s.alpha * 0.08).toFixed(3)})`)
        grad.addColorStop(1.00, `rgba(${s.rgb},0)`)
        ctx.beginPath()
        ctx.arc(0, 0, rx, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.restore()
      })

      ctx.restore()
    }

    const init = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 3500), 480)
      stars = Array.from({ length: count }, () => new Star(canvas))
    }

    init()
    window.addEventListener("resize", init)

    const animate = () => {
      // 1. Paint background (no clearRect — bg handles it)
      drawBackground()
      // 2. Aurora glow on top
      drawAurora(Date.now() / 1000)
      // 3. Stars drift over aurora
      stars.forEach(s => { s.update(canvas); s.draw(ctx) })
      rafId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", init)
      cancelAnimationFrame(rafId)
    }
  }, [mounted, resolvedTheme])

  if (!mounted) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  )
}
