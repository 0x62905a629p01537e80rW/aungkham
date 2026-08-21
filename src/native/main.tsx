/**
 * Capacitor / offline SPA entry point.
 *
 * This bypasses TanStack Start entirely: no SSR, no server functions, no
 * Lovable backend. The editor is mounted straight into #root and every asset
 * is bundled into dist/.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import '../styles.css'

import { ThemeProvider } from '@/components/theme-provider'
import { LanguageProvider } from '@/components/i18n'
import { LaunchAd } from '@/components/launch-ad'
import { Toaster } from '@/components/ui/sonner'
import { Editor } from '@/components/editor/editor'
import { initNativeShell } from '@/lib/native'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 0, refetchOnWindowFocus: false } },
})

function NativeApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <Editor />
          <LaunchAd />
          <Toaster position="top-center" richColors closeButton />
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

initNativeShell()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NativeApp />
  </StrictMode>,
)
