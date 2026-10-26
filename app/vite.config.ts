import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages 專案站固定在 /angio/；本機 preview 也用此 base
export default defineConfig({
  base: '/angio/',
  plugins: [react()],
})
