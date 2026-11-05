import { createServer, loadEnv } from 'vite'
import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Use the existing React routes at build time; hosting remains fully static.
const routerAliases = await Promise.all(['react-router-dom', 'react-router', 'react-router/dom'].map(async (name) => {
  const packageName = name === 'react-router/dom' ? 'react-router' : name
  const manifestPath = fileURLToPath(import.meta.resolve(`${packageName}/package.json`))
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const entry = manifest.exports[name === 'react-router/dom' ? './dom' : '.'].import.default
  return { find: new RegExp(`^${name}$`), replacement: resolve(dirname(manifestPath), entry) }
}))
const server = await createServer({
  server: { middlewareMode: true }, appType: 'custom',
  // Resolve ESM entries explicitly, including on Node versions without module-sync.
  resolve: { alias: routerAliases },
})
const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
try {
  const { paths, render, metadataForPath } = await server.ssrLoadModule('/src/prerender.tsx')
  const profile = JSON.parse(await readFile('src/site.json', 'utf8'))
  if (profile.resume) {
    if (!profile.resume.startsWith('/') || !profile.resume.endsWith('.pdf') || profile.resume.includes('..')) throw new Error('Resume must be a local PDF path in public/.')
    await access(resolve('public', profile.resume.slice(1)))
  }
  const env = loadEnv('production', process.cwd(), 'VITE_')
  const configured = process.env.VITE_SITE_URL || env.VITE_SITE_URL
  let origin
  if (configured) {
    const url = new URL(configured)
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('VITE_SITE_URL must be an HTTP(S) origin.')
    origin = url.origin
  }
  const template = (await readFile('dist/index.html', 'utf8')).replace(/<meta (?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[^>]*\/>\s*/g, '')
  for (const path of paths) {
    const data = metadataForPath(path, origin)
    const metadata = Object.entries(data.meta).map(([key, value]) => `<meta ${key.startsWith('og:') ? 'property' : 'name'}="${key}" content="${escapeHtml(value)}" />`).join('\n    ')
    const head = `<title>${escapeHtml(data.title)}</title>\n    ${metadata}${data.url ? `\n    <link rel="canonical" href="${escapeHtml(data.url)}" />` : ''}\n    <script id="portfolio-schema" type="application/ld+json">${JSON.stringify(data.schema).replaceAll('<', '\\u003c')}</script>`
    const html = template.replace(/<title>[\s\S]*?<\/title>/, head).replace('<div id="root"></div>', `<div id="root">${render(path)}</div>`)
    const target = resolve('dist', `.${decodeURIComponent(path)}`, 'index.html')
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, html)
    // Directory indexes support static hosts; flat HTML also supports Vite's
    // extensionless preview fallback and hosts with clean-URL resolution.
    if (path !== '/') await writeFile(resolve('dist', `.${decodeURIComponent(path)}.html`), html)
  }
  if (origin) {
    const canonicalPaths = [...new Set(paths.filter((path) => path !== '/search').map((path) => metadataForPath(path, origin).url))]
    await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${canonicalPaths.map((url) => `<url><loc>${escapeHtml(url)}</loc></url>`).join('')}</urlset>\n`)
    await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`)
  }
  console.log(`Prerendered ${paths.length} routes with page content and sharing metadata.${origin ? ' Sitemap generated.' : ' Set VITE_SITE_URL for a production sitemap and absolute canonical URLs.'}`)
} finally {
  await server.close()
}
