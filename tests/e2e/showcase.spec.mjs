import { existsSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('initial report has no active iframe', async ({ page }) => {
  test.skip(!existsSync('index.html'), 'Generated report begins in Task 3');
  await page.goto('/');
  await expect(page.locator('iframe')).toHaveCount(0);
});

test('report exposes all core sections and every run once', async ({ page }) => {
  await page.goto('/');
  for (const id of ['overview', 'results', 'cases', 'run-explorer', 'prompts', 'tested-skill', 'methodology', 'findings', 'limitations', 'evidence']) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  await expect(page.locator('#run-grid [data-run-card]')).toHaveCount(18);
  await expect(page.getByText('Luna and Terra used xHigh reasoning. Sol used High reasoning.')).toBeVisible();
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 360, height: 800 }]) {
  test(`showcase has no horizontal overflow at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
}

test('static report remains useful when JavaScript is unavailable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#run-grid [data-static-run-card]')).toHaveCount(18);
  await expect(page.getByText('The sanitized publication contains 15 original screenshot artifacts belonging to 1 run with original screenshot evidence.')).toBeVisible();
  await expect(page.locator('#site-nav')).toBeVisible();
  await expect(page.locator('#prompts a[href^="inputs/prompts/"]')).toHaveCount(6);
  await expect(page.locator('#tested-skill a[href="inputs/skill/SKILL.md"]')).toBeVisible();
  await context.close();
});

test('valid filters produce the deterministic empty state', async ({ page }) => {
  await page.goto('/');
  await page.selectOption('#case-filter', 'case-02');
  await page.selectOption('#original-screenshot-filter', 'yes');
  await expect(page.locator('#run-grid [data-run-card]:visible')).toHaveCount(0);
  await expect(page.getByText('No runs match these filters.')).toBeVisible();
});

test('filter and run hashes accept only validated values', async ({ page }) => {
  await page.goto('/#case=case-02&model=sol-high&condition=no-skill');
  await expect(page.locator('#case-filter')).toHaveValue('case-02');
  await expect(page.locator('#model-filter')).toHaveValue('sol-high');
  await expect(page.locator('#condition-filter')).toHaveValue('no-skill');
  await expect(page.locator('#run-grid [data-run-card]:visible')).toHaveCount(1);
  await page.goto('/#run=does-not-exist');
  await expect(page).toHaveURL(/#run-explorer$/);
  await page.goto('/#nonsense');
  await expect(page).toHaveURL(/#run-explorer$/);
});

test('all 18 run deep links target one unique explorer card', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('#run-grid [data-run-card]').evaluateAll((cards) => cards.map((card) => card.id));
  expect(new Set(ids).size).toBe(18);
  await expect(page.locator('[id^="run="]')).toHaveCount(18);
  for (const id of ids) {
    await page.evaluate((target) => { location.hash = target; }, id);
    await expect(page.locator(`[id="${id}"]`)).toBeFocused();
  }
});

test('prompt and source deep links open only escaped allowlisted viewers', async ({ page }) => {
  await page.goto('/#prompt=case-01-new-skill');
  await expect(page.locator('#text-dialog')).toBeVisible();
  await expect(page.locator('#text-dialog-code > *')).toHaveCount(0);
  await page.getByRole('button', { name: 'Close viewer' }).click();
  await page.goto('/#source=case-01-new-skill-luna-xhigh:index.html');
  await expect(page.locator('#text-dialog')).toBeVisible();
  await expect(page.locator('#text-dialog-code')).toContainText('<!doctype html>');
  await expect(page.locator('#text-dialog-code > *')).toHaveCount(0);
  await expect(page.locator('#text-dialog-meta')).toContainText('SHA-256');
  await page.goto('/#source=case-01-new-skill-luna-xhigh:missing.html');
  await expect(page).toHaveURL(/#run-explorer$/);
  await expect(page.locator('#text-dialog')).not.toBeVisible();
});

test('exact canonical text is escaped and focus returns on close', async ({ page }) => {
  await page.goto('/');
  const opener = page.getByRole('button', { name: 'Read exact prompt' }).first();
  await opener.click();
  await expect(page.locator('#text-dialog')).toBeVisible();
  const promptPath = await page.locator('#text-dialog-meta a').getAttribute('href');
  const canonical = await page.request.get(new URL(promptPath, page.url()).href).then((response) => response.text());
  await expect(page.locator('#text-dialog-code')).toHaveText(canonical);
  await expect(page.locator('#text-dialog-code > *')).toHaveCount(0);
  await page.getByRole('button', { name: 'Copy exact text' }).click();
  await expect(page.locator('#copy-status')).toHaveText('Copied exact text.');
  await page.getByRole('button', { name: 'Close viewer' }).click();
  await expect(opener).toBeFocused();
});

test('copy feedback reports failure when both copy mechanisms fail', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Read exact prompt' }).first().click();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('blocked'); } } });
    document.execCommand = () => false;
  });
  await page.getByRole('button', { name: 'Copy exact text' }).click();
  await expect(page.locator('#copy-status')).toHaveText('Copy failed. Select the text and copy it manually.');
});

test('sanitized source and tested skill use the escaped allowlisted viewer', async ({ page }) => {
  await page.goto('/');
  const sourceOpener = page.locator('#run-grid [data-run-card]').first().getByRole('button', { name: 'Sanitized source' });
  await sourceOpener.click();
  await expect(page.locator('#text-dialog-code')).toContainText('<!doctype html>');
  await expect(page.locator('#text-dialog-code > *')).toHaveCount(0);
  await expect(page.locator('#text-dialog-meta a')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(sourceOpener).toBeFocused();
  const skillOpener = page.getByRole('button', { name: 'View tested skill' });
  await skillOpener.click();
  await expect(page.locator('#text-dialog-code')).toContainText('frontend-art-direction');
  await expect(page.locator('#text-dialog-meta a')).toHaveAttribute('href', 'inputs/skill/SKILL.md');
});

test('screenshot viewer separates derived and original provenance', async ({ page }) => {
  await page.goto('/#run=case-01-new-skill-sol-high');
  await page.locator('#run-grid [data-run-id="case-01-new-skill-sol-high"]').getByRole('button', { name: 'View screenshots' }).click();
  await expect(page.locator('#image-dialog')).toBeVisible();
  await expect(page.getByText('Publication-time derived capture').last()).toBeVisible();
  await expect(page.getByRole('group', { name: 'Original benchmark screenshots' })).toBeVisible();
  await expect(page.locator('#image-dialog figcaption')).toHaveText('Publication-time derived capture · 1440 × 900');
  await page.getByRole('button', { name: 'Original 1', exact: true }).click();
  await expect(page.locator('#image-dialog figcaption')).toContainText('Original benchmark screenshot');
});

test('embedded preview is lazy, sandboxed, switchable, and unloaded on close', async ({ page }) => {
  await page.goto('/');
  const opener = page.locator('#run-grid [data-run-card]').first().getByRole('button', { name: 'Open live preview' });
  await opener.click();
  const frame = page.locator('#preview-dialog iframe');
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-forms allow-modals');
  await expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer');
  await expect(frame).not.toHaveAttribute('sandbox', /allow-same-origin|allow-top-navigation/);
  await expect(frame).toHaveAttribute('width', '1440');
  await page.getByRole('button', { name: 'Mobile 390px' }).click();
  await expect(frame).toHaveAttribute('width', '390');
  const source = await frame.getAttribute('src');
  await page.getByRole('button', { name: 'Reload preview' }).click();
  await expect(page.locator('#preview-dialog iframe')).toHaveCount(1);
  await expect(page.locator('#preview-dialog iframe')).toHaveAttribute('src', source);
  await expect(page.locator('#preview-dialog iframe')).toHaveAttribute('width', '390');
  await expect(page.getByRole('link', { name: 'Open isolated preview page' })).toHaveAttribute('href', /^preview\.html#run=case-/);
  await page.getByRole('button', { name: 'Close live preview' }).click();
  await expect(page.locator('#preview-dialog iframe')).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('main-page hash navigation closes and unloads an embedded preview', async ({ page }) => {
  await page.goto('/');
  await page.locator('#run-grid [data-run-card]').first().getByRole('button', { name: 'Open live preview' }).click();
  await expect(page.locator('#preview-dialog iframe')).toHaveCount(1);
  await page.evaluate(() => { location.hash = 'run=case-03-no-skill-terra-xhigh'; });
  await expect(page.locator('#preview-dialog')).not.toBeVisible();
  await expect(page.locator('#preview-dialog iframe')).toHaveCount(0);
  await expect(page.locator('[id="run=case-03-no-skill-terra-xhigh"]')).toBeFocused();
});

test('standalone preview accepts only one validated run hash', async ({ page }) => {
  await page.goto('/preview.html#run=case-01-new-skill-luna-xhigh');
  const frame = page.locator('#preview-container iframe');
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-forms allow-modals');
  await expect(page.locator('.preview-identity code')).toHaveText('case-01-new-skill-luna-xhigh');
  await page.goto('/preview.html#run=does-not-exist');
  await expect(page.getByText('Unknown or invalid run ID')).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.goto('/preview.html#run=case-01-new-skill-luna-xhigh&run=case-02-new-skill-luna-xhigh');
  await expect(page.getByText('Unknown or invalid run ID')).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.goto('/preview.html?url=runs/case-01/new-skill/luna-xhigh/index.html');
  await expect(page.getByText('Unknown or invalid run ID')).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
});

test('archive scope, provenance, timing, integrity, and review semantics are explicit', async ({ page }) => {
  await page.goto('/#methodology');
  await expect(page.getByText(/This archive documents an 18-run frontend generation exercise/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Screenshot Provenance' })).toBeVisible();
  await expect(page.getByText('No model was rerun.')).toBeVisible();
  await expect(page.getByText(/may differ from the exact browser, font, timing, or operating-system conditions/)).toBeVisible();
  await expect(page.getByText('Luna and Terra used xHigh reasoning. Sol used High reasoning.')).toBeVisible();
  await expect(page.getByText(/The showcase adds 36 standardized publication-time derived captures, providing a consistent archival reference for 18 runs/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recorded timing' })).toBeVisible();
  await expect(page.getByText(/Timing records are preserved as execution evidence, not as controlled performance measurements/)).toBeVisible();
  await expect(page.getByText('Showcase copies match the finalized sanitized publication artifacts from which they were copied.')).toBeVisible();
  await expect(page.getByText(/Human verification confirms the defect evidence and description/)).toBeVisible();
  await expect(page.getByText(/does not approve interface quality, implementation correctness, or product behavior/)).toBeVisible();
  await expect(page.locator('.review-badge').first()).toHaveText('Verified for archive');
  await expect(page.locator('.classification-badge').first()).toHaveText('editorially-normalized');
  await expect(page.locator('#run-grid .timing-caveat')).toHaveCount(18);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'assets/social/benchmark-preview.png');
});

test('all report navigation, cases, and valid filter values are operable', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('#site-nav a');
  await expect(links).toHaveCount(10);
  for (let index = 0; index < 10; index += 1) {
    const href = await links.nth(index).getAttribute('href');
    await links.nth(index).click();
    await expect(page).toHaveURL(new RegExp(`${href.replace('#', '#')}$`));
    await expect(page.locator(href)).toBeVisible();
  }
  const cases = page.locator('.case-selector button');
  await expect(cases).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    await cases.nth(index).click();
    await expect(cases.nth(index)).toHaveAttribute('aria-pressed', 'true');
  }
  for (const select of await page.locator('#run-filters select').all()) {
    const values = await select.locator('option').evaluateAll((options) => options.map((option) => option.value));
    for (const value of values) {
      await select.selectOption(value);
      await expect(select).toHaveValue(value);
    }
    await page.getByRole('button', { name: 'Clear all filters' }).click();
  }
});

test('all six prompts and the tested skill load exact canonical text', async ({ page }) => {
  await page.goto('/');
  const prompts = page.locator('#prompt-grid [data-view-prompt]');
  await expect(prompts).toHaveCount(6);
  for (let index = 0; index < 6; index += 1) {
    await prompts.nth(index).click();
    await expect(page.locator('#text-dialog-code')).not.toHaveText('Loading exact text…');
    await expect(page.locator('#text-dialog-code > *')).toHaveCount(0);
    await page.getByRole('button', { name: 'Close viewer' }).click();
  }
  await page.getByRole('button', { name: 'View tested skill' }).click();
  await expect(page.locator('#text-dialog-code')).toContainText('frontend-art-direction');
});

test('mobile section navigation is keyboard and touch operable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Sections' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#site-nav')).toBeVisible();
  await page.locator('#site-nav a[href="#findings"]').click();
  await expect(page.locator('#findings')).toBeVisible();
});

test('initial page, dialogs, and preview shell have no automated Axe violations', async ({ page }) => {
  const analyze = async () => {
    const result = await new AxeBuilder({ page }).exclude('iframe').analyze();
    expect(result.violations, result.violations.map((item) => `${item.id}: ${item.help}`).join('\n')).toEqual([]);
  };
  await page.goto('/');
  await analyze();
  await page.getByRole('button', { name: 'Read exact prompt' }).first().click();
  await analyze();
  await page.getByRole('button', { name: 'Close viewer' }).click();
  await page.locator('#run-grid [data-run-card]').first().getByRole('button', { name: 'View screenshots' }).click();
  await analyze();
  await page.getByRole('button', { name: 'Close screenshot viewer' }).click();
  await page.locator('#run-grid [data-run-card]').first().getByRole('button', { name: 'Open live preview' }).click();
  await analyze();
  await page.getByRole('button', { name: 'Close live preview' }).click();
  await page.goto('/preview.html#run=case-01-new-skill-luna-xhigh');
  await analyze();
});

test('accessibility semantics, focus containment, and reduced motion are explicit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main > section > .section-heading h2')).toHaveCount(9);
  await expect(page.locator('.timing-row meter')).toHaveCount(6);
  for (const meter of await page.locator('.timing-row meter').all()) await expect(meter).toHaveAttribute('aria-label', /seconds/);
  await expect(page.locator('#run-grid .condition-badge').filter({ hasText: 'New Skill' })).toHaveCount(9);
  await expect(page.locator('#run-grid .condition-badge').filter({ hasText: 'No Skill' })).toHaveCount(9);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect(await page.locator('.button').first().evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration) || 0)).toBeLessThanOrEqual(0.01);
  await page.getByRole('button', { name: 'Read exact prompt' }).first().click();
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.querySelector('#text-dialog').contains(document.activeElement))).toBe(true);
  }
});

test('showcase assets and evidence resolve without console or page errors', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (failure) => errors.push(failure.message));
  await page.goto('/');
  for (const image of await page.locator('#run-grid img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
  }
  const evidenceLinks = await page.locator('#evidence a').evaluateAll((links) => links.map((link) => link.href));
  for (const href of evidenceLinks) expect((await page.request.get(href)).status()).toBeLessThan(400);
  expect(errors).toEqual([]);
});
