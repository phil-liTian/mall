import React from 'react'
import ReactDOM from 'react-dom/client'
import 'dayjs/locale/zh-cn'
import { RouterProvider } from 'react-router-dom'
import router from '@/router'
import ThemeProvider from '@/theme'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
)
