import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'tests/browser',workers:3,projects:['chromium','firefox','webkit'].map(name=>({name,use:{browserName:name as 'chromium'|'firefox'|'webkit'}})),reporter:'list'});
