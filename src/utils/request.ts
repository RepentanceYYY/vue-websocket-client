// utils/request.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/composables/useToast'

const service = axios.create({
    baseURL: import.meta.env.VITE_CHAT_API_BASE_URL,
    timeout: 5000,
})

// 请求拦截器（不变）
service.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore()
        if (authStore.token) {
            config.headers['Authorization'] = `Bearer ${authStore.token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// 响应拦截器
service.interceptors.response.use(
    (response) => {
        const res = response.data
        if (res && res.code !== 200) {
            return Promise.reject(new Error(res.message || '业务请求失败'))
        }
        return res
    },
    (error) => {
        const authStore = useAuthStore()

        // 处理 401 未授权
        if (error.response?.status === 401) {
            const hasToken = !!authStore.token

            if (hasToken) {
                // 本地有 token，提示登录过期
                toast.show('登录已过期，请重新登录', 'warning', 4000)
                // 自动清除过期 token（可选，避免后续请求携带）
                authStore.logout() // 会清空 token 但保留模态框状态
            }

            // 弹出登录模态框
            authStore.openLoginDialog(hasToken) // 传入是否过期标志

            // 阻断后续 then
            return Promise.reject(new Error('未授权，请登录'))
        }

        // 其他 HTTP 错误处理（保持不变）
        let message = '网络请求失败'
        if (error.response) {
            message = error.response.data?.message || `服务器响应错误: ${error.response.status}`
        } else if (error.request) {
            message = '服务器无响应，请检查网络连接'
        } else {
            message = error.message
        }
        return Promise.reject(new Error(message))
    }
)

export default service