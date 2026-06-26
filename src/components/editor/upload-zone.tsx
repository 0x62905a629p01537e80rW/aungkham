import { useRef, type ChangeEvent } from 'react'
import { Camera, ImageIcon, Palette, ShieldCheck, Sparkles, Type as TypeIcon } from 'lucide-react'

export function UploadZone({ onImage }: { onImage: (dataUrl: string) => void }) {
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  function readFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div
      className="relative flex flex-1 flex-col items-center justify-between overflow-hidden px-6 pb-10 pt-12 text-center"
      style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
    >
      {/* Ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 40% at 50% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 70%), radial-gradient(60% 40% at 50% 100%, color-mix(in oklab, var(--accent-foreground) 12%, transparent), transparent 70%)',
        }}
      />

      <div className="flex flex-1 flex-col items-center justify-center">
        <div
          className="mb-6 grid size-20 place-items-center rounded-[1.5rem] text-primary-foreground shadow-xl"
          style={{
            background:
              'linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary) 60%, white))',
            boxShadow: '0 18px 40px -12px color-mix(in oklab, var(--primary) 45%, transparent)',
          }}
        >
          <TypeIcon className="size-9" strokeWidth={2.4} />
        </div>

        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur">
          <Sparkles className="size-3.5 text-primary" />
          Free · No signup · Works offline
        </span>

        <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          Add <span className="text-primary">Text</span> to Your Photos
        </h1>
        <p className="mt-3 max-w-xs text-pretty text-base leading-relaxed text-muted-foreground">
          Pick a photo from your library or snap a new one — then design your words.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {[
            { icon: TypeIcon, label: 'Fonts' },
            { icon: Palette, label: 'Colors' },
            { icon: Sparkles, label: 'Effects' },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
            >
              <Icon className="size-3.5 text-primary" />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg transition active:scale-[0.98]"
          style={{
            boxShadow: '0 14px 30px -10px color-mix(in oklab, var(--primary) 55%, transparent)',
          }}
        >
          <ImageIcon className="size-5" />
          Choose from Library
        </button>
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl border border-border bg-card text-base font-semibold text-foreground transition active:scale-[0.98]"
        >
          <Camera className="size-5 text-primary" />
          Take a Photo
        </button>
        <p className="mt-1 inline-flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" />
          Your photo stays on this device.
        </p>
      </div>

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={readFile}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={readFile}
      />
    </div>
  )
}
