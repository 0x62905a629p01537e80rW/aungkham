const REPO = "0x62905a629p01537e80rW/0x62905a629p01537e80rW.github.io";
const REF = "main";

export function cdnUrl(path: string): string {
  return `https://cdn.jsdelivr.net/gh/${REPO}@${REF}/${path}`;
}

export async function cdnJson<T>(path: string): Promise<T> {
  const res = await fetch(cdnUrl(path), { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Failed to load ${path} (HTTP ${res.status})`);
  return (await res.json()) as T;
}
