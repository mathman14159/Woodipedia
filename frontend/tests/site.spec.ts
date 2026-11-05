import { expect, test } from '@playwright/test'

test('biography, internal articles, history, and direct refresh', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: 'View Projects', exact: true })).toBeVisible()
  await page.goto('/wiki/Quentin_Wood')
  await expect(page.locator('h1')).toHaveText('Quentin Wood')
  await expect(page.getByLabel('Quentin Wood infobox')).toBeVisible()
  await expect(page.locator('.contents-sidebar').getByText('Early life')).toBeVisible()

  await page.getByRole('main').getByRole('link', { name: 'Software projects of Quentin Wood', exact: true }).click()
  await expect(page.locator('h1')).toHaveText('Software projects of Quentin Wood')
  await page.goBack()
  await expect(page.locator('h1')).toHaveText('Quentin Wood')
  await page.goForward()
  await expect(page.locator('h1')).toHaveText('Software projects of Quentin Wood')
  await page.reload()
  await expect(page.locator('h1')).toHaveText('Software projects of Quentin Wood')
  await page.getByRole('main').getByRole('link', { name: 'Graduation Day' }).first().click()
  await expect(page).toHaveURL(/\/projects\/graduation-day$/)
  await expect(page.locator('h1')).toHaveText('Graduation Day (video game)')
})

test('external and red links resolve correctly', async ({ page }) => {
  await page.goto('/wiki/Quentin_Wood')
  const external = page.getByRole('main').getByRole('link', { name: 'Colorado School of Mines' }).first()
  await expect(external).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Colorado_School_of_Mines')
  await expect(external).toHaveAttribute('target', '_blank')
  await page.goto('/wiki/Article_That_Does_Not_Exist')
  await expect(page.getByText('This red link points to a page that has not been created yet.')).toBeVisible()
})

test('search and appearance preferences', async ({ page }) => {
  await page.goto('/wiki/Quentin_Wood')
  await page.getByRole('searchbox', { name: 'Search Woodpedia' }).fill('wildlife')
  await expect(page.locator('.suggestions').getByRole('link', { name: /Wildlife Survey Platform/ })).toBeVisible()
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.locator('.search-results')).toContainText('Wildlife Survey Platform')
  await page.getByRole('radio', { name: 'Dark' }).check()
  await page.reload()
  await expect(page.locator('.app')).toHaveClass(/theme-dark/)
})

test('mobile article has no horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/wiki/Quentin_Wood')
  await expect(page.locator('h1')).toHaveText('Quentin Wood')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('published articles contain no placeholder copy or unresolved internal links', async ({ page }) => {
  const slugs = [
    'Quentin_Wood',
    'Education_of_Quentin_Wood',
    'Career_of_Quentin_Wood',
    'Software_projects_of_Quentin_Wood',
    'Personal_achievements_of_Quentin_Wood',
    'Athletic_career_of_Quentin_Wood',
    'Graduation_Day',
    'Cluck_Run',
    'Collector_of_Souls',
    'Wildlife_Survey_Platform',
    'Wildfire_Mapping_Project',
  ]

  for (const slug of slugs) {
    await page.goto(`/wiki/${slug}`)
    await expect(page.locator('h1')).not.toHaveText('Page not found')
    await expect(page.locator('.article-content .red-link')).toHaveCount(0)
    await expect(page.locator('.article-content')).not.toContainText('[Add')
    await expect(page.locator('.article-content')).not.toContainText('Photograph placeholder')
  }
})
