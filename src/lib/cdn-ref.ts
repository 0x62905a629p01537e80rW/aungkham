/**
 * All remote assets are served from jsDelivr at the `@main` ref.
 * Caching is handled by jsDelivr; the repo owner purges manually after uploads.
 */

const REPO = '0x62905a629p01537e80rW/0x62905a629p01537e80rW.github.io'
const REF = 'main'

/** `https://cdn.jsdelivr.net/gh/<repo>@main/<folder>` */
export async function cdnBase(folder: string): Promise<string> {
  return `https://cdn.jsdelivr.net/gh/${REPO}@${REF}/${folder}`
}

/** Raw GitHub base — always current, unlike jsDelivr's cached branch ref. */
export function rawBase(folder: string): string {
  return `https://raw.githubusercontent.com/${REPO}/${REF}/${folder}`
}

/** GitHub tree listing (single request, recursive, never stale). */
export function ghTreeUrl(): string {
  return `https://api.github.com/repos/${REPO}/git/trees/${REF}?recursive=1`
}

/** jsDelivr flat file listing. */
export async function cdnListUrl(): Promise<string> {
  return `https://data.jsdelivr.com/v1/packages/gh/${REPO}@${REF}?structure=flat`
}

/** jsDelivr folder page — used to discover files when the data API is stale. */
export function cdnFolderUrl(folder: string): string {
  return `https://cdn.jsdelivr.net/gh/${REPO}@${REF}/${folder}/`
}

/** Fetch through jsDelivr. */
export async function cdnFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, init)
}

/**
 * Appends a unique query param so metadata requests (listings, check.json)
 * skip both the browser HTTP cache and any stale intermediary copy.
 * Use for small JSON/HTML metadata only — never for asset binaries.
 */
export function bust(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`
}

/** Request init that defeats the browser cache. */
export const noStore: RequestInit = { cache: 'no-store' }
