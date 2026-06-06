'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  useTheme,
  type ThemeProviderProps,
} from 'next-themes'

function FaviconSwitcher() {
  const { resolvedTheme } = useTheme()

  React.useEffect(() => {
    if (!resolvedTheme) return

    const themeDir = resolvedTheme === 'dark' ? 'dark' : 'light'

    // Update standard icon links
    const iconLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']")
    iconLinks.forEach(link => {
      const href = link.getAttribute("href") || ""
      if (href.includes("/favicon/")) {
        const filename = href.substring(href.lastIndexOf('/') + 1)
        link.setAttribute("href", `/favicon/${themeDir}/${filename}`)
      }
    })

    // Update apple-touch-icon
    const appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']")
    if (appleLink) {
      const href = appleLink.getAttribute("href") || ""
      if (href.includes("/favicon/")) {
        const filename = href.substring(href.lastIndexOf('/') + 1)
        appleLink.setAttribute("href", `/favicon/${themeDir}/${filename}`)
      }
    }

    // Update manifest
    const manifestLink = document.querySelector<HTMLLinkElement>("link[rel='manifest']")
    if (manifestLink) {
      const href = manifestLink.getAttribute("href") || ""
      if (href.includes("/favicon/")) {
        const filename = href.substring(href.lastIndexOf('/') + 1)
        manifestLink.setAttribute("href", `/favicon/${themeDir}/${filename}`)
      }
    }
  }, [resolvedTheme])

  return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <FaviconSwitcher />
      {children}
    </NextThemesProvider>
  )
}
