import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// './' 讓 GitHub Pages 專案頁（username.github.io/repo）與本機都能用
export default defineConfig({
  base: './',
  plugins: [react()],
})
