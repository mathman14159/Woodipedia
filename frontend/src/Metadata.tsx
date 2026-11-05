import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Article } from './content'
import { metadataForPath } from './seo'

export function Metadata({ article }: { article?: Article }) {
  const { pathname, search } = useLocation()
  useEffect(() => {
    const origin = new URL(import.meta.env.VITE_SITE_URL || window.location.origin).origin
    const data = metadataForPath(pathname, origin)
    document.title = data.title
    for (const [key, value] of Object.entries(data.meta)) {
      const attribute = key.startsWith('og:') ? 'property' : 'name'
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
      if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.append(element) }
      element.content = key === 'robots' && new URLSearchParams(search).has('view') ? 'noindex, follow' : value
    }
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical) }
    canonical.href = data.url!
    let structured = document.head.querySelector<HTMLScriptElement>('#portfolio-schema')
    if (!structured) { structured = document.createElement('script'); structured.id = 'portfolio-schema'; structured.type = 'application/ld+json'; document.head.append(structured) }
    structured.textContent = JSON.stringify(data.schema)
  }, [article, pathname, search])
  return null
}

export { articleAtPath } from './seo'
