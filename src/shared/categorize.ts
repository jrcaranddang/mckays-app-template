export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

const keywordCategories: Record<string, string> = {
  docs: 'Reference',
  api: 'Reference',
  github: 'Code',
  stackoverflow: 'Q&A',
  news: 'News',
  blog: 'Blog',
  forum: 'Discussion',
  reddit: 'Discussion',
  youtube: 'Video',
  video: 'Video',
  shopping: 'Shopping',
  product: 'Shopping',
}

export function categorize(title: string, text: string, domain: string): string[] {
  const hay = `${title} ${text} ${domain}`.toLowerCase()
  const cats = new Set<string>()
  for (const [kw, cat] of Object.entries(keywordCategories)) {
    if (hay.includes(kw)) cats.add(cat)
  }
  if (domain.includes('google.com') && hay.includes('search')) cats.add('Search')
  if (cats.size === 0) cats.add('General')
  return Array.from(cats)
}