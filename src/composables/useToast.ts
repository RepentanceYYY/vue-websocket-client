import { reactive } from 'vue'

export interface ToastItem {
    id: number
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    duration: number // 毫秒，0 表示不自动消失
}

const state = reactive<{ toasts: ToastItem[] }>({
    toasts: []
})

let counter = 0

export const toast = {
    show(message: string, type: ToastItem['type'] = 'info', duration = 3000) {
        // 限制最大数量为 2：如果已有 2 条，移除最旧的一条
        if (state.toasts.length >= 2) {
            // 移除第一个（最旧）
            state.toasts.shift()
            // 注意：被移除的 toast 如果有定时器，它仍会执行但 filter 会忽略它，无影响
        }

        const id = counter++
        const item: ToastItem = { id, message, type, duration }
        state.toasts.push(item)

        if (duration > 0) {
            setTimeout(() => {
                state.toasts = state.toasts.filter(t => t.id !== id)
            }, duration)
        }
    },

    remove(id: number) {
        state.toasts = state.toasts.filter(t => t.id !== id)
    },

    get state() {
        return state
    }
}