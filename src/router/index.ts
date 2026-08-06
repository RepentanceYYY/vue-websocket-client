import { createRouter, createWebHashHistory, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Chat',
    component: () => import('@/views/Chat.vue')
  },
  {
    path: '/terminal',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/faceCapture',
    name: 'FaceCapture',
    component: () => import('@/views/FaceCapture.vue')
  },
  {
    path: '/image',
    name: 'Image',
    component: () => import('@/views/Image.vue')
  }
]

// 创建 router 实例
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router