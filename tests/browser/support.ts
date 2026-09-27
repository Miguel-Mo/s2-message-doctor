import type { BrowserContext } from '@playwright/test';

export async function configureOffline(context: BrowserContext, browserName: string) {
  // WebKit on Windows and Linux rejects file:// navigation with setOffline(true), even though
  // the identical file loads normally. Block outbound HTTP(S) before loading it
  // instead, preserving file reload/history tests without allowing network I/O.
  await context.route(/^https?:\/\//, route => route.abort('internetdisconnected'));
  if (browserName !== 'webkit') await context.setOffline(true);
}
