import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src")
    }
  },

  base: './',
  server: {
    port: 5174,      // 端口
    host: true,      // 允许局域网访问
    open: false       // 自动打开浏览器
  }
})