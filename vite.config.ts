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
    host: '0.0.0.0', // 监听所有网卡接口（或保留 true）
    allowedHosts: true, // 允许所有主机名/域名访问
    open: false       // 自动打开浏览器
  }
})