<template>
    <div v-if="authStore.showRegisterDialog"
        class="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9998]">
        <!-- 主容器：高度改为 min-h-[520px] -->
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 flex overflow-hidden min-h-[520px]">
            <!-- 左侧品牌 -->
            <div
                class="w-2/5 bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex flex-col justify-center items-center">
                <h1
                    class="text-4xl font-extrabold tracking-wider bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent animate-slide-left leading-[1.2] pb-1">
                    scenery
                </h1>
                <p class="mt-3 text-sm text-gray-500 animate-slide-left" style="animation-delay:0.15s">创建您的专属账户</p>
            </div>

            <!-- 右侧注册 -->
            <div class="w-3/5 p-6 pt-4 relative flex flex-col justify-center overflow-y-auto overflow-x-hidden">
                <form @submit.prevent="handleRegister" novalidate>
                    <!-- 注册标题 -->
                    <h2
                        class="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5 text-center animate-slide-right">
                        注册</h2>

                    <!-- 昵称 -->
                    <div class="mb-3">
                        <input v-model="nickname" type="text" placeholder="昵称" @input="clearError('nickname')" :class="[
                            'w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 outline-none transition',
                            errors.nickname
                                ? 'border-red-500 focus:ring-red-500 focus:border-transparent'
                                : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
                        ]" />
                    </div>

                    <!-- 用户名 -->
                    <div class="mb-3">
                        <input v-model="username" type="text" placeholder="用户名" @input="clearError('username')" :class="[
                            'w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 outline-none transition',
                            errors.username
                                ? 'border-red-500 focus:ring-red-500 focus:border-transparent'
                                : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
                        ]" />
                    </div>

                    <!-- 密码 -->
                    <div class="mb-3 relative">
                        <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="密码"
                            @input="clearError('password')" :class="[
                                'w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 outline-none transition pr-10',
                                errors.password
                                    ? 'border-red-500 focus:ring-red-500 focus:border-transparent'
                                    : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
                            ]" />
                        <button type="button" @click="showPassword = !showPassword"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                            <Eye v-if="showPassword" class="w-5 h-5" />
                            <EyeOff v-else class="w-5 h-5" />
                        </button>
                    </div>

                    <!-- 邮箱 -->
                    <div class="mb-3">
                        <input v-model="email" type="email" placeholder="邮箱地址" @input="clearError('email')" :class="[
                            'w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 outline-none transition',
                            errors.email
                                ? 'border-red-500 focus:ring-red-500 focus:border-transparent'
                                : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
                        ]" />
                    </div>

                    <!-- 验证码 -->
                    <div class="mb-5 relative">
                        <input v-model="code" type="text" placeholder="邮箱验证码" @input="clearError('code')" :class="[
                            'w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 outline-none transition pr-[110px]',
                            errors.code
                                ? 'border-red-500 focus:ring-red-500 focus:border-transparent'
                                : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
                        ]" />
                        <button type="button" @click="sendCode" :disabled="countdown > 0"
                            class="absolute right-1 top-1/2 -translate-y-1/2 px-4 py-1.5 text-sm rounded-lg text-white font-medium transition bg-gradient-to-r from-blue-400 to-purple-500 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed">
                            {{ codeText }}
                        </button>
                    </div>

                    <!-- 注册按钮 -->
                    <button type="submit" :disabled="loading"
                        class="w-full py-2.5 text-sm rounded-lg font-medium transition-all shadow-xs text-white bg-gradient-to-r from-blue-400 to-purple-500 hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ loading ? '注册中...' : '注册' }}
                    </button>

                    <!-- 底部 -->
                    <div class="mt-4 text-center text-sm text-gray-500">
                        已有账号？
                        <button type="button" @click="backToLogin"
                            class="text-blue-500 hover:text-blue-600 transition">返回登录</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/composables/useToast'
import request from '@/utils/request'

const authStore = useAuthStore()

// 表单字段
const nickname = ref('')
const username = ref('')
const password = ref('')
const email = ref('')
const code = ref('')
const loading = ref(false)
const showPassword = ref(false)
const countdown = ref(0)

// 跟踪各字段错误状态
const errors = reactive({
    nickname: false,
    username: false,
    password: false,
    email: false,
    code: false
})

// 验证码按钮文字
const codeText = computed(() =>
    countdown.value > 0 ? `${countdown.value}s` : '获取验证码'
)

// 清除单个字段错误（输入字符时触发）
const clearError = (field: keyof typeof errors) => {
    errors[field] = false
}

// 清除所有错误状态
const resetErrors = () => {
    Object.keys(errors).forEach(key => {
        errors[key as keyof typeof errors] = false
    })
}

// 前端校验函数
const validateForm = (): boolean => {
    resetErrors()

    let firstErrorMessage = ''

    // 按顺序逐个校验并弹窗提示第一个错误
    if (!nickname.value.trim()) {
        errors.nickname = true
        firstErrorMessage = firstErrorMessage || '请输入昵称'
    }
    if (!username.value.trim()) {
        errors.username = true
        firstErrorMessage = firstErrorMessage || '请输入用户名'
    }
    if (!password.value.trim()) {
        errors.password = true
        firstErrorMessage = firstErrorMessage || '请输入密码'
    } else if (password.value.length < 6) {
        errors.password = true
        firstErrorMessage = firstErrorMessage || '密码长度不能少于6位'
    }

    const emailReg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!email.value.trim()) {
        errors.email = true
        firstErrorMessage = firstErrorMessage || '请输入邮箱地址'
    } else if (!emailReg.test(email.value.trim())) {
        errors.email = true
        firstErrorMessage = firstErrorMessage || '请输入正确的邮箱格式'
    }

    if (!code.value.trim()) {
        errors.code = true
        firstErrorMessage = firstErrorMessage || '请输入验证码'
    }

    if (firstErrorMessage) {
        toast.show(firstErrorMessage, 'error')
        return false
    }

    return true
}

// 发送验证码
const sendCode = async () => {
    errors.email = false
    const emailReg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    if (!email.value.trim()) {
        errors.email = true
        toast.show('请输入邮箱地址', 'error')
        return
    } else if (!emailReg.test(email.value.trim())) {
        errors.email = true
        toast.show('请输入正确的邮箱格式', 'error')
        return
    }

    if (countdown.value > 0) return

    try {
        await request.post('/auth/send-email-code', { email: email.value })
        toast.show('验证码已发送', 'success')

        // 开始倒计时
        countdown.value = 60
        const timer = setInterval(() => {
            countdown.value--
            if (countdown.value <= 0) clearInterval(timer)
        }, 1000)
    } catch (error: any) {
        toast.show(error.message || '验证码发送失败', 'error')
    }
}

// 返回登录
const backToLogin = () => {
    authStore.closeRegisterDialog()
    authStore.openLoginDialog()
}

// 注册提交
const handleRegister = async () => {
    if (loading.value) return

    // 执行前端校验
    if (!validateForm()) return

    loading.value = true
    try {
        const payload = {
            nickname: nickname.value,
            username: username.value,
            rawPassword: password.value,
            email: email.value,
            code: code.value
        }
        const res: any = await request.post('/auth/register', payload)
        authStore.setLoginInfo(res.data)
        authStore.closeRegisterDialog()
    } catch (e: any) {
        toast.show(e.message || '注册失败', 'error')
    } finally {
        loading.value = false
    }
}

watch(() => authStore.showRegisterDialog, (old, l) => {
    errors.nickname = false
    errors.username = false
    errors.password = false
    errors.email = false
    errors.code = false
})

</script>

<style scoped>
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
    animation: slideInLeft .6s ease-out both;
}

.animate-slide-right {
    animation: slideInRight .6s ease-out both;
}

/* 隐藏密码框的浏览器自带显示密码图标 */
input::-ms-reveal,
input::-ms-clear {
    display: none;
}
</style>