import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@lucid/schema': path.resolve(__dirname, '../schema/src/index.ts'),
    },
  },
});
