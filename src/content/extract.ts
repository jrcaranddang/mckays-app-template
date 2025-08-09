import { Readability } from '@mozilla/readability'

function getReadableText(): string {
  try {
    const doc = document.cloneNode(true) as Document
    const reader = new Readability(doc)
    const article = reader.parse()
    if (article?.textContent) return article.textContent
  } catch {}
  const text = document.body?.innerText || ''
  return text.trim()
}

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message?.type === 'EXTRACT_REQUEST') {
    const text = getReadableText()
    chrome.runtime.sendMessage({
      type: 'EXTRACTED_PAGE_CONTENT',
      payload: { text, url: location.href, title: document.title },
    })
  }
})