import {test,expect} from '@playwright/test';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {configureOffline} from './support';
test('public implementation corpus matches the built UI',async({page,context,browserName})=>{
  test.skip(!existsSync('external-corpus/manifest.json'),'Run the optional public fixture acquisition first');
  test.setTimeout(120000);
  await configureOffline(context,browserName);
  await page.goto(pathToFileURL(resolve('dist/index.html')).href);
  const results=JSON.parse(readFileSync('docs/external-results.json','utf8'));
  for(const result of results){
    await page.locator('#editor').fill(readFileSync(`external-corpus/${result.file}`,'utf8'));
    await page.locator('#validate').click();
    await expect(page.locator('.status').nth(1).locator('strong'),result.url).toHaveText(result.schema===true?'✓ Valid':result.schema===false?'× Invalid':'Not checked');
  }
});
