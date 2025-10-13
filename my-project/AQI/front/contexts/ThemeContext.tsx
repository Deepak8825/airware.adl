"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDarkMode: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark as client-side
    setIsClient(true)
    
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('airware-theme') as Theme
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    // Only run on client side
    if (!isClient) return

    // Save theme to localStorage whenever it changes
    localStorage.setItem('airware-theme', theme)
    
    // Apply theme logic
    const applyTheme = () => {
      let shouldBeDark = false
      
      if (theme === 'dark') {
        shouldBeDark = true
      } else if (theme === 'auto') {
        // Check system preference
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      // theme === 'light' keeps shouldBeDark as false
      
      setIsDarkMode(shouldBeDark)
      
      // Apply to document
      if (shouldBeDark) {
        document.documentElement.classList.add('dark')
        console.log('Applied dark theme')
      } else {
        document.documentElement.classList.remove('dark')
        console.log('Applied light theme')
      }
    }

    applyTheme()

    // Listen for system theme changes when in auto mode
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyTheme()
      mediaQuery.addEventListener('change', handleChange)
      
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme, isClient])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}