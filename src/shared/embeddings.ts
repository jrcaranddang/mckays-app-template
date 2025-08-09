import type { SearchResult, IndexedItem } from './types'

export async function ensureOffscreen(): Promise<void> {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html')
  const has = await chrome.offscreen.hasDocument?.()
  if (has) return
  await chrome.offscreen.createDocument?.({
    url: offscreenUrl,
    reasons: ['DOM_PARSER'],
    justification: 'Run TFJS and Dexie in a DOM context for embeddings and storage',
  })
}

export async function embed(text: string): Promise<number[]> {
  await ensureOffscreen()
  const response = await chrome.runtime.sendMessage({
    type: 'REQUEST_EMBEDDING',
    payload: { text },
  })
  return response?.embedding ?? []
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    const va = a[i]
    const vb = b[i]
    dot += va * vb
    na += va * va
    nb += vb * vb
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export function rankBySimilarity(
  items: IndexedItem[],
  queryEmbedding: number[],
  limit = 20,
): SearchResult[] {
  return items
    .map((item) => ({ ...item, score: cosineSimilarity(item.embedding ?? [], queryEmbedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}