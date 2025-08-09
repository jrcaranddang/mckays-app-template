import { v4 as uuidv4 } from 'uuid'
import { ensureOffscreen } from '../shared/embeddings'
import { extractDomain, categorize } from '../shared/categorize'
import type { RuntimeMessage, ItemKind } from '../shared/types'

async function indexFromTab(
  tabId: number,
  url: string,
  title: string,
  kind: ItemKind,
  text: string,
) {
  await ensureOffscreen()
  const id = uuidv4()
  const domain = extractDomain(url)
  const payload = { id, url, title, domain, kind, text }
  await chrome.runtime.sendMessage({ type: 'INDEX_PAGE', payload } satisfies RuntimeMessage)
}

chrome.runtime.onInstalled.addListener(() => {
  // Nothing special on install for now
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.title) {
    try {
      // Request content script to extract text
      await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_REQUEST' })
    } catch {
      // Ignore if content script is not ready
    }
  }
})

chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  ;(async () => {
    switch (message?.type as RuntimeMessage['type'] | 'EXTRACTED_PAGE_CONTENT' | 'REQUEST_EMBEDDING') {
      case 'EXTRACTED_PAGE_CONTENT': {
        const { text, url, title } = message.payload as {
          text: string
          url: string
          title: string
        }
        if (sender.tab?.id && url && title) {
          await indexFromTab(sender.tab.id, url, title, 'open', text)
        }
        break
      }
      case 'SEARCH': {
        await ensureOffscreen()
        const results = await chrome.runtime.sendMessage(message)
        sendResponse(results)
        break
      }
    }
  })()
  // Return true to keep the message channel open for async sendResponse
  return true
})