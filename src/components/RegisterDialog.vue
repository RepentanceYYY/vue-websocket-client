<template>
    <div v-if="authStore.showRegisterDialog"
        class="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9998]">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 flex overflow-hidden min-h-[580px]">
            <!-- 左侧品牌 -->
            <div
                class="w-2/5 bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex flex-col justify-center items-center">
                <h1
                    class="text-4xl font-extrabold tracking-wider bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent animate-slide-left leading-[1.2] pb-1">
                    scenery</h1>
                <p class="mt-3 text-sm text-gray-500 animate-slide-left" style="animation-delay:0.15s">创建您的专属账户</p>
            </div>
            <!-- 右侧注册 -->
            <div class="w-3/5 p-6 pt-4 relative flex flex-col justify-center overflow-y-auto">
                <form @submit.prevent="handleRegister">
                    <!-- 头像上传 (放大+上移) -->
                    <div class="flex flex-col items-center -mt-1 mb-4">
                        <div class="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 hover:border-indigo-400 cursor-pointer overflow-hidden flex items-center justify-center bg-gray-50 transition hover:shadow-md"
                            @click="triggerFileInput">
                            <img v-if="avatarPreview" :src="avatarPreview" class="w-full h-full object-cover" />
                            <Camera v-else class="w-10 h-10 text-gray-400" />
                        </div>
                        <span class="text-xs text-gray-400 mt-1.5">点击上传头像</span>
                        <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="handleFileChange" />
                    </div>
                    <!-- 昵称 -->
                    <div class="mb-3">
                        <input v-model="nickname" type="text" placeholder="昵称"
                            class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
                    </div>
                    <!-- 用户名 -->
                    <div class="mb-3">
                        <input v-model="username" type="text" placeholder="用户名"
                            class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
                    </div>
                    <!-- 密码 -->
                    <div class="mb-3 relative">
                        <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="密码"
                            class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition pr-10" />
                        <button type="button" @click="showPassword = !showPassword"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <Eye v-if="showPassword" class="w-5 h-5" />
                            <EyeOff v-else class="w-5 h-5" />
                        </button>
                    </div>
                    <!-- 邮箱 -->
                    <div class="mb-3">
                        <input v-model="email" type="email" placeholder="邮箱地址"
                            class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
                    </div>
                    <!-- 验证码 -->
                    <div class="mb-5 flex gap-2">
                        <input v-model="code" type="text" placeholder="邮箱验证码"
                            class="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
                        <button type="button" @click="sendCode"
                            class="px-4 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition">{{
                            codeText }}</button>
                    </div>
                    <!-- 注册按钮 -->
                    <button type="submit" :disabled="loading"
                        :class="['w-full py-2.5 text-sm rounded-lg font-medium transition-all shadow-xs', isFormValid ? 'text-white bg-gradient-to-r from-blue-400 to-purple-500 hover:opacity-90' : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed']">
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
import { ref, computed } from 'vue'
import { Eye, EyeOff, Camera } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/composables/useToast'

const authStore = useAuthStore()

const avatar = ref('')
const avatarPreview = ref('')
const nickname = ref('')
const username = ref('')
const password = ref('')
const email = ref('')
const code = ref('')
const loading = ref(false)
const showPassword = ref(false)
const countdown = ref(0)
const fileInput = ref<HTMLInputElement | null>(null)

const codeText = computed(() => countdown.value > 0 ? `${countdown.value}s` : '获取验证码')

const isFormValid = computed(() => {
    return nickname.value.trim() && username.value.trim() && password.value.trim() && email.value.trim() && code.value.trim()
})

const triggerFileInput = () => {
    fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
        const result = e.target?.result as string
        avatarPreview.value = result
        avatar.value = result
    }
    reader.readAsDataURL(file)
    target.value = ''
}

const sendCode = () => {
    if (!email.value) {
        toast.show('请输入邮箱地址', 'error')
        return
    }
    if (countdown.value > 0) return
    toast.show('验证码已发送', 'success')
    countdown.value = 60
    const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
}

const backToLogin = () => {
    authStore.closeRegisterDialog()
    authStore.openLoginDialog()
}

const handleRegister = async () => {
    if (!nickname.value) { toast.show('请输入昵称', 'error'); return }
    if (!username.value) { toast.show('请输入用户名', 'error'); return }
    if (!password.value) { toast.show('请输入密码', 'error'); return }
    if (!email.value) { toast.show('请输入邮箱', 'error'); return }
    if (!code.value) { toast.show('请输入验证码', 'error'); return }
    loading.value = true
    try {
        console.log({ avatar: avatar.value, nickname: nickname.value, username: username.value, password: password.value, email: email.value, code: code.value })
        toast.show('注册成功', 'success')
        authStore.closeRegisterDialog()
    } catch (e: any) {
        toast.show(e.message, 'error')
    } finally {
        loading.value = false
    }
}
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

input::-ms-reveal,
input::-ms-clear {
    display: none;
}
</style>