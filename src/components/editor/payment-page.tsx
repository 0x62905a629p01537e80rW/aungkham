import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, BadgeCheck, Check, Copy, Coins, Smartphone, Upload } from 'lucide-react'

const PRICE_MMK = '30,000 MMK'
const PRICE_USD = '$12 USD'

const CRYPTO_WALLETS = [
  { label: 'USDT · TRC20 (Tron)', address: 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' },
  { label: 'USDT · BEP20 (BNB Chain)', address: '0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' },
  { label: 'USDC · Solana', address: 'SoLXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' },
]

const KBZ = { name: 'Next Level Creators', phone: '09-XXX-XXX-XXX' }
const SUPPORT_EMAIL = 'mm.nextlevelcreators@gmail.com'

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="glass-tile rounded-2xl px-3.5 py-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="min-w-0 flex-1 break-all font-mono text-[12px] leading-snug">{value}</p>
        <button
          type="button"
          aria-label={`Copy ${label}`}
          onClick={() => {
            navigator.clipboard?.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
          }}
          className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition active:scale-95"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  )
}

type Method = null | 'crypto' | 'kbz'

export function PaymentPage({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [method, setMethod] = useState<Method>(null)

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-background text-foreground animate-fade-in">
      <div
        className="flex items-center gap-3 px-4 pb-2 pt-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={() => (method ? setMethod(null) : onClose())}
          className="grid size-9 place-items-center rounded-full transition active:scale-95"
        >
          <ArrowLeft className="size-6" />
        </button>
        <h2 className="text-xl font-semibold">
          {method === 'crypto' ? 'Crypto payment' : method === 'kbz' ? 'KBZPay payment' : 'Checkout'}
        </h2>
      </div>

      <div className="px-4 pb-14">
        <div className="rounded-3xl border border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-sm font-semibold">Myan Pro · Lifetime</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">{PRICE_MMK}</p>
          <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <BadgeCheck className="size-3.5 text-primary" />
            One-time payment · approx. {PRICE_USD}
          </p>
        </div>

        {!method && (
          <div className="mt-5 space-y-3">
            <p className="text-sm font-semibold">Choose a payment method</p>

            <button
              type="button"
              onClick={() => setMethod('crypto')}
              className="glass-tile flex w-full items-center gap-3 rounded-2xl p-4 text-left transition active:scale-[0.99]"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Coins className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold">Crypto · Stablecoins</p>
                <p className="text-[11px] text-muted-foreground">
                  USDT / USDC — TRC20, BEP20 or Solana. Instant, worldwide.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMethod('kbz')}
              className="glass-tile flex w-full items-center gap-3 rounded-2xl p-4 text-left transition active:scale-[0.99]"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Smartphone className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold">Myanmar manual payment</p>
                <p className="text-[11px] text-muted-foreground">
                  KBZPay transfer — send {PRICE_MMK} and upload the receipt.
                </p>
              </div>
            </button>
          </div>
        )}

        {method === 'crypto' && (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-muted-foreground">
              Send exactly <span className="font-semibold text-foreground">{PRICE_USD}</span> in
              USDT or USDC to one of the wallets below, then send us the transaction hash.
            </p>
            {CRYPTO_WALLETS.map((w) => (
              <CopyRow key={w.label} label={w.label} value={w.address} />
            ))}
            <p className="text-[11px] text-muted-foreground">
              Double-check the network before sending. Funds sent on the wrong network cannot be
              recovered.
            </p>
            <ConfirmButton
              label="I've sent the payment"
              subject="Myan Pro — Crypto payment"
            />
          </div>
        )}

        {method === 'kbz' && (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-muted-foreground">
              Transfer <span className="font-semibold text-foreground">{PRICE_MMK}</span> via
              KBZPay to the account below, then send us a screenshot of the receipt.
            </p>
            <CopyRow label="KBZPay number" value={KBZ.phone} />
            <CopyRow label="Account name" value={KBZ.name} />
            <div className="glass-tile flex items-center gap-3 rounded-2xl p-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Upload className="size-5" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Attach your KBZPay receipt screenshot in the email so we can activate Pro on your
                device.
              </p>
            </div>
            <ConfirmButton
              label="I've sent the payment"
              subject="Myan Pro — KBZPay payment"
            />
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

function ConfirmButton({ label, subject }: { label: string; subject: string }) {
  return (
    <>
      <button
        type="button"
        onClick={() => {
          window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
        }}
        className="premium-shine mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white shadow-lg transition active:scale-[0.98]"
      >
        <Check className="size-4" />
        {label}
      </button>
      <p className="text-center text-[11px] text-muted-foreground">
        We verify manually and unlock Pro within 24 hours.
      </p>
    </>
  )
}
