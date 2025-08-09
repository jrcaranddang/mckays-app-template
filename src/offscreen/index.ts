import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-cpu'
import * as use from '@tensorflow-models/universal-sentence-encoder'
import { db } from '../shared/db'
import { categorize } from '../shared/categorize'
import type { IndexedItem, RuntimeMessage } from '../shared/types'

let model: use.UniversalSentenceEncoder | null = null
let initializing = false

async function loadModel() {
  if (model || initializing) return
  initializing = true
  await tf.setBackend('cpu')
  model = await use.load()
  initializing = false
}

async function embed(text: string): Promise<number[]> {
  await loadModel()
  const m = model
  if (!m) return []
  const embeddings = await m.embed([text])
  const arr = await embeddings.array()
  embeddings.dispose()
  return arr[0] as number[]
}

async function upsertItem(partial: Omit<IndexedItem, 'createdAt' | 'updatedAt'>) {
  const now = Date.now()
  const existing = await db.items.get(partial.id)
  const full: IndexedItem = existing
    ? { ...existing, ...partial, updatedAt: now }
    : { ...partial, createdAt: now, updatedAt: now }
  await db.items.put(full)
}

async function handleIndexPage(message: Extract<RuntimeMessage, { type: 'INDEX_PAGE' }>) {
  const { id, url, title, domain, kind, text } = message.payload
  const categories = categorize(title, text.slice(0, 4000), domain)
  const textSnippet = text.slice(0, 2000)
  const embedding = await embed(`${title}\n${textSnippet}`)
  await upsertItem({ id, url, title, domain, kind, textSnippet, categories, embedding })
}

async function handleSearch(query: string, limit = 20): Promise<{ results: IndexedItem[]; queryEmbedding: number[] }> {
  const items = await db.items.toArray()
  const queryEmbedding = await embed(query)
  // We return items and query embedding; background/popup can rank
  return { results: items, queryEmbedding }
}

chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
  ;(async () => {
    switch (message?.type as RuntimeMessage['type'] | 'REQUEST_EMBEDDING') {
      case 'REQUEST_EMBEDDING': {
        const text = message.payload?.text ?? ''
        const embedding = await embed(text)
        sendResponse({ embedding })
        break
      }
      case 'INDEX_PAGE': {
        await handleIndexPage(message)
        sendResponse({ ok: true })
        break
      }
      case 'SEARCH': {
        const { query, limit } = message.payload ?? {}
        const { results, queryEmbedding } = await handleSearch(query ?? '', limit ?? 20)
        sendResponse({ results, queryEmbedding })
        break
      }
    }
  })()
  return true
})

// Notify ready
chrome.runtime.sendMessage({ type: 'OFFSCREEN_READY' })