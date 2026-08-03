import { useEffect, useState } from 'react'
import { ArrowLeft, FileText, FolderPlus, Loader2, Ratio, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { requestAd } from '@/components/launch-ad'
import { SaveImageDialog } from './save-image-dialog'
import { ShareRow } from './share-row'
import { defaultFilename, exportPdf } from '@/lib/export-image'

interface SaveShareProps {
  preview: string | null
  size: { w: number; h: number } | null
  busy?: boolean
  savedProject?: boolean
  onBack: () => void
  onSaveImage: () => void
  onSaveProject: () => void
  onBatchExport?: () => void
}


export function SaveShare({
  preview,
  size,
  busy = false,
  savedProject = false,
  onBack,
  onSaveProject,
  onBatchExport,
}: SaveShareProps) {
  const { isPro } = useAuth()
  const [saving, setSaving] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pay, setPay] = useState(false)

  // Show the (preloaded) ad once per app run when a free user hits Next.
  useEffect(() => {
    if (!isPro) requestAd()
  }, [isPro])

  async function handlePdf() {
    if (!isPro) {
      setPay(true)
      return
    }
    if (!preview) return
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
        <h1 className="flex-1 text-center text-base font-semibold">Save</h1>
        <div className="size-9" />
      </header>

      <div className="flex-1 overflow-y-auto perf-scroll p-4">
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
            <Button
              className="h-12 w-full rounded-xl text-base"
              onClick={() => setSaving(true)}
              disabled={!preview}
            >
              <Save className="mr-2 size-5" /> Save Image
            </Button>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="relative rounded-xl"
                onClick={onSaveProject}
              >
                <FolderPlus className="mr-1.5 size-4" />
                {savedProject ? 'Saved' : 'Project'}
              </Button>

              <Button
                variant="outline"
                className="relative rounded-xl"
                onClick={handlePdf}
                disabled={!isPro || !preview || pdfBusy}
              >
                {pdfBusy ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <FileText className="mr-1.5 size-4" />
                )}
                PDF
                {!isPro && (
                  <span className="absolute -right-1 -top-2 rounded bg-[var(--primary)] px-1 text-[9px] font-bold text-white">
                    PRO
                  </span>
                )}
              </Button>
            </div>

            {onBatchExport && (
              <Button variant="outline" className="mt-3 h-11 w-full rounded-xl" onClick={onBatchExport}>
                <Ratio className="mr-2 size-4" /> Smart resize &amp; batch export
              </Button>
            )}
          </section>

          <section className="mt-4 rounded-2xl border border-border p-4">
            <p className="mb-3 text-sm font-medium">Share</p>
            <ShareRow preview={preview} />
          </section>

        </div>
      </div>

      <SaveImageDialog open={saving} preview={preview} onClose={() => setSaving(false)} />
    </div>
  )

}
