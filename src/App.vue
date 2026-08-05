<template>
  <!-- 顶部标题栏（含菜单） -->
  <div
    class="fixed top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-md shadow-xs z-50 flex items-center justify-between px-4 border-b border-gray-100 relative">
    
    <!-- 中间区域：标题 + 版权信息（改为绝对定位居中，不占位，不随菜单挤压） -->
    <div class="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-none z-0">
      <h1
        class="text-2xl sm:text-3xl pb-1 font-extrabold tracking-wider bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent pointer-events-auto">
        scenery
      </h1>
    </div>

    <!-- 右侧：菜单按钮 + 展开菜单项（保持靠右，设置更高的 z-index 覆盖中间内容） -->
    <div class="flex items-center gap-2 ml-auto relative z-10">
      <!-- 菜单项列表（胶囊式，从右往左展开） -->
      <Transition name="menu-slide">
        <div v-if="menuOpen" class="flex items-center gap-1.5 overflow-hidden" style="white-space: nowrap;">
          <button v-for="(item, index) in navItems" :key="item.path"
            @click="() => { router.push(item.path); closeMenu(); }" :class="[
              'px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-xs border',
              isActive(item.path)
                ? activeButtonClass
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300'
            ]" :style="{
              animationDelay: `${index * 50}ms`,
            }">
            <component :is="item.icon" class="w-3.5 h-3.5" />
            {{ item.label }}
          </button>
        </div>
      </Transition>

      <!-- 菜单展开/收起按钮（图标切换） -->
      <button @click="toggleMenu" class="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
        aria-label="切换菜单">
        <component :is="menuOpen ? ListCollapse : Menu" class="w-5 h-5 text-gray-600" />
      </button>
    </div>
  </div>

  <!-- 主内容区（底部无导航） -->
  <div class="fixed top-16 bottom-0 left-0 right-0 overflow-y-auto bg-gray-50/50">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Cpu, ScanFace, Image, MessageCircleMore, Menu, ListCollapse } from '@lucide/vue'
import type { Component } from 'vue'

const router = useRouter()
const route = useRoute()

interface NavItem {
  path: string
  label: string
  icon: Component
}

const navItems: NavItem[] = [
  { path: '/', label: 'WebSocket 终端', icon: Cpu },
  { path: '/chat', label: 'Chat', icon: MessageCircleMore },
  { path: '/image', label: 'WebSocket Image 终端', icon: Image },
  { path: '/faceCapture', label: '人脸数据采集', icon: ScanFace },
]

const activeButtonClass =
  'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-blue-500/20 shadow-md scale-102'

const isActive = (path: string) => route.path === path

const menuOpen = ref(false)

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const closeMenu = () => {
  menuOpen.value = false
}
</script>

<script lang="ts">
export default {
  name: 'AppLayout'
}
</script>

<style scoped>
/* ========== 菜单展开动画 ========== */
.menu-slide-enter-active {
  transition: all 0.3s ease-out;
}

.menu-slide-leave-active {
  transition: all 0.25s ease-in;
}

.menu-slide-enter-from,
.menu-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.menu-slide-enter-to,
.menu-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.menu-slide-enter-active button {
  animation: menuItemIn 0.35s ease-out both;
}

.menu-slide-leave-active button {
  animation: menuItemOut 0.2s ease-in both;
}

@keyframes menuItemIn {
  0% {
    opacity: 0;
    transform: translateX(20px) scale(0.95);
  }

  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes menuItemOut {
  0% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }

  100% {
    opacity: 0;
    transform: translateX(15px) scale(0.95);
  }
}

/* 小屏适配 */
@media (max-width: 640px) {
  .menu-slide-enter-active button {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    font-size: 0.7rem;
  }
}
</style>