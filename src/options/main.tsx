import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { cosineSimilarity } from '../shared/embeddings'
import type { IndexedItem } from '../shared/types'

function Row({ item }: { item: IndexedItem & { score?: number } }) {
  return (
    <div style={{ padding: 12, borderBottom: '1px solid #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <a href={item.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
          {item.title}
        </a>
        {typeof (item as any).score === 'number' && (
          <span style={{ color: '#999' }}>{(item as any).score.toFixed(3)}</span>
        )}
      </div>
      <div style={{ color: '#666', fontSize: 12 }}>{item.domain} • {item.categories.join(', ')}</div>
      <div style={{ color: '#555', marginTop: 6, fontSize: 13 }}>{item.textSnippet.slice(0, 180)}{item.textSnippet.length > 180 ? '…' : ''}</div>
    </div>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<IndexedItem[]>([])
  const [results, setResults] = useState<(IndexedItem & { score: number })[]>([])

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'SEARCH', payload: { query: '' } }, (res) => {
      const list: IndexedItem[] = res?.results ?? []
      setItems(list)
    })
    chrome.storage.local.get(['lastQuickResults'], (res) => {
      const lqr = res.lastQuickResults
      if (lqr?.query) {
        setQuery(lqr.query)
      }
    })
  }, [])

  const runSearch = async () => {
    const res = await chrome.runtime.sendMessage({ type: 'SEARCH', payload: { query } })
    const list: IndexedItem[] = res?.results ?? []
    const emb: number[] = res?.queryEmbedding ?? []
    const ranked = list
      .map((it) => ({ ...it, score: cosineSimilarity(it.embedding ?? [], emb) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
    setResults(ranked)
  }

  useEffect(() => {
    if (query) runSearch()
    else setResults([])
  }, [query])

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', gap: 8 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tabs, archives, history"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <button onClick={runSearch} style={{ padding: '10px 16px' }}>Search</button>
      </div>
      <div style={{ overflow: 'auto' }}>
        {(results.length ? results : items).map((item) => (
          <Row key={item.id} item={item as any} />
        ))}
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)