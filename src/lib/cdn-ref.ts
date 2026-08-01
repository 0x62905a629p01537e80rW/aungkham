/**
 * jsDelivr caches `@main` for up to 12 hours, so freshly uploaded fonts and
 * templates stay invisible. Resolving the latest commit sha and using it as the
 * ref makes every new upload show up right away (and the URLs stay immutable,
 * so they cache perfectly once resolved).
 */

const REPO = '0x62905a629p01537e80rW/0x62905a629p01537e80rW'
const CACHE_KEY = 'cdn-ref'
const TTL = 10 * 60 * 1000 // 10 minutes

let inflight: Promise<string> | null = null
let memo: { ref: string; at: number } | null = null

function readCache(): { ref: string; at: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as { ref: string; at: number }) : null
  } catch {
    return null
  }
}

/** Latest commit sha of the CDN repo, falling back to `main`. */
export async function cdnRef(force = false): Promise<string> {
  const now = Date.now()
  const cached = memo ?? readCache()
  if (!force && cached && now - cached.at < TTL) return cached.ref
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/commits/main`, {
        headers: { Accept: 'application/vnd.github.sha' },
        cache: 'no-store',
      })
      const sha = (await res.text()).trim()
      if (res.ok && /^[0-9a-f]{40}$/i.test(sha)) {
        memo = { ref: sha, at: Date.now() }
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(memo))
        } catch {
          /* ignore */
        }
        return sha
      }
    } catch {
      /* offline or rate-limited */
    }
    return cached?.ref ?? 'main'
  })()

  try {
    return await inflight
  } finally {
    inflight = null
  }
}

/** `https://cdn.jsdelivr.net/gh/<repo>@<ref>/<folder>` */
export async function cdnBase(folder: string): Promise<string> {
  return `https://cdn.jsdelivr.net/gh/${REPO}@${await cdnRef()}/${folder}`
}

/** jsDelivr flat file listing for the resolved ref. */
export async function cdnListUrl(): Promise<string> {
  return `https://data.jsdelivr.com/v1/packages/gh/${REPO}@${await cdnRef()}?structure=flat`
}
