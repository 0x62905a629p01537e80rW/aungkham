import { Moon, Sun } from 'lucide-react'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

let animTimer: ReturnType<typeof setTimeout> | undefined

function applyThemeClass(theme: Theme, animate = false) {
  const root = document.documentElement
  if (animate) {
    root.classList.add('theme-anim')
    clearTimeout(animTimer)
    animTimer = setTimeout(() => root.classList.remove('theme-anim'), 500)
  }
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

function updateThemeColorMeta(theme: Theme) {
  const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff')
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    let initial: Theme = 'light'
    try {
      const saved = localStorage.getItem('theme') as Theme | null
      if (saved === 'light' || saved === 'dark') {
        initial = saved
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        initial = 'dark'
      }
    } catch {
      // storage or media query not available
    }
    setThemeState(initial)
    applyThemeClass(initial)
    updateThemeColorMeta(initial)
  }, [])

  const setTheme = (next: Theme) => {
    setThemeState(next)
    applyThemeClass(next)
    updateThemeColorMeta(next)
    try {
      localStorage.setItem('theme', next)
    } catch {
      // ignore
    }
  }

  const toggleTheme = () => {
    applyThemeClass(theme === 'light' ? 'dark' : 'light', true)
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className={className}
    >
      {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  )
}

export const themeInitScript = `
(function(){
  try {
    var theme = localStorage.getItem('theme');
    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
    }
  } catch (e) {}
})();
`
