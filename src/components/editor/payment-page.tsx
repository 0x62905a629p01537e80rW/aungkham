import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ClipboardPaste,
  Coins,
  Copy,
  Loader2,
  LogOut,
  Smartphone,
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { GlassTabs } from '@/components/ui/glass-tabs'
import { pricingFromDoc, usePricing } from '@/lib/pricing'

type CryptoNet = { key: string; label: string; address: string }

type PaySettings = {
  phone: string
  name: string
  priceMmk: string
  usdtPrice: string
  nets: CryptoNet[]
}


function CopyRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="glass-tile rounded-2xl px-3.5 py-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className={`min-w-0 flex-1 break-all font-mono leading-snug ${valueClassName || 'text-[12px]'}`}>{value}</p>
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

function GoogleMark({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.5 13.2l7.8 6.1C12.2 13.3 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.4-4.5 7l7.2 5.6c4.2-3.9 6.9-9.7 6.9-17.1z" />
      <path fill="#FBBC05" d="M10.3 28.7a14.6 14.6 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.7 2.3-8.7 2.3-6.4 0-11.8-3.8-13.7-9.2l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  )
}

export function PaymentPage({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, loading, isPro, signIn, signOutUser } = useAuth()
  const [signingIn, setSigningIn] = useState(false)
  const [settings, setSettings] = useState<PaySettings | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [method, setMethod] = useState<'kbzpay' | 'usdt'>('kbzpay')
  const [net, setNet] = useState('')
  const [txId, setTxId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pricing = usePricing(open)

  // Fetch KBZPay + crypto details from Firestore (payment_settings collection).
  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      setSettingsError(null)
      const { getDb } = await import('@/lib/firebase')
      const { collection, getDocs } = await import('firebase/firestore')
      const snap = await getDocs(collection(getDb(), 'payment_settings'))
      if (cancelled) return
      if (snap.empty) {
        setSettingsError('Payment details are not configured yet.')
        return
      }
      const d = (snap.docs[0].data() ?? {}) as Record<string, string>
      void pricingFromDoc(d)
      const nets: CryptoNet[] = [
        { key: 'trc20', label: 'USDT · TRC20 (Tron)', address: d.usdt_trx_address ?? '' },
        { key: 'bep20', label: 'USDT · BEP20 (BSC)', address: d.usdt_bep20_address ?? '' },
        { key: 'erc20', label: 'USDT · ERC20 (Ethereum)', address: d.usdt_erc20_address ?? '' },
        {
          key: 'sol',
          label: 'USDT · Solana',
          address: d.usdt_sol_address ?? d.usdt_sol_addresa ?? '',
        },
      ].filter((n) => n.address.trim().length > 0)
      setSettings({
        phone: d.kpay_number ?? '',
        name: d.kpay_name ?? '',
        priceMmk: d.price_mmk == null ? '' : String(d.price_mmk),
        usdtPrice: d.usdt_price == null ? '' : String(d.usdt_price),
        nets,
      })
      if (nets.length) setNet((prev) => prev || nets[0].key)
    })().catch((err) => {
      console.log('[payment settings failed]', err)
      if (!cancelled) setSettingsError('Could not load payment details. Please try again.')
    })
    return () => {
      cancelled = true
    }
  }, [open])

  const activeNet = useMemo(
    () => settings?.nets.find((n) => n.key === net) ?? settings?.nets[0] ?? null,
    [settings, net],
  )

  async function handleSignIn() {
    setSigningIn(true)
    setError(null)
    try {
      await signIn()
    } catch (err) {
      console.log('[sign in failed]', err)
      setError('Google sign-in failed. Please try again.')
    } finally {
      setSigningIn(false)
    }
  }

  async function handleSubmit() {
    if (!user || !txId.trim() || !senderInfo.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const { getDb } = await import('@/lib/firebase')
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
      await addDoc(collection(getDb(), 'transactions'), {
        userId: user.uid,
        userEmail: user.email,
        txId: txId.trim(),
        senderInfo: senderInfo.trim(),
        method: method === 'usdt' ? 'USDT' : 'KBZPay',
        network: method === 'usdt' ? (activeNet?.label ?? '') : '',
        toAddress: method === 'usdt' ? (activeNet?.address ?? '') : '',
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setSubmitted(true)
    } catch (err) {
      console.log('[transaction submit failed]', err)
      setError('Could not submit. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }


  if (!open || typeof document === 'undefined') return null

  const canSubmit = !!user && txId.trim().length > 0 && senderInfo.trim().length > 0 && !submitting

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-background text-foreground animate-fade-in">
      <div
        className="flex items-center gap-3 px-4 pb-2 pt-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={onClose}
          className="grid size-9 place-items-center rounded-full transition active:scale-95"
        >
          <ArrowLeft className="size-6" />
        </button>
        <h2 className="text-xl font-semibold">Checkout</h2>
        {user && (
          <button
            type="button"
            onClick={() => signOutUser()}
            className="ml-auto flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground transition active:scale-95"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        )}
      </div>

      <div className="px-4 pb-14">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary/5 p-4 text-center">
          {pricing.promoLabel && (
            <span className="absolute left-0 top-0 rounded-br-2xl bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] px-2 py-0.5 text-[10px] font-extrabold text-white">
              {pricing.promoLabel}
            </span>
          )}
          <p className="text-sm font-semibold">Myan Pro · Lifetime</p>
          {pricing.originalMmk && (
            <p className="text-[11px] text-muted-foreground line-through">{pricing.originalMmk}</p>
          )}
          <p className="mt-0.5 text-2xl font-extrabold tracking-tight">
            {pricing.priceMmk}
            {pricing.priceUsd && (
              <span className="ml-1 text-[13px] font-bold text-muted-foreground">
                OR {pricing.priceUsd}
              </span>
            )}
          </p>
          <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <BadgeCheck className="size-3.5 text-primary" />
            One-time payment · limited-time offer
          </p>
        </div>

        {isPro && (
          <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-center">
            <BadgeCheck className="mx-auto size-6 text-primary" />
            <p className="mt-1 text-sm font-bold">Pro is active on this account</p>
            <p className="text-[11px] text-muted-foreground">
              All premium features are unlocked. Thank you!
            </p>
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : !user ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-semibold">Sign in to continue</p>
            <p className="text-[12px] text-muted-foreground">
              We need your account so we can unlock Pro for you after verifying your payment.
            </p>
            <button
              type="button"
              onClick={handleSignIn}
              disabled={signingIn}
              className="glass-tile flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition active:scale-[0.98] disabled:opacity-60"
            >
              {signingIn ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark className="size-4" />}
              Sign in with Google
            </button>
            {error && <p className="text-center text-[11px] text-destructive">{error}</p>}
          </div>
        ) : submitted ? (
          <div className="mt-6 space-y-2 rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center">
            <Check className="mx-auto size-7 text-primary" />
            <p className="text-sm font-bold">Payment submitted</p>
            <p className="text-[11px] text-muted-foreground">
              We verify manually and unlock Pro within 24 hours. Pro turns on automatically here —
              no need to reinstall.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <GlassTabs
              items={[
                { key: 'kbzpay', label: 'KBZPay' },
                { key: 'usdt', label: 'USDT Crypto' },
              ]}
              value={method}
              onChange={(k) => setMethod(k as 'kbzpay' | 'usdt')}
            />

            <div className="glass-tile flex items-center gap-3 rounded-2xl p-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                {method === 'usdt' ? <Coins className="size-5" /> : <Smartphone className="size-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {method === 'usdt' ? 'USDT stablecoin payment' : 'Myanmar manual payment'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {method === 'usdt'
                    ? `Send ${pricing.priceUsd || settings?.usdtPrice || ''} in USDT, then submit your transaction hash.`
                    : `KBZPay transfer — send ${pricing.priceMmk}, then submit your transaction details.`}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user.email}</span>
            </p>

            {/* Payment details — shown before asking for transaction info */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-bold text-primary">Please transfer to:</p>
              {settingsError && (
                <p className="mt-1 text-[12px] text-destructive">{settingsError}</p>
              )}
              {!settings && !settingsError ? (
                <div className="mt-2 flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading payment details…
                </div>
              ) : settings && method === 'kbzpay' ? (
                <div className="mt-2 space-y-2">
                  {settings.phone && (
                    <CopyRow
                      label="KBZPay number"
                      value={settings.phone}
                      valueClassName="text-[14px] font-semibold"
                    />
                  )}
                  {settings.name && (
                    <CopyRow
                      label="Account name"
                      value={settings.name}
                      valueClassName="text-[14px] font-semibold"
                    />
                  )}
                </div>
              ) : settings ? (
                settings.nets.length === 0 ? (
                  <p className="mt-1 text-[12px] text-destructive">
                    Crypto payment is not configured yet.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {settings.nets.map((n) => (
                        <button
                          key={n.key}
                          type="button"
                          onClick={() => setNet(n.key)}
                          className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition active:scale-95 ${
                            activeNet?.key === n.key
                              ? 'bg-primary text-primary-foreground'
                              : 'glass-tile text-muted-foreground'
                          }`}
                        >
                          {n.label.replace('USDT · ', '')}
                        </button>
                      ))}
                    </div>
                    {activeNet && (
                      <CopyRow
                        label={activeNet.label}
                        value={activeNet.address}
                        valueClassName="text-[12px] font-semibold"
                      />
                    )}
                    {settings.usdtPrice && (
                      <CopyRow label="Amount" value={settings.usdtPrice} valueClassName="text-[14px] font-semibold" />
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Send only USDT on the selected network. Wrong-network transfers cannot be
                      recovered.
                    </p>
                  </div>
                )
              ) : null}
            </div>

            {/* Transaction input fields — only shown after payment details are available */}
            {settings && !settingsError && (method === 'kbzpay' || settings.nets.length > 0) && (
              <div className="space-y-2 pt-1">
                <label className="block">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {method === 'usdt'
                      ? 'Transaction hash (TxID) *'
                      : 'KBZPay Transaction ID (Last 6 digits) *'}
                  </span>
                  <input
                    value={txId}
                    onChange={(e) => setTxId(e.target.value)}
                    inputMode={method === 'usdt' ? 'text' : 'numeric'}
                    maxLength={method === 'usdt' ? 120 : 12}
                    required
                    placeholder={method === 'usdt' ? 'e.g. 0x9f3c…' : 'e.g. 482913'}
                    className="glass-tile mt-1 h-11 w-full rounded-2xl px-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>

                <label className="block">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {method === 'usdt'
                      ? 'Your sending wallet address *'
                      : 'Sender Name or Phone Number *'}
                  </span>
                  <input
                    value={senderInfo}
                    onChange={(e) => setSenderInfo(e.target.value)}
                    maxLength={120}
                    required
                    placeholder={
                      method === 'usdt' ? 'e.g. TQ5x…' : 'e.g. Aung Aung / 09-XXX-XXX-XXX'
                    }
                    className="glass-tile mt-1 h-11 w-full rounded-2xl px-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>

                {error && <p className="text-[11px] text-destructive">{error}</p>}

                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                  className="premium-shine mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  I've sent the payment
                </button>
                <p className="text-center text-[11px] text-muted-foreground">
                  We verify manually and unlock Pro within 24 hours.
                </p>
              </div>
            )}
          </div>

        )}
      </div>
    </div>,
    document.body,
  )
}
