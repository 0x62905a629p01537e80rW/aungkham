import { ArrowLeft, ImageUp, Loader2, Save, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EditorHeaderProps {
  hasImage: boolean
  exporting: boolean
  onNewImage: () => void
  onDownload: () => void
  onReplaceImage?: () => void
  onSaveProject?: () => void
}

export function EditorHeader({
  hasImage,
  exporting,
  onNewImage,
  onDownload,
  onReplaceImage,
  onSaveProject,
}: EditorHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-3 backdrop-blur-md"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="Back to home"
        onClick={onNewImage}
        className="size-9 rounded-full"
      >
        <ArrowLeft className="size-5" />
      </Button>

      {hasImage && (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            aria-label="Replace image"
            onClick={onReplaceImage}
            className="size-9 rounded-full"
          >
            <ImageUp className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Save project"
            onClick={onSaveProject}
            className="size-9 rounded-full"
          >
            <FolderPlus className="size-4" />
          </Button>
          <Button
            size="icon"
            aria-label="Save image"
            onClick={onDownload}
            disabled={exporting}
            className="size-9 rounded-full"
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
          </Button>
        </div>
      )}
    </header>
  )
}
