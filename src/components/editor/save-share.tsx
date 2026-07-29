import { useState } from 'react'
import { ArrowLeft, Download, FileText, FolderPlus, Loader2, Lock, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { SaveImageDialog } from './save-image-dialog'
import { defaultFilename, exportPdf } from '@/lib/export-image'

interface SaveShareProps {
  preview: string | null
  size: { w: number; h: number } | null
  busy?: boolean
  savedProject?: boolean
  onBack: () => void
  onShare: () => void
  onSaveImage: () => void
  onSaveProject: () => void
}


export function SaveShare({
  preview,
  size,
  busy = false,
  savedProject = false,
  onBack,
  onShare,
  onSaveImage,
  onSaveProject,
}: SaveShareProps) {
  const { isPro } = useAuth()
  const [saving, setSaving] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  async function handlePdf() {
    if (!preview || !isPro) return
    setPdfBusy(true)
    try {
      await exportPdf(preview, `${defaultFilename()}.pdf`)
    } catch (err) {
      console.log('[pdf export failed]', err)
    } finally {
      setPdfBusy(false)
    }
  }

  return (

    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header
        className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-2"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <Button variant="ghost" size="icon" aria-label="Back" onClick={onBack} className="size-9 rounded-full">
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="flex-1 text-center text-base font-semibold">Save and Share</h1>
        <div className="size-9" />
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto w-full max-w-md">
          <div className="overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
            {busy || !preview ? (
              <div className="flex aspect-square items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <img src={preview} alt="Edited result preview" className="block w-full" />
            )}
          </div>
          {size && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {size.w} x {size.h}
            </p>
          )}

          <section className="mt-6 rounded-2xl border border-border p-4">
            <p className="mb-3 text-sm font-medium">Share</p>
            <Button variant="outline" className="w-full rounded-xl" onClick={onShare} disabled={!preview}>
              <Share2 className="mr-2 size-4" /> Share To
            </Button>
          </section>

          <section className="mt-4 rounded-2xl border border-border p-4">
            <p className="mb-3 text-sm font-medium">Save</p>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => isPro && onSaveProject()}
                disabled={!isPro}
              >
                {isPro ? (
                  <>
                    <FolderPlus className="mr-1.5 size-4" /> {savedProject ? 'Saved' : 'Project'}
                  </>
                ) : (
                  <>
                    <Lock className="mr-1.5 size-4" /> Project
                  </>
                )}
              </Button>
              <Button className="rounded-xl" onClick={() => setSaving(true)} disabled={!preview}>
                <Download className="mr-1.5 size-4" /> Image
              </Button>
              <Button
                variant="outline"
                className="relative rounded-xl"
                onClick={handlePdf}
                disabled={!isPro || !preview || pdfBusy}
              >
                {pdfBusy ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : isPro ? (
                  <FileText className="mr-1.5 size-4" />
                ) : (
                  <Lock className="mr-1.5 size-4" />
                )}
                PDF
                {!isPro && (
                  <span className="absolute -right-1 -top-2 rounded bg-[#8b5cf6] px-1 text-[9px] font-bold text-white">
                    PRO
                  </span>
                )}
              </Button>
            </div>
            {!isPro && (
              <p className="mt-3 flex items-center gap-1.5 rounded-xl border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 px-3 py-2 text-[11px] font-medium text-foreground">
                <Lock className="size-3.5 shrink-0 text-[#8b5cf6]" />
                Saving projects and PDF export are Pro features — buy Pro to unlock them.
              </p>
            )}
          </section>
        </div>
      </div>

      <SaveImageDialog open={saving} preview={preview} onClose={() => setSaving(false)} />
    </div>
  )

}
