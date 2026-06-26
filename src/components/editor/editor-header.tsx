import { Download, ImageUp, Loader2, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EditorHeaderProps {
  hasImage: boolean
  exporting: boolean
  onNewImage: () => void
  onDownload: () => void
}

export function EditorHeader({
  hasImage,
  exporting,
  onNewImage,
  onDownload,
}: EditorHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Type className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight">
            Text on <span className="text-primary">Photo</span>
          </p>
          <p className="text-[11px] text-muted-foreground">Native photo text editor</p>
        </div>
      </div>

      {hasImage && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNewImage}
            className="h-9 gap-1.5 rounded-full px-3"
          >
            <ImageUp className="size-4" />
            <span className="hidden sm:inline">New</span>
          </Button>
          <Button
            size="sm"
            onClick={onDownload}
            disabled={exporting}
            className="h-9 gap-1.5 rounded-full px-4"
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      )}
    </header>
  )
}
