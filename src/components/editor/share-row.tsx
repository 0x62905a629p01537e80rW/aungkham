import { MoreHorizontal } from 'lucide-react'

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M15.1 12.6h-2v6.9h-2.9v-6.9H8.7v-2.5h1.5V8.6c0-1.9 1.1-3.1 3.3-3.1h1.9v2.5h-1.3c-.7 0-.9.3-.9.9v1.2h2.2l-.3 2.5Z"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
      <defs>
        <linearGradient id="ig-g" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FDCB52" />
          <stop offset="0.45" stopColor="#E1306C" />
          <stop offset="1" stopColor="#833AB4" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="7" fill="url(#ig-g)" />
      <rect x="5.5" y="5.5" width="13" height="13" rx="4" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="16.4" cy="7.7" r="1.05" fill="#fff" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
      <rect width="24" height="24" rx="7" fill="#010101" />
      <path
        fill="#25F4EE"
        d="M11.6 9.9v5.2a1.6 1.6 0 1 1-1.6-1.6c.15 0 .3.02.44.06v-2.1a3.7 3.7 0 1 0 3.26 3.67V4.9h-2.1Z"
      />
      <path
        fill="#FE2C55"
        d="M12.6 9.9v5.2a1.6 1.6 0 1 1-1.6-1.6c.15 0 .3.02.44.06v-2.1a3.7 3.7 0 1 0 3.26 3.67V4.9h-2.1Z"
      />
      <path fill="#fff" d="M14.7 4.9h1.5c.24 1.6 1.3 2.62 2.9 2.8v2.05c-1.1-.03-2.1-.36-2.9-1v-4Z" />
    </svg>
  )
}

function GmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
      <rect width="24" height="24" rx="5" fill="#fff" stroke="#e5e5e5" strokeWidth="0.6" />
      <path fill="#EA4335" d="M4 7.6 12 13l8-5.4V7c0-.7-.6-1.2-1.2-1.2H5.2C4.6 5.8 4 6.3 4 7v.6Z" />
      <path fill="#34A853" d="M4 8.9V17c0 .7.6 1.2 1.2 1.2h2V11L4 8.9Z" />
      <path fill="#FBBC04" d="M16.8 11v7.2h2c.7 0 1.2-.5 1.2-1.2V8.9L16.8 11Z" />
      <path fill="#4285F4" d="M7.2 18.2V11l4.8 3.2 4.8-3.2v7.2H7.2Z" />
    </svg>
  )
}

const ITEMS = [
  { key: 'facebook', label: 'Facebook', Icon: FacebookIcon, url: 'https://www.facebook.com/' },
  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon, url: 'https://www.instagram.com/' },
  { key: 'tiktok', label: 'TikTok', Icon: TikTokIcon, url: 'https://www.tiktok.com/upload' },
  { key: 'gmail', label: 'Gmail', Icon: GmailIcon, url: 'mailto:?subject=My%20photo' },
]

export function ShareRow({ preview }: { preview: string | null }) {
  async function nativeShare() {
    if (!preview) return
    try {
      const blob = await (await fetch(preview)).blob()
      const file = new File([blob], 'image.png', { type: blob.type || 'image/png' })
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] })
        return
      }
      if (navigator.share) await navigator.share({ title: 'My photo' })
    } catch (err) {
      console.log('[share cancelled]', err)
    }
  }

  return (
    <div className="grid grid-cols-5 gap-2">
      {ITEMS.map(({ key, label, Icon, url }) => (
        <button
          key={key}
          type="button"
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          className="flex flex-col items-center gap-1.5 rounded-xl py-2 active:opacity-70"
        >
          <Icon />
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={nativeShare}
        className="flex flex-col items-center gap-1.5 rounded-xl py-2 active:opacity-70"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-muted">
          <MoreHorizontal className="size-4" />
        </span>
        <span className="text-[10px] text-muted-foreground">Other</span>
      </button>
    </div>
  )
}
