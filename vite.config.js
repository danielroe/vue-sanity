// /// <reference types="vitest" />
// import { defineConfig } from 'vitest/node'

export default {
  test: {
    coverage: {
      include: ['src'],
      reporter: ['text', 'json', 'html'],
    },
  },
}
