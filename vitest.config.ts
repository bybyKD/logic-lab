import { defineConfig } from 'vitest/config'

/**
 * Tests cover pure domain and service logic only — no component tests, no jsdom.
 * Anything that needs a DOM is verified by hand in the browser instead.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
