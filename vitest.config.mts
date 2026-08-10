import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Only the logic these tests are responsible for. React Server
      // Components and pages are covered by the end-to-end suite instead —
      // counting them here would let the threshold pass on untested code.
      include: ['src/lib/public/**/*.ts'],
      exclude: ['**/*.test.ts'],
      reporter: ['text', 'json-summary'],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
