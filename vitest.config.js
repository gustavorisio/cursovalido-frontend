import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    restoreMocks: true,
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.{js,jsx}'],
      reporter: ['text-summary', 'html', 'json'],
      reportOnFailure: true,
      thresholds: { lines: 75 },
    },
  },
})
