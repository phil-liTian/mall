import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import 'antd-mobile/bundle/style.css'
import '@/styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
