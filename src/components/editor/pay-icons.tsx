import kbzPayLogo from '@/assets/kbzpay-logo.png.asset.json'

/** Brand-ish payment marks drawn inline so checkout stays offline-safe. */

type IconProps = { className?: string }

export function BrandLogo({ className = 'size-9' }: IconProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl text-primary-foreground ${className}`}
      style={{
        background:
          'linear-gradient(150deg, var(--primary), color-mix(in oklab, var(--primary) 62%, white))',
        boxShadow:
          'inset 0 1px 0 var(--glass-rim), 0 10px 22px -14px color-mix(in oklab, var(--primary) 80%, transparent)',
      }}
      aria-hidden="true"
    >
      <span className="font-brand-mm text-[15px] leading-none">မြန်</span>
    </div>
  )
}

export function KbzPayMark({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1.5" y="3.5" width="21" height="17" rx="4.5" fill="#0057B8" />
      <path d="M7 8v8M7 12l3.6-4M7 12l3.8 4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="16" cy="12" r="3.1" fill="#F5A623" />
      <path d="M16 10.2v3.6M14.7 11.4h2.6" stroke="#0057B8" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function UsdtMark({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#26A17B" />
      <path
        d="M13.2 10.6V9.1h3.6V6.7H7.2v2.4h3.6v1.5C8 10.8 6 11.4 6 12.2c0 .8 2 1.4 4.8 1.6v4.1h2.4v-4.1c2.8-.2 4.8-.8 4.8-1.6 0-.8-2-1.4-4.8-1.6zm0 2.7v-.01c-.07 0-.44.03-1.2.03-.63 0-1.06-.02-1.2-.03v.01C8.4 13.2 6.9 12.8 6.9 12.3c0-.5 1.5-.9 3.9-1.05v1.65c.15.01.6.04 1.22.04.74 0 1.13-.03 1.18-.04v-1.65c2.4.15 3.9.55 3.9 1.05 0 .5-1.5.9-3.9 1.05z"
        fill="#fff"
      />
    </svg>
  )
}

export function TronMark({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#EF0027" />
      <path d="M6.4 6.6l11.2 2.1-5.3 9.1-6-11.2 0 0zm1.9 1.3l3.6 6.7 1.1-5.5-4.7-1.2zm5.9 1.5l-1 5.1 3.1-5.3-2.1.2zm-.4-.9l2.3-.24-6.2-1.16 3.9 1.4z" fill="#fff" />
    </svg>
  )
}

export function BnbMark({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#F3BA2F" />
      <path
        d="M12 5.2l2.1 2.1-4.2 4.2-2.1-2.1L12 5.2zm4.7 4.7L18.8 12l-6.8 6.8-2.1-2.1 4.7-4.7-2.6-2.6 2.7-2.6-.0.0zM7.3 9.9L9.4 12l-2.1 2.1L5.2 12l2.1-2.1zM12 12l2.1 2.1L12 16.2 9.9 14.1 12 12z"
        fill="#fff"
      />
    </svg>
  )
}

export function EthMark({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#627EEA" />
      <path d="M12 4.5v5.6l4.7 2.1L12 4.5z" fill="#fff" fillOpacity=".7" />
      <path d="M12 4.5L7.3 12.2 12 10.1V4.5z" fill="#fff" />
      <path d="M12 15.9v3.6l4.7-6.4L12 15.9z" fill="#fff" fillOpacity=".7" />
      <path d="M12 19.5v-3.6l-4.7-2.8L12 19.5z" fill="#fff" />
      <path d="M12 15.1l4.7-2.9L12 10.1v5z" fill="#fff" fillOpacity=".4" />
      <path d="M7.3 12.2l4.7 2.9v-5l-4.7 2.1z" fill="#fff" fillOpacity=".6" />
    </svg>
  )
}

export function SolanaMark({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#0B0B14" />
      <defs>
        <linearGradient id="solg" x1="5" y1="17" x2="19" y2="7" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
      <g fill="url(#solg)">
        <path d="M7.6 15.6c.1-.1.3-.2.5-.2h9.2c.3 0 .5.4.3.6l-1.8 1.8c-.1.1-.3.2-.5.2H6.1c-.3 0-.5-.4-.3-.6l1.8-1.8z" />
        <path d="M7.6 6.2c.1-.1.3-.2.5-.2h9.2c.3 0 .5.4.3.6l-1.8 1.8c-.1.1-.3.2-.5.2H6.1c-.3 0-.5-.4-.3-.6l1.8-1.8z" />
        <path d="M16.4 10.9c-.1-.1-.3-.2-.5-.2H6.7c-.3 0-.5.4-.3.6l1.8 1.8c.1.1.3.2.5.2h9.2c.3 0 .5-.4.3-.6l-1.8-1.8z" />
      </g>
    </svg>
  )
}

/** Pick the right coin/network mark from a network key. */
export function NetworkMark({ netKey, className }: { netKey: string; className?: string }) {
  if (netKey === 'trc20') return <TronMark className={className} />
  if (netKey === 'bep20') return <BnbMark className={className} />
  if (netKey === 'erc20') return <EthMark className={className} />
  if (netKey === 'sol') return <SolanaMark className={className} />
  return <UsdtMark className={className} />
}
