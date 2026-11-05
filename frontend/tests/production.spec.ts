import { expect, test } from '@playwright/test'

test.skip(!process.env.TEST_PRODUCTION, 'These checks require npm run build and the production preview.')

test('direct production requests contain the correct article and sharing metadata', async ({ request }) => {
  for (const path of ['/projects/graduation-day', '/projects/graduation-day/', '/wiki/Graduation_Day']) {
    const response = await request.get(path)
    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain('<title>Graduation Day (video game) — Quentin Wood</title>')
    expect(html).toContain('property="og:description"')
    expect(html).toContain('id="portfolio-schema"')
    expect(html).toContain('id="technologies-and-architecture"')
    expect(html).not.toContain('C:/Users/')
    expect(html).not.toContain('data-stck=')
  }
})

test('the built portfolio and case studies are readable with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:5173/')
  await expect(page.locator('h1')).toHaveText('Quentin Wood')
  await page.getByRole('link', { name: 'View Projects', exact: true }).click()
  await expect(page.locator('h1')).toHaveText('Projects')
  await page.getByRole('link', { name: 'Read Graduation Day case study' }).click()
  await expect(page.locator('h1')).toHaveText('Graduation Day (video game)')
  await expect(page.getByRole('heading', { name: 'Technologies and architecture' })).toBeVisible()
  await context.close()
})
