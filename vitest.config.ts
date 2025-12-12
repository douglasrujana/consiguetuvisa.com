import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Run tests sequentially to avoid SQLite database locking issues
    sequence: {
      concurrent: false,
    },
    // Run test files sequentially (not in parallel)
    fileParallelism: false,
    // Increase timeout for database operations
    testTimeout: 30000,
    hookTimeout: 30000,
    // Use test database
    env: {
      DATABASE_URL: 'file:./test.db',
    },
  }
});
