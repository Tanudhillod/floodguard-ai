const API_BASE = process.env.NEXT_PUBLIC_FLOODGAURD_API_URL || 'http://localhost:8000'

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`API GET ${path} failed: ${res.status}`)
  return res.json()
}

export async function apiPost<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST' })
  if (!res.ok) throw new Error(`API POST ${path} failed: ${res.status}`)
  return res.json()
}