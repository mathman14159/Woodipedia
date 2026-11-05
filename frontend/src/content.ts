import YAML from 'yaml'
import GithubSlugger from 'github-slugger'

export type Article = {
  slug: string
  title: string
  description: string
  type: string
  infobox: Record<string, string>
  image?: string
  imageCaption?: string
  imageWidth?: number
  imageHeight?: number
  route?: string
  project?: {
    order: number
    featured?: boolean
    name: string
    area: string
    technologies: string[]
    contribution: string
    outcome?: string
    repository?: string
    demo?: string
  }
  categories: string[]
  aliases: string[]
  body: string
  headings: { id: string; title: string; level: number }[]
}

const files = import.meta.glob('./content/articles/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

export const slugFromTitle = (title: string) => title.trim().replace(/\s+/g, '_')
export const articleUrl = (title: string) => getArticle(title)?.route || `/wiki/${encodeURIComponent(slugFromTitle(title))}`
const normalize = (value: string) => decodeURIComponent(value).replace(/_/g, ' ').trim().toLocaleLowerCase()

function parseArticle(path: string, raw: string): Article {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!match) throw new Error(`Article ${path} needs YAML frontmatter`)
  const metadata = YAML.parse(match[1]) || {}
  const body = raw.slice(match[0].length)
  const slugger = new GithubSlugger()
  const headings = [...body.matchAll(/^(#{2,3})\s+(.+)$/gm)].map((found) => {
    const title = found[2].replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label || target).replace(/[*_`]/g, '')
    return { id: slugger.slug(title), title, level: found[1].length }
  })
  return {
    slug: path.split('/').pop()!.replace(/\.md$/, ''),
    title: String(metadata.title || path),
    description: String(metadata.description || ''),
    type: String(metadata.type || 'Article'),
    infobox: metadata.infobox || {},
    image: metadata.image,
    imageCaption: metadata.imageCaption,
    imageWidth: metadata.imageWidth,
    imageHeight: metadata.imageHeight,
    route: metadata.route,
    project: metadata.project,
    categories: metadata.categories || [],
    aliases: metadata.aliases || [],
    body,
    headings,
  }
}

export const articles = Object.entries(files).map(([path, raw]) => parseArticle(path, raw))
export const projects = articles.filter((article) => article.project).sort((a, b) => a.project!.order - b.project!.order)
const registry = new Map<string, Article>()
for (const article of articles) {
  registry.set(normalize(article.slug), article)
  registry.set(normalize(article.title), article)
  for (const alias of article.aliases) registry.set(normalize(alias), article)
}
export const getArticle = (slug: string) => {
  try { return registry.get(normalize(slug)) } catch { return undefined }
}

export function prepareWikiLinks(markdown: string): string {
  return markdown.replace(/\[\[([^\]]+)\]\]/g, (_, inner: string) => {
    const [rawTarget, ...labels] = inner.split('|')
    const target = rawTarget.trim()
    const label = (labels.join('|') || target.replace(/^wikipedia:/i, '')).trim()
    if (/^wikipedia:/i.test(target)) {
      const page = target.slice('wikipedia:'.length).trim()
      return `[${label}](https://en.wikipedia.org/wiki/${encodeURIComponent(slugFromTitle(page))})`
    }
    return `[${label}](${articleUrl(target)})`
  })
}
