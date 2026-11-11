import { defineConfig, configDefaults } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Shared with vitest.browser.config.ts: tests import the source through the public package names.
export const alias = {
  'optikos/core': r('./src/core/index.ts'),
  'optikos/data': r('./src/data/index.ts'),
  'optikos/bind': r('./src/bind/index.ts'),
  'optikos/motion': r('./src/motion/index.ts'),
  'optikos/ui': r('./src/ui/index.ts'),
  'optikos/build': r('./src/build/index.ts'),
  'optikos/testing': r('./src/testing/index.ts'),
  'optikos/dev': r('./src/dev/index.ts'),
  optikos: r('./src/index.ts'),
};

export default defineConfig({
  resolve: { alias },
  test: { environment: 'happy-dom', setupFiles: ['./src/test-setup.ts'], include: ['src/**/*.test.ts', 'site/**/*.test.ts', 'scripts/**/*.test.ts', 'scripts/**/*.test.mjs'], exclude: [...configDefaults.exclude, '**/*.browser.test.ts'] },
});
