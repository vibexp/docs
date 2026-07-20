import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // 'lcov' emits coverage/lcov.info for SonarCloud ingestion (see
      // sonar-project.properties); 'text' keeps the local terminal summary.
      reporter: ['text', 'lcov'],
      include: ['src/lib/site.ts', 'src/lib/cookie-consent.ts'],
    },
  },
})
