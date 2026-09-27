import { configureOffline } from './support';
import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
test('built single-file app works offline with no network requests', async ({page, context, browserName}) => {
  await configureOffline(context,browserName);
  const requests: string[] = [], errors: string[] = [];
  page.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(pathToFileURL(resolve('dist/index.html')).href);
  for (const name of ['Handshake','ResourceManagerDetails','PEBC.PowerConstraints']) {
    await page.locator('#example').selectOption(name);
    await page.getByRole('button',{name:'Validate',exact:false}).click();
    await expect(page.locator('#report h3')).toHaveText('Message matches the pinned schema');
  }
  await page.locator('#editor').fill('{"message_type":"Handshake","role":"BAD"}');
  await page.locator('#validate').click();
  await page.getByRole('button',{name:'/role',exact:true}).click();
  expect(await page.locator('#editor').evaluate((e: HTMLTextAreaElement) => e.value.slice(e.selectionStart,e.selectionEnd))).toBe('"BAD"');
  await page.screenshot({path:'docs/errors.png',fullPage:true});
  await page.locator('#copy').click();
  await expect(page.locator('#notice')).toContainText(/JSON copied|Clipboard unavailable/);
  await page.locator('#editor').fill('{"message_type":"Handshake","role":"<img src=x onerror=alert(1)>"}');
  await page.locator('#validate').click();
  await expect(page.locator('#report img')).toHaveCount(0);
  await page.locator('#editor').fill('{\n "message_type": }');
  await page.locator('#validate').click();
  await expect(page.locator('#report')).toContainText('line 2');
  await page.locator('#file').setInputFiles({name:'handshake.json',mimeType:'application/json',buffer:Buffer.from('{"message_type":"Handshake","message_id":"message-01","role":"CEM"}')});
  await page.locator('#validate').click();
  await expect(page.locator('#report h3')).toHaveText('Message matches the pinned schema');
  const download = page.waitForEvent('download'); await page.locator('#download').click(); expect((await download).suggestedFilename()).toBe('s2-message.json');
  await page.screenshot({path:'docs/desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:'docs/mobile.png',fullPage:true});
  expect(requests).toEqual([]); expect(errors).toEqual([]);
});
