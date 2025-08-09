import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

function Popup() {
  const [query, setQuery] = useState('')
  const [count, setCount] = useState({ open: 0, archived: 0 })

  useEffect(() => {
    chrome.storage.local.get(['counts'], (res) => {
      setCount(res.counts ?? { open: 0, archived: 0 })
    })
  }, [])

  const openManager = () => chrome.runtime.openOptionsPage()

  const runQuickSearch = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'SEARCH', payload: { query, limit: 10 } })
    const items = response?.results ?? []
    // Store last quick results for options page to pick up
    await chrome.storage.local.set({ lastQuickResults: { query, items } })
    openManager()
  }

  return (
    <div style={{ padding: 12, width: 320 }}>
      <h3 style={{ margin: '4px 0 8px' }}>Tab Curator</h3>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tabs, archives, history"
        style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={runQuickSearch} style={{ flex: 1, padding: 8 }}>Search</button>
        <button onClick={openManager} style={{ padding: 8 }}>Open Manager</button>
      </div>
      <div style={{ marginTop: 8, color: '#666' }}>Open: {count.open} • Archived: {count.archived}</div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Popup />)