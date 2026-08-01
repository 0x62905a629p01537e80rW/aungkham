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
