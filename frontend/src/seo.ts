import { articleUrl, articles, getArticle, projects } from './content'
import site from './site.json'

export function articleAtPath(pathname: string) {
  pathname = pathname.replace(/\/+$/, '') || '/'
  const wiki = pathname.match(/^\/wiki\/(.+)$/)
  return wiki ? getArticle(wiki[1]) : articles.find((article) => article.route === pathname)
}

export function metadataForPath(pathname: string, origin?: string) {
  pathname = pathname.replace(/\/+$/, '') || '/'
  const article = articleAtPath(pathname)
  const page = site.pages[pathname as keyof typeof site.pages]
  const title = article ? `${article.title} — Quentin Wood` : page?.title || (pathname === '/search' ? 'Search — Woodpedia' : 'Page not found — Woodpedia')
  const description = article?.description || page?.description || 'Search the projects and personal articles of Quentin Wood.'
  const url = origin ? `${origin}${article ? articleUrl(article.title) : pathname}` : undefined
  const absolute = (path: string) => origin ? `${origin}${path}` : path
  const person = {
    '@type': 'Person', '@id': absolute('/#person'), name: site.name, url: absolute('/'), description: site.headline,
    affiliation: { '@type': 'CollegeOrUniversity', name: site.school },
    sameAs: [site.github, site.linkedin].filter(Boolean), ...(site.email ? { email: site.email } : {}),
  }
  const schema = { '@context': 'https://schema.org', '@graph': [person, {
    '@type': 'WebSite', '@id': absolute('/#website'), name: 'Woodpedia', url: absolute('/'), author: { '@id': absolute('/#person') },
  }, {
    '@type': article?.project ? 'CreativeWork' : 'WebPage', name: title, description, ...(url ? { url } : {}), author: { '@id': absolute('/#person') },
    ...(pathname === '/projects' ? { mainEntity: { '@type': 'ItemList', itemListElement: projects.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.project!.name, url: absolute(articleUrl(item.title)) })) } } : {}),
  }] }
  const meta: Record<string, string> = {
    description, 'og:title': title, 'og:description': description,
    'og:type': article?.project ? 'article' : 'website', 'og:site_name': 'Woodpedia · Quentin Wood',
    ...(url ? { 'og:url': url } : {}),
    'twitter:card': 'summary', 'twitter:title': title, 'twitter:description': description,
    robots: (!article && !page) ? 'noindex, follow' : 'index, follow',
  }
  return { title, meta, url, schema }
}
