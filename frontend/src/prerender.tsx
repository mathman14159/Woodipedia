import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App'
import { articles, slugFromTitle } from './content'
import site from './site.json'

export { metadataForPath } from './seo'
export const paths = [...new Set([
  ...Object.keys(site.pages), '/search',
  ...articles.flatMap((article) => [
    ...(article.route ? [article.route] : []),
    ...[article.slug, slugFromTitle(article.title), ...article.aliases.map(slugFromTitle)].map((slug) => `/wiki/${encodeURIComponent(slug)}`),
  ]),
])]

export function render(path: string) {
  return renderToString(<StaticRouter location={path}><App /></StaticRouter>)
}
