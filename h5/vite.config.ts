import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { viteMockServe } from 'vite-plugin-mock'
import postcssPxToViewport from 'postcss-px-to-viewport-8-plugin'
import path from 'node:path'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useMock = env.VITE_USE_MOCK === 'true'
  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:8085'

  return {
    plugins: [
      react(),
      viteMockServe({
        mockPath: 'src/mock',
        enable: useMock,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    css: {
      postcss: {
        plugins: [
          postcssPxToViewport({
            viewportWidth: 750,
            unitToConvert: 'px',
            viewportUnit: 'vw',
            unitPrecision: 5,
            propList: ['*'],
            minPixelValue: 1,
            mediaQuery: false,
          }),
        ],
      },
    },
    server: {
      port: 5174,
      open: true,
      host: '0.0.0.0',
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
