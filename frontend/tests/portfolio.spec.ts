import { expect, test } from '@playwright/test'

const routes = ['/', '/projects', '/experience', '/about', '/resume', '/contact',
  '/projects/olathe-tuxedo-corn', '/projects/mines-formula-telemetry', '/projects/wildfire-mapping',
  '/projects/graduation-day', '/projects/wildlife-survey', '/projects/touch-of-care']

test('homepage prioritizes identity, actions, and four projects', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Quentin Wood', exact: true })).toBeVisible()
  await expect(page.getByText('Computer Science Student · Software Developer', { exact: true })).toBeVisible()
  await expect(page.getByText(/Expected graduation May 2030/)).toBeVisible()
  await expect(page.locator('.project-grid .project-preview')).toHaveCount(4)
  for (const name of ['View Projects', 'View Resume', 'GitHub', 'Contact Me']) {
    const link = page.getByRole('main').getByRole('link', { name, exact: true })
    await expect(link).toBeVisible()
    expect((await link.boundingBox())!.y).toBeLessThan(700)
  }
  await page.getByRole('link', { name: 'View Projects', exact: true }).click()
  await expect(page.locator('h1')).toHaveText('Projects')
  await page.getByRole('link', { name: 'Read Olathe Tuxedo Corn case study' }).click()
  await expect(page).toHaveURL(/\/projects\/olathe-tuxedo-corn$/)
  await page.reload()
  await expect(page.locator('h1')).toHaveText('Olathe Tuxedo Corn Website Rebuild')
  expect(errors).toEqual([])
})

test('all career routes and their internal navigation resolve, with no broken fragments or assets', async ({ page }) => {
  const internal = new Set<string>()
  const failures: string[] = []
  page.on('pageerror', (error) => failures.push(error.message))
  page.on('response', (response) => { if (response.url().startsWith('http://127.0.0.1:5173') && response.status() >= 400) failures.push(`${response.status()} ${response.url()}`) })
  for (const route of routes) {
    await page.goto(route)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).not.toHaveText('Page not found')
    await expect(page.locator('.red-link')).toHaveCount(0)
    await expect(page.locator('main h2:empty')).toHaveCount(0)
    const links = await page.locator('a').evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href') || ''))
    for (const href of links) {
      if (href.startsWith('/') && !href.startsWith('//') && !/\.pdf$/i.test(href)) internal.add(href.split('#')[0])
      if (href.startsWith('#')) expect(await page.locator(`[id="${decodeURIComponent(href.slice(1))}"]`).count(), `${route}: ${href}`).toBe(1)
    }
    const brokenImages = await page.locator('img').evaluateAll((images) => images.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src))
    expect(brokenImages).toEqual([])
  }
  for (const path of internal) {
    await page.goto(path)
    await expect(page.locator('.missing-notice'), path).toHaveCount(0)
  }
  expect(failures).toEqual([])
})

test('contact uses supplied profiles and resume links open the supplied PDF in a new tab', async ({ page, request }) => {
  await page.goto('/contact')
  const main = page.getByRole('main')
  await expect(main.getByRole('link', { name: 'quentin.wood14159@gmail.com' })).toHaveAttribute('href', 'mailto:quentin.wood14159@gmail.com')
  await expect(main.getByRole('link', { name: 'View GitHub profile' })).toHaveAttribute('href', 'https://github.com/mathman14159')
  await expect(main.getByRole('link', { name: 'View LinkedIn profile' })).toHaveAttribute('href', 'https://www.linkedin.com/in/quentin-wood141')
  await expect(main.getByRole('link', { name: 'View GitHub profile' })).toHaveAttribute('rel', 'noopener noreferrer')
  await page.goto('/resume')
  await expect(page.getByText('Resume PDF coming soon')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'View resume PDF' })).toHaveAttribute('href', '/Resume.pdf')
  await expect(page.locator('a[download]')).toHaveAttribute('href', '/Resume.pdf')
  await expect(page.getByRole('main')).toContainText('Junior Software Developer')
  const pdf = await request.get('/Resume.pdf')
  expect(pdf.ok()).toBe(true)
  expect(pdf.headers()['content-type']).toContain('application/pdf')
  expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-')

  await page.goto('/')
  const resumeLinks = page.getByRole('link', { name: /^(View )?Resume$/ })
  await expect(resumeLinks).toHaveCount(3)
  for (const link of await resumeLinks.all()) {
    await expect(link).toHaveAttribute('href', '/Resume.pdf')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  }
  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('link', { name: 'View Resume', exact: true }).click()
  const popup = await popupPromise
  await expect(popup).toHaveURL(/\/Resume\.pdf$/)
  await expect(page.locator('h1')).toHaveText('Quentin Wood')
  await popup.close()
  await page.getByRole('button', { name: 'Toggle main menu' }).click()
  const menuResume = page.getByRole('navigation', { name: 'Main menu', exact: true }).getByRole('link', { name: 'Resume', exact: true })
  await expect(menuResume).toHaveAttribute('href', '/Resume.pdf')
  await expect(menuResume).toHaveAttribute('target', '_blank')
})

test('metadata follows navigation and preserves canonical article paths', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Quentin Wood — Software Developer & CS Student')
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page).toHaveTitle('Projects — Quentin Wood')
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Projects — Quentin Wood')
  const schema = await page.locator('#portfolio-schema').textContent()
  expect(JSON.parse(schema!)['@graph'][0].name).toBe('Quentin Wood')
  await page.goto('/wiki/Graduation_Day')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/projects\/graduation-day$/)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Unity\/C#/)
  await page.goto('/projects/graduation-day/')
  await expect(page).toHaveTitle('Graduation Day (video game) — Quentin Wood')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/projects\/graduation-day$/)
  await page.goto('/missing')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
})

test('keyboard navigation exposes skip link, menu, and technical disclosure', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  const menu = page.getByRole('button', { name: 'Toggle main menu' })
  await menu.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('navigation', { name: 'Main menu', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menu).toBeFocused()
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
  const search = page.getByRole('searchbox', { name: 'Search Woodpedia' })
  await search.fill('wildlife')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(page.locator('.suggestions a').first()).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('h1')).toHaveText('Wildlife Survey Platform')
  await page.goto('/projects/touch-of-care')
  await page.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('details')).toHaveAttribute('open', '')
})

test('career pages fit phone and tablet screens including large text and dark theme', async ({ page }) => {
  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 844 })
    for (const route of routes) {
      await page.goto(route)
      await expect(page.locator('h1')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px ${route}`).toBe(true)
    }
  }
  await page.goto('/')
  await page.getByRole('radio', { name: 'Large', exact: true }).check()
  await page.getByRole('radio', { name: 'Dark', exact: true }).check()
  await page.reload()
  await expect(page.locator('.app')).toHaveClass(/text-large/)
  await expect(page.locator('.app')).toHaveClass(/theme-dark/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
