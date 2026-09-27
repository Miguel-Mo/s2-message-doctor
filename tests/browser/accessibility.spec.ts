import { configureOffline } from './support';
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const axe = readFileSync(resolve('node_modules/axe-core/axe.min.js'), 'utf8');
test('learning examples, keyboard navigation and automated accessibility offline', async ({page, context, browserName}) => {
  await configureOffline(context,browserName);
  await page.goto(pathToFileURL(resolve('dist/index.html')).href);
  await page.evaluate(axe);
  const audit = async () => {
    const violations = await page.evaluate(async () => (await (window as any).axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations);
    expect(violations).toEqual([]);
  };
  await audit();
  await page.locator('#example').selectOption('unknown-enum');
  await expect(page.locator('#lesson')).toContainText('replace it with "RM"');
  await page.locator('#validate').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#report')).toContainText('Allowed values: "CEM", "RM".');
  await expect(page.locator('#report')).toContainText(/Line \d+, column \d+/);
  await expect(page.locator('#notice')).toContainText('1 issue found');
  // Traverse the real tab order from Validate through the remaining toolbar controls.
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  await expect(page.getByRole('button', {name:'/role',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#editor')).toBeFocused();
  expect(await page.locator('#editor').evaluate((e: HTMLTextAreaElement) => e.value.slice(e.selectionStart,e.selectionEnd))).toBe('"DEVICE"');
  await audit();
  await page.screenshot({path:'docs/learning-desktop.png',fullPage:true});
  await page.setViewportSize({width:640,height:450});
  await page.evaluate(() => {document.documentElement.style.zoom = '2';});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await audit();
  await page.screenshot({path:'docs/learning-zoom.png',fullPage:true});
  await page.evaluate(() => {document.documentElement.style.zoom = '';});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'docs/learning-mobile.png',fullPage:true});
  for (const name of ['missing-field','numeric-text','invalid-date']) {
    await page.locator('#example').selectOption(name); await page.locator('#validate').click();
    await expect(page.locator('.hint')).toHaveCount(1);
  }
  await page.locator('#example').selectOption('Handshake'); await page.locator('#validate').click();
  await expect(page.locator('#lesson')).toBeHidden();
  await audit();
});
