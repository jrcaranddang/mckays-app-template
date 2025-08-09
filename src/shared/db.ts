import Dexie, { Table } from 'dexie'
import type { IndexedItem } from './types'

export class TabCuratorDB extends Dexie {
  items!: Table<IndexedItem, string>

  constructor() {
    super('TabCuratorDB')
    this.version(1).stores({
      items: 'id, url, title, domain, kind, updatedAt, lastVisitedAt',
    })
  }
}

export const db = new TabCuratorDB()