# Woodpedia

Quentin Wood’s career portfolio, evolved from a Wikipedia-inspired personal encyclopedia. It preserves the editorial layout, serif typography, blue links, contents navigation, search, and saved appearance controls. The site is a React/TypeScript/Vite app with Markdown articles and YAML frontmatter.

Woodpedia is not affiliated with Wikipedia or the Wikimedia Foundation. The logo is an original letter mark. Project claims come from Quentin’s original articles, portfolio brief, and clarifications. Missing project details are explicitly identified rather than invented.

## Career pages and content ownership

| URL | Purpose |
| --- | --- |
| `/` | Professional introduction, four featured projects, experience, and demonstrated skills |
| `/projects` | Featured and supporting work, with seven case studies |
| `/projects/:slug` | Article-style technical case studies |
| `/experience` | Touch of Care, Mines Formula involvement, leadership, and education |
| `/about` | Rural Colorado background and the personal story behind the work |
| `/resume` | Career summary with PDF view and download actions; Resume navigation links open `/Resume.pdf` in a new tab |
| `/contact` | Quentin’s supplied email, GitHub, and LinkedIn links |
| `/wiki/:slug` | Preserved original articles and aliases |

Important files:

- `frontend/src/Portfolio.tsx`: shared page structure, project previews, homepage, skills, resume, and contact.
- `frontend/src/App.tsx`: existing site shell, responsive navigation, article rendering, search, and preferences.
- `frontend/src/site.json`: public profile, contact URLs, expected graduation, resume path, and main-page metadata.
- `frontend/src/content.ts` and `frontend/src/content/articles/`: automatic article registry, project metadata, and editable case studies.
- `frontend/src/styles.css`: original styling with scoped portfolio additions, focus indicators, mobile layouts, and reduced-motion support.
- `frontend/src/seo.ts`, `Metadata.tsx`, `prerender.tsx`, and `frontend/scripts/prerender.mjs`: shared metadata and build-time static rendering.
- `frontend/tests/`: original-site regression tests and portfolio navigation, content, keyboard, metadata, and viewport checks.

Original articles remain accessible without redirecting their old URLs. Internal links to upgraded project articles use their new case-study URL. Existing local article edits were retained.

## Run locally

Requirements: Node.js 20.19+ or 22.12+, npm, and installed Google Chrome for the browser tests.

In one terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173/>.

## Articles and links

All site articles live in [frontend/src/content/articles](frontend/src/content/articles). Copy [ARTICLE_TEMPLATE.md.example](frontend/src/content/ARTICLE_TEMPLATE.md.example) into that directory, rename it to a `.md` file, and edit the frontmatter and body. For a title such as `New Article`, name the file `New_Article.md`. The site discovers it automatically; restart the production build after adding files.

Frontmatter supports `title`, `description`, `type`, `infobox` key/value fields, `categories`, and optional `aliases`, `route`, `image`, `imageCaption`, `imageWidth`, and `imageHeight`. An alias such as `Graduation Day` preserves `/wiki/Graduation_Day` even when the article’s `route` is `/projects/graduation-day`. Put photos in `frontend/public/images/`, supply descriptive captions and dimensions, and omit the image field when no image exists. Images load lazily.

For a project, copy [PROJECT_TEMPLATE.md.example](frontend/src/content/PROJECT_TEMPLATE.md.example) into the articles directory with a `.md` extension. A `project` object automatically adds it to the project index; `featured: true` also puts it on the homepage. Keep the featured selection to 3–4 projects. `order` controls ordering within each group. Optional `repository` and `demo` URLs appear only when supplied. The original article template remains available for non-project content.

Write links directly in Markdown:

| Syntax | Result |
| --- | --- |
| `[[Graduation Day (video game)]]` | Internal article |
| `[[Graduation Day (video game)\|the game]]` | Internal article with custom label |
| `[[wikipedia:Computer science]]` | Real Wikipedia article |
| `[[wikipedia:Python (programming language)\|Python]]` | Real Wikipedia article with custom label |
| `[[Future article]]` | Red link and article-not-created page until its Markdown file exists |

Use `##` and `###` headings for the automatic table of contents. Use Markdown footnotes (`[^source]` and `[^source]: Source details`) for numbered citations. Standard Markdown tables, lists, emphasis, and external links are supported. Raw HTML in article files is not rendered. Internal links are resolved from the article registry, and the search bar indexes article titles, descriptions, and body text.

Public article tabs link to Projects and Contact. Existing `?view=edit`, `?view=talk`, and `?view=history` URLs still explain the original local authoring workflow; these auxiliary views are marked noindex. Browser editing and public discussions are not enabled.

## Information still to supply

- **Employment and involvement dates:** exact Touch of Care dates, Mines Formula dates and formal role. The title **Junior Software Developer** was confirmed by Quentin.
- **Project evidence:** screenshots, project-specific repository/demo URLs, and deeper architecture, decisions, testing, and outcomes for projects whose source is outside this repository. No business metrics, emergency-response results, or official park partnership is inferred.
- **Personal learning story:** a TODO in the About article reserves Quentin’s own account of how he started programming and taught himself. The original articles do not describe those specifics.
- **Production origin:** set `VITE_SITE_URL` to the actual public site origin before building, for absolute static canonical URLs and a sitemap. No deployment domain is assumed.

Contact information is configured using Quentin’s supplied values. GitHub returned HTTP 200 during link validation. LinkedIn returned HTTP 999 to the automated check, so its destination could not be independently verified; its link matches the supplied profile URL.

## Build, test, and hosting

GitHub Pages deploys through `.github/workflows/jekyll-gh-pages.yml` (the filename is retained, but it builds Vite). The workflow reads the public URL and base path from GitHub Pages settings, so custom domains use `/` and default project sites use `/<repository>/`. After changing the custom domain in GitHub, rerun the workflow or push a commit to rebuild asset and navigation URLs for that domain.

```powershell
cd frontend
npm run build
npm run test:e2e
```

The browser tests use installed Google Chrome via Playwright. They cover direct and refreshed routes, legacy articles and aliases, internal links and fragments, profile destinations, search, preferences, keyboard navigation, metadata, and overflow at 320, 390, 768, and 1024 pixels. No lint script is configured.

The build runs TypeScript, Vite, then prerenders the actual React pages to `frontend/dist`: main pages, case studies, original articles, and aliases. Each gets static page content, descriptive titles, Open Graph/Twitter metadata, and Person/WebSite/WebPage or CreativeWork structured data. Vendor chunks keep reusable framework, Markdown, and content-parser code separate for caching.

With `VITE_SITE_URL` set to the real production origin, the build also emits `sitemap.xml`, `robots.txt`, and absolute canonical URLs. Without it, metadata and page content still render; browser metadata uses the current origin. Do not put secrets in `VITE_*` variables, which are public build configuration.

The build emits both directory indexes and equivalent `.html` files so extensionless URLs work in Vite preview and on static hosts. Static hosting must serve generated files first and fall back to `/index.html` for unmatched client routes. The existing Netlify `_redirects` and Vercel rewrite are retained, with Vercel clean URLs enabled; [Vercel documents clean URLs and filesystem precedence before rewrites](https://vercel.com/docs/project-configuration/vercel-json). No hosting account or live deployment was changed.

To run the same browser suite against the production output, stop any dev server on port 5173, then from `frontend`:

```powershell
$env:TEST_PRODUCTION = '1'
npm run test:e2e
Remove-Item Env:TEST_PRODUCTION
```
