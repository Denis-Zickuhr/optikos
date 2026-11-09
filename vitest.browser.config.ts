// Tests that need a real browser (layout, focus, keyboard, measured sizes, accessibility): `npm run test:browser`.
// Needs Chromium: `npx playwright install chromium` (on a bare Linux, `--with-deps`).
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { alias } from './vitest.config';

export default defineConfig({
  resolve: { alias },
  test: {
    include: ['src/**/*.browser.test.ts', 'site/**/*.browser.test.ts'],
    setupFiles: ['./src/test-browser-setup.ts'],
    browser: { enabled: true, provider: playwright(), headless: true, instances: [{ browser: 'chromium' }] },
  },
});
