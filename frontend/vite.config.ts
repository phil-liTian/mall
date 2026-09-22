import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { viteMockServe } from 'vite-plugin-mock'
import path from 'node:path'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useMock = env.VITE_USE_MOCK === 'true'
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:8082'

  return {
    plugins: [
      react(),
      viteMockServe({
        mockPath: 'src/mock',
        enable: command === 'serve' && useMock,
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
      proxy: useMock
        ? undefined
        : {
            '/api': {
              target: apiTarget,
              changeOrigin: true,
              rewrite: (p) => p.replace(/^\/api/, ''),
            },
          },
    },
  }
})
