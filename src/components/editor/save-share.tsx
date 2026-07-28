import { ArrowLeft, Download, FolderPlus, Loader2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="rounded-xl" onClick={onSaveProject}>
                <FolderPlus className="mr-2 size-4" /> {savedProject ? 'Saved' : 'Project'}
              </Button>
              <Button className="rounded-xl" onClick={onSaveImage} disabled={!preview}>
                <Download className="mr-2 size-4" /> Image
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
