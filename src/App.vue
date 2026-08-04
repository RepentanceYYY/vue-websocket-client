<template>
  <div
    class="fixed top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-md shadow-xs z-50 flex items-center justify-center border-b border-gray-100">
    <h1
      class="text-xl font-extrabold tracking-wider bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
      scenery
    </h1>
  </div>

  <div class="fixed top-16 bottom-14 left-0 right-0 overflow-y-auto bg-gray-50/50">
    <RouterView />
  </div>

  <div
    class="fixed bottom-0 left-0 w-full h-14 bg-white/90 backdrop-blur-md border-t border-gray-200/80 z-50 flex items-center justify-between px-6 text-xs text-gray-500 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">

    <div class="font-medium tracking-wide text-gray-400">
      alice-scenery © 2026
    </div>

    <div class="flex items-center gap-2.5">

      <button @click="goToWebSocket" :class="[
        'px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-xs border',
        route.path === '/'
          ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-blue-500/20 shadow-md scale-102'
          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300'
      ]">
        <Cpu />
        WebSocket 终端
      </button>

      <button @click="goToChat" :class="[
        'px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-xs border',
        route.path === '/chat'
          ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-blue-500/20 shadow-md scale-102'
          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300'
      ]">
        <MessageCircleMore />
        Chat
      </button>

      <button @click="goToImageWebSocket" :class="[
        'px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-xs border',
        route.path === '/image'
          ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-blue-500/20 shadow-md scale-102'
          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300'
      ]">
        <Image />
        WebSocket Image 终端
      </button>

      <button @click="goToFaceCapture" :class="[
        'px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-xs border',
        route.path === '/faceCapture'
          ? 'bg-linear-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-emerald-500/20 shadow-md scale-102'
          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300'
      ]">
        <ScanFace />
        人脸数据采集
      </button>

    </div>

  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { Cpu, ScanFace, Image, MessageCircleMore } from '@lucide/vue';

const router = useRouter()
const route = useRoute() // 用于获取当前路由，实现菜单高亮

// 跳转到 首页/WebSocket 客户端页面
const goToWebSocket = () => {
  router.push('/')
}
const goToChat = () => {
  router.push('/chat')
}
// 跳转到 首页/WebSocket 图片 客户端页面
const goToImageWebSocket = () => {
  router.push('/image')
}

// 跳转到 人脸采集 页面
const goToFaceCapture = () => {
  router.push('/faceCapture')
}
</script>

<script lang="ts">
export default {
  name: 'AppLayout'
}
</script>