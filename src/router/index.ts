import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

// 路由规则数组
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  }
]

// 创建 router 实例，改用 hash 模式
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
