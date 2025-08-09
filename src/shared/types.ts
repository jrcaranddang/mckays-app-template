export type ItemKind = 'open' | 'archived' | 'history'

export interface IndexedItem {
  id: string
  url: string
  title: string
  domain: string
  kind: ItemKind
  textSnippet: string
  categories: string[]
  embedding?: number[]
  createdAt: number
  updatedAt: number
  lastVisitedAt?: number
}

export interface SearchResult extends IndexedItem {
  score: number
}

export type RuntimeMessage =
  | { type: 'OFFSCREEN_READY' }
  | {
      type: 'INDEX_PAGE'
      payload: {
        id: string
        url: string
        title: string
        domain: string
        kind: ItemKind
        text: string
      }
    }
  | { type: 'ARCHIVE_ITEM'; payload: { id: string } }
  | { type: 'RESTORE_ITEM'; payload: { id: string } }
  | {
      type: 'SEARCH'
      payload: { query: string; limit?: number; includeHistory?: boolean }
    }
  | { type: 'SEARCH_RESULT'; payload: { results: SearchResult[] } }