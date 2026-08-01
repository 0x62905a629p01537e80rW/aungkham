/**
 * All remote assets are served from jsDelivr at the `@main` ref.
 * Caching is handled by jsDelivr; the repo owner purges manually after uploads.
 */

const REPO = '0x62905a629p01537e80rW/0x62905a629p01537e80rW'
const REF = 'main'

/** `https://cdn.jsdelivr.net/gh/<repo>@main/<folder>` */
export async function cdnBase(folder: string): Promise<string> {
  return `https://cdn.jsdelivr.net/gh/${REPO}@${REF}/${folder}`
}

/** jsDelivr flat file listing. */
export async function cdnListUrl(): Promise<string> {
  return `https://data.jsdelivr.com/v1/packages/gh/${REPO}@${REF}?structure=flat`
}

/** `https://raw.githubusercontent.com/<repo>/main/<folder>` — backup origin. */
export function rawBase(folder: string): string {
  return `https://raw.githubusercontent.com/${REPO}/${REF}/${folder}`
}

/** Rewrites a jsDelivr URL to the equivalent GitHub raw URL. */
export function rawUrlFor(url: string): string | null {
  const m = url.match(/^https:\/\/cdn\.jsdelivr\.net\/gh\/([^@/]+\/[^@/]+)@([^/]+)\/(.*)$/)
  if (!m) return null
  return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`
}

/** GitHub API listing of a folder — used only when the jsDelivr listing fails. */
export function ghListUrl(folder: string): string {
  return `https://api.github.com/repos/${REPO}/contents/${folder}?ref=${REF}`
}

/**
 * Fetch through jsDelivr, falling back to GitHub raw when jsDelivr is
 * unreachable or the file is missing/stale there.
 */
export async function cdnFetch(url: string, init?: RequestInit): Promise<Response> {
  const fallback = rawUrlFor(url)
  try {
    const res = await fetch(url, init)
    if (res.ok || !fallback) return res
  } catch (err) {
    if (!fallback) throw err
  }
  return fetch(fallback!, init)
}
