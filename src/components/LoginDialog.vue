<template>
    <div v-if="authStore.showLoginDialog"
        class="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9998]">
        <!-- 主容器：高度改为 min-h-[520px] -->
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 flex overflow-hidden min-h-[520px]">
            <!-- 左侧：品牌展示 -->
            <div
                class="w-2/5 bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex flex-col justify-center items-center">
                <h1
                    class="text-4xl font-extrabold tracking-wider bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent animate-slide-left leading-[1.2] pb-1">
                    scenery
                </h1>
                <p class="mt-3 text-sm text-gray-500 animate-slide-left" style="animation-delay: 0.15s;">
                    欢迎回来，请登录您的账户
                </p>
            </div>

            <!-- 右侧：登录表单 -->
            <div class="w-3/5 p-8 relative flex flex-col justify-center overflow-x-hidden">

                <!-- 过期提示 -->
                <div v-if="authStore.isTokenExpired"
                    class="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 text-center flex items-center justify-center gap-2 animate-slide-right"
                    style="animation-delay: 0.1s;">
                    <TriangleAlert class="w-5 h-5" />
                    登录已过期，请重新登录
                </div>

                <!-- "登录" 标题 -->
                <h2
                    class="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5 text-center animate-slide-right">
                    登录
                </h2>

                <form @submit.prevent="handleLogin" novalidate>
                    <!-- 用户名框 -->
                    <div class="mb-4">
                        <input v-model="username" type="text" placeholder="用户名" @input="errors.username = false" :class="[
                            'w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 outline-none transition',
                            errors.username
                                ? 'border-red-500 focus:ring-red-500 focus:border-transparent'
                                : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
                        ]" />
                    </div>
                    <!-- 密码框 -->
                    <div class="mb-5 relative">
                        <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="密码"
                            @input="errors.password = false" :class="[
                                'w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 outline-none transition pr-10',
                                errors.password
                                    ? 'border-red-500 focus:ring-red-500 focus:border-transparent'
                                    : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
                            ]" />
                        <button type="button" @click="showPassword = !showPassword"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                            <Eye v-if="showPassword" class="w-5 h-5" />
                            <EyeOff v-else class="w-5 h-5" />
                        </button>
                    </div>

                    <!-- 登录按钮：去掉了 disabled 限制与禁用样式 -->
                    <button type="submit" :disabled="loading"
                        class="w-full py-2.5 text-sm rounded-lg font-medium transition-all shadow-xs text-white bg-gradient-to-r from-blue-400 to-purple-500 hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ loading ? '登录中...' : '登录' }}
                    </button>
                    <div class="mt-4 text-center text-sm text-gray-500">
                        没有账号？
                        <button type="button" @click="authStore.openRegisterDialog()"
                            class="text-blue-500 hover:text-blue-600 transition-colors">
                            立即注册
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSessionStore } from '@/stores/sessionStore'
import { TriangleAlert, Eye, EyeOff } from '@lucide/vue'
import request from '@/utils/request'
import { toast } from '@/composables/useToast'

const authStore = useAuthStore()
const sessionStore = useSessionStore()
const username = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)

// 跟踪校验错误状态
const errors = reactive({
    username: false,
    password: false
})

const handleLogin = async () => {
    // 阻止重复提交
    if (loading.value) return

    // 重置错误状态
    errors.username = false
    errors.password = false

    // 点击提交时进行非空校验
    const isUserEmpty = !username.value.trim()
    const isPassEmpty = !password.value.trim()

    if (isUserEmpty || isPassEmpty) {
        if (isUserEmpty) {
            errors.username = true
            toast.show('请输入用户名', 'error')
        } else if (isPassEmpty) {
            errors.password = true
            toast.show('请输入密码', 'error')
        }
        return
    }

    loading.value = true
    try {
        const res: any = await request.post('/auth/login', {
            username: username.value,
            password: password.value
        })
        authStore.setLoginInfo(res.data)
        await sessionStore.getSessionList()
        authStore.closeLoginDialog()
    } catch (error: any) {
        toast.show(error.message || '登录失败', 'error')
    } finally {
        loading.value = false
    }
}

watch(() => authStore.showLoginDialog, (old, l) => {
    errors.username = false
    errors.password = false
})

</script>

<style scoped>
/* 动画保持不变 */
@keyframes slideInLeft {
    from {
        opacity: 0;
        transform: translateX(-30px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(30px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.animate-slide-left {
    animation: slideInLeft 0.6s ease-out both;
}

.animate-slide-right {
    animation: slideInRight 0.6s ease-out both;
}

/* 隐藏 Edge/IE 浏览器原生的密码显示图标 */
input::-ms-reveal,
input::-ms-clear {
    display: none;
}

/* 隐藏 Webkit (Chrome/Safari/Edge) 浏览器原生的密码/清除功能 */
input::-webkit-contacts-auto-fill-button,
input::-webkit-credentials-auto-fill-button {
    visibility: hidden;
    pointer-events: none;
    position: absolute;
    right: 0;
}
</style>