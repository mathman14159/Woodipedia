import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { ChevronDown, ChevronRight, ExternalLink, Menu, Search } from 'lucide-react'
import { Article, articleUrl, articles, getArticle, prepareWikiLinks } from './content'
import { ContactPage, HomePage, mainLinks, pageHeadings, ProjectsPage, ResumePage } from './Portfolio'
import { articleAtPath, Metadata } from './Metadata'

type Preferences = { text: 'small' | 'standard' | 'large'; width: 'standard' | 'wide'; theme: 'light' | 'dark' }
const defaults: Preferences = { text: 'standard', width: 'standard', theme: 'light' }

function getPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem('woodpedia-preferences') || '{}')
    return {
      text: ['small', 'standard', 'large'].includes(saved.text) ? saved.text : defaults.text,
      width: ['standard', 'wide'].includes(saved.width) ? saved.width : defaults.width,
      theme: ['light', 'dark'].includes(saved.theme) ? saved.theme : defaults.theme,
    }
  }
  catch { return defaults }
}

function WikiHeader() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const menuButton = useRef<HTMLButtonElement>(null)
  const menuContainer = useRef<HTMLDivElement>(null)
  useEffect(() => { setFocused(false); setMenuOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!menuOpen) return
    function dismiss(event: KeyboardEvent) { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus() } }
    function outside(event: PointerEvent) { if (!menuContainer.current?.contains(event.target as Node)) setMenuOpen(false) }
    document.addEventListener('keydown', dismiss)
    document.addEventListener('pointerdown', outside)
    return () => { document.removeEventListener('keydown', dismiss); document.removeEventListener('pointerdown', outside) }
  }, [menuOpen])
  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase()
    return term ? articles.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(term)).slice(0, 5) : []
  }, [query])
  function search(event: FormEvent) {
    event.preventDefault()
    const value = query.trim()
    if (value) navigate(`/search?q=${encodeURIComponent(value)}`)
    setFocused(false)
  }
  return <header className="site-header">
    <div className="header-inner">
      <div className="brand-group" ref={menuContainer}>
        <button ref={menuButton} className="icon-button menu-button" aria-label="Toggle main menu" aria-expanded={menuOpen} aria-controls="main-menu" onClick={() => setMenuOpen(!menuOpen)}><Menu size={21} /></button>
        <Link className="brand" to="/" aria-label="Woodpedia home">
          <span className="brand-mark" aria-hidden="true">W</span>
          <span className="brand-words"><strong>WOODPEDIA</strong><small>The portfolio of Quentin Wood</small></span>
        </Link>
        {menuOpen && <nav id="main-menu" className="header-menu" aria-label="Main menu">
          <strong>Main menu</strong>
          {mainLinks.map(([path, label]) => <NavLink key={path} to={path} end>{label}</NavLink>)}
          <Link to="/wiki/Quentin_Wood">Original biography</Link>
        </nav>}
      </div>
      <form className="search-form" onSubmit={search} role="search" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }} onKeyDown={(event) => { if (event.key === 'Escape') setFocused(false) }}>
        <Search size={17} aria-hidden="true" />
        <input type="search" aria-label="Search Woodpedia" placeholder="Search Woodpedia" value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setFocused(true)} />
        <button type="submit">Search</button>
        {focused && suggestions.length > 0 && <div className="suggestions" aria-label="Suggested articles">
          {suggestions.map((item) => <Link key={item.slug} to={articleUrl(item.title)} onClick={() => { setQuery(''); setFocused(false) }}><strong>{item.title}</strong><span>{item.description}</span></Link>)}
        </div>}
      </form>
      <nav className="header-links" aria-label="Primary navigation">{mainLinks.map(([path, label]) => <NavLink key={path} to={path} end>{label}</NavLink>)}</nav>
    </div>
  </header>
}

function Contents({ headings }: { headings: Article['headings'] }) {
  const [open, setOpen] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [active, setActive] = useState('')
  useEffect(() => {
    setActive('')
    const elements = headings.map((heading) => document.getElementById(heading.id)).filter(Boolean) as HTMLElement[]
    const update = () => {
      let current = ''
      for (const element of elements) if (element.getBoundingClientRect().top < 150) current = element.id
      setActive(current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [headings])
  return <aside className="contents-sidebar" aria-label="Contents">
    <div className="sidebar-heading"><strong>Contents</strong><button onClick={() => setOpen(!open)}>{open ? 'hide' : 'show'}</button></div>
    {open && <nav>
      <a className={!active ? 'active' : ''} href="#article-top">(Top)</a>
      {headings.map((heading, index) => {
        const parent = headings.slice(0, index).reverse().find((item) => item.level === 2)
        const children = heading.level === 2 && headings[index + 1]?.level === 3
        if (heading.level === 3 && parent && expanded[parent.id] === false) return null
        return <div className={`toc-row level-${heading.level}`} key={heading.id}>
          {children && <button aria-label={`Toggle ${heading.title} subsections`} aria-expanded={expanded[heading.id] !== false} onClick={() => setExpanded({ ...expanded, [heading.id]: expanded[heading.id] === false })}>{expanded[heading.id] === false ? <ChevronRight size={13} /> : <ChevronDown size={13} />}</button>}
          <a className={active === heading.id ? 'active' : ''} href={`#${heading.id}`}>{heading.title}</a>
        </div>
      })}
    </nav>}
  </aside>
}

function Appearance({ preferences, update }: { preferences: Preferences; update: (patch: Partial<Preferences>) => void }) {
  const [open, setOpen] = useState(true)
  return <aside className="appearance-sidebar" aria-label="Appearance">
    <div className="sidebar-heading"><strong>Appearance</strong><button onClick={() => setOpen(!open)}>{open ? 'hide' : 'show'}</button></div>
    {open && <div className="appearance-controls">
      <fieldset><legend>Text</legend>{(['small', 'standard', 'large'] as const).map((value) => <label key={value}><input type="radio" name="text" checked={preferences.text === value} onChange={() => update({ text: value })} />{value[0].toUpperCase() + value.slice(1)}</label>)}</fieldset>
      <fieldset><legend>Width</legend>{(['standard', 'wide'] as const).map((value) => <label key={value}><input type="radio" name="width" checked={preferences.width === value} onChange={() => update({ width: value })} />{value[0].toUpperCase() + value.slice(1)}</label>)}</fieldset>
      <fieldset><legend>Color</legend>{(['light', 'dark'] as const).map((value) => <label key={value}><input type="radio" name="theme" checked={preferences.theme === value} onChange={() => update({ theme: value })} />{value[0].toUpperCase() + value.slice(1)}</label>)}</fieldset>
    </div>}
  </aside>
}

function ArticleTabs({ article }: { article?: Article }) {
  const base = article ? articleUrl(article.title) : ''
  return <div className="article-tabs">
    <div className="tab-group"><Link className="selected" to={base}>{article?.project ? 'Case study' : 'Article'}</Link></div>
    <div className="tab-group"><Link to="/projects">Projects</Link><Link to="/contact">Contact</Link></div>
  </div>
}

function WikiAnchor({ href = '', children, ...props }: React.ComponentProps<'a'>) {
  if (href.startsWith('/wiki/')) {
    const slug = href.slice('/wiki/'.length)
    const exists = !!getArticle(slug)
    return <Link className={exists ? undefined : 'red-link'} to={href} title={exists ? undefined : 'This article has not been created yet'}>{children}</Link>
  }
  if (href.startsWith('/')) return <Link to={href} {...props}>{children}</Link>
  const external = /^https?:\/\//.test(href)
  return <a href={href} {...props} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}{external && <ExternalLink className="external-icon" size={11} aria-label="opens in a new tab" />}</a>
}

function Infobox({ article }: { article: Article }) {
  const safeImage = article.image?.startsWith('/images/') ? article.image : undefined
  return <aside className="infobox" aria-label={`${article.title} infobox`}>
    <div className="infobox-title">{article.title}</div>
    {safeImage ? <figure><img src={safeImage} alt={article.imageCaption || article.title} width={article.imageWidth} height={article.imageHeight} loading="lazy" decoding="async" /><figcaption>{article.imageCaption || article.title}</figcaption></figure> : null}
    <div className="infobox-subtitle">{article.type}</div>
    <dl>{Object.entries(article.infobox).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl>
  </aside>
}

function ArticleView({ article }: { article: Article }) {
  const [params] = useSearchParams()
  const view = params.get('view') || 'read'
  const file = `frontend/src/content/articles/${article.slug}.md`
  const markdownComponents = { a: WikiAnchor }
  return <main className="article-main" id="article-top" tabIndex={-1}>
    <div className="article-pretitle">{article.project ? <Link to="/projects">Projects</Link> : 'From Woodpedia, the personal encyclopedia'}{article.project && ' / Technical case study'}</div>
    <h1>{article.title}</h1>
    <ArticleTabs article={article} />
    {view === 'edit' ? <section className="system-page"><h2>Editing this article</h2><p>Open <code>{file}</code> in your editor, update the frontmatter or article text, and save. The development server reloads the page automatically.</p><p>Use <code>[[Article title]]</code> for a local link and <code>[[wikipedia:Article title]]</code> for a real Wikipedia link. See the project README for the full format.</p><Link to={articleUrl(article.title)}>Return to article</Link></section>
      : view === 'talk' ? <section className="system-page"><h2>Talk: {article.title}</h2><p>A public discussion system is not enabled for this personal site.</p><p>To leave a note for future edits, add it to your local project documentation.</p><Link to={articleUrl(article.title)}>Return to article</Link></section>
      : view === 'history' ? <section className="system-page"><h2>Revision history</h2><p>Browser-based revision history is not enabled. Changes to <code>{file}</code> can be tracked with Git if this project is placed in a Git repository.</p><Link to={articleUrl(article.title)}>Return to article</Link></section>
      : <>
        <div className="article-content">
          {article.project && <div className="case-study-summary"><span>{article.project.area}</span><p><strong>My contribution:</strong> {article.project.contribution}</p>{article.project.technologies.length > 0 && <p><strong>Technologies:</strong> {article.project.technologies.join(' · ')}</p>}{article.project.outcome && <p><strong>Outcome:</strong> {article.project.outcome}</p>}{(article.project.repository || article.project.demo) && <div className="project-links">{article.project.repository && <WikiAnchor href={article.project.repository}>Repository</WikiAnchor>}{article.project.demo && <WikiAnchor href={article.project.demo}>Live demo</WikiAnchor>}</div>}</div>}
          <Infobox article={article} />
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={markdownComponents}>{prepareWikiLinks(article.body)}</ReactMarkdown>
          {article.project && <details className="technical-details"><summary>Case study documentation</summary><p>Project descriptions use Quentin’s supplied information. Missing evidence is marked in the article; proposed improvements describe future work.</p></details>}
        </div>
        <div className="categories"><strong>Categories:</strong>{article.categories.map((category) => <span key={category}>{category}</span>)}</div>
      </>}
  </main>
}

function MissingArticle({ title }: { title: string }) {
  return <main className="article-main" id="article-top"><div className="article-pretitle">From Woodpedia, the personal encyclopedia</div><h1>{title}</h1><div className="article-tabs"><div className="tab-group"><span className="selected">Article</span></div></div><div className="missing-notice"><strong>Woodpedia does not have an article with this exact name.</strong><p>This red link points to a page that has not been created yet.</p><p>To create it, add a Markdown file in <code>frontend/src/content/articles/</code> using the article template. The file name should match <code>{title.replace(/\s+/g, '_')}.md</code>.</p></div><p><Link to="/wiki/Quentin_Wood">Return to Quentin Wood</Link> · <Link to="/search">Search articles</Link></p></main>
}

function ArticleRoute() {
  const { slug = '' } = useParams()
  const article = getArticle(slug)
  let title = slug
  try { title = decodeURIComponent(slug).replace(/_/g, ' ') } catch { /* display raw slug */ }
  return article ? <ArticleView key={article.slug} article={article} /> : <MissingArticle title={title} />
}

function SearchPage() {
  const [params] = useSearchParams()
  const query = params.get('q')?.trim() || ''
  const results = articles.filter((article) => `${article.title} ${article.description} ${article.body}`.toLowerCase().includes(query.toLowerCase()))
  return <main className="article-main" id="article-top"><div className="article-pretitle">From Woodpedia, the personal encyclopedia</div><h1>Search Woodpedia</h1><div className="article-tabs"><div className="tab-group"><span className="selected">Search</span></div></div>{query ? <><p className="search-summary">{results.length} local article{results.length === 1 ? '' : 's'} matching <strong>“{query}”</strong></p><div className="search-results">{results.map((article) => <article key={article.slug}><h2><Link to={articleUrl(article.title)}>{article.title}</Link></h2><p>{article.description}</p><small>{article.type} · {article.categories.join(' · ')}</small></article>)}</div>{results.length === 0 && <p>No local articles matched. Try a different term.</p>}</> : <p>Use the search field above to find articles on this site.</p>}<p className="search-hint">For topics outside this site, visit <a href="https://en.wikipedia.org/" target="_blank" rel="noopener noreferrer">Wikipedia</a>.</p></main>
}

function Shell() {
  const location = useLocation()
  const article = articleAtPath(location.pathname)
  const previousPath = useRef(location.pathname)
  const [preferences, setPreferences] = useState<Preferences>(defaults)
  useEffect(() => { setPreferences(getPreferences()) }, [])
  useEffect(() => {
    let id = ''
    try { id = decodeURIComponent(location.hash.slice(1)) } catch { /* malformed URL fragment */ }
    const main = document.getElementById('article-top')
    if (previousPath.current !== location.pathname) main?.focus({ preventScroll: true })
    if (id) document.getElementById(id)?.scrollIntoView()
    else window.scrollTo(0, 0)
    previousPath.current = location.pathname
  }, [location.pathname, location.hash])
  function update(patch: Partial<Preferences>) {
    const next = { ...preferences, ...patch }
    setPreferences(next)
    try { localStorage.setItem('woodpedia-preferences', JSON.stringify(next)) } catch { /* preferences still apply for this visit */ }
  }
  return <div className={`app theme-${preferences.theme} text-${preferences.text} width-${preferences.width}`}>
    <Metadata article={article} />
    <a className="skip-link" href="#article-top">Skip to content</a>
    <WikiHeader />
    <div className="page-grid"><Contents headings={article?.headings || pageHeadings[location.pathname.replace(/\/+$/, '') || '/'] || []} /><Routes>
      <Route path="/" element={<HomePage />} /><Route path="/projects" element={<ProjectsPage />} /><Route path="/resume" element={<ResumePage />} /><Route path="/contact" element={<ContactPage />} />
      {articles.filter((item) => item.route).map((item) => <Route key={item.slug} path={item.route} element={<ArticleView key={item.slug} article={item} />} />)}
      <Route path="/wiki/:slug" element={<ArticleRoute />} /><Route path="/search" element={<SearchPage />} /><Route path="*" element={<MissingArticle title="Page not found" />} /></Routes><Appearance preferences={preferences} update={update} /></div>
    <footer className="site-footer"><nav aria-label="Footer navigation">{mainLinks.map(([path, label]) => <Link key={path} to={path}>{label}</Link>)}</nav><p>Woodpedia is Quentin Wood’s independent portfolio. It is not affiliated with Wikipedia or the Wikimedia Foundation.</p><p><Link to="/wiki/Quentin_Wood">Original biography</Link></p></footer>
  </div>
}

export default function App() { return <Shell /> }
