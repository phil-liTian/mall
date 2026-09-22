import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteMockServe } from 'vite-plugin-mock'
import path from 'node:path'

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    viteMockServe({
      mockPath: 'src/mock',
      enable: command === 'serve',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
}))
