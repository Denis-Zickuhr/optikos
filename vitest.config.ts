import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      'optikos/core': r('./src/core/index.ts'),
      'optikos/data': r('./src/data/index.ts'),
      'optikos/bind': r('./src/bind/index.ts'),
      'optikos/motion': r('./src/motion/index.ts'),
      'optikos/ui': r('./src/ui/index.ts'),
      optikos: r('./src/index.ts'),
    },
  },
  test: { environment: 'happy-dom', setupFiles: ['./src/test-setup.ts'], include: ['demos/**/*.test.ts', 'src/**/*.test.ts', 'site/**/*.test.ts', 'scripts/**/*.test.mjs'] },
});
