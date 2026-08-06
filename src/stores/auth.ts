import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { type IIpInfo, type ILoginData } from '@/types/twinbrain'

export const useAuthStore = defineStore('authStore', () => {

    const showLoginDialog = ref(false)
    const showRegisterDialog = ref(false)
    const isTokenExpired = ref(false)
    const token = ref<string | null>(sessionStorage.getItem('token'))
    const userId = ref<number | null>(
        sessionStorage.getItem('userId') ? Number(sessionStorage.getItem('userId')) : null
    )
    const nickname = ref<string | null>(sessionStorage.getItem('nickname'))
    const avatar = ref<string | null>(sessionStorage.getItem('avatar'))
    const ipInfo = ref<IIpInfo | null>(
        sessionStorage.getItem('ipInfo') ? JSON.parse(sessionStorage.getItem('ipInfo')!) : null
    )

    const loginTime = ref<string | null>(sessionStorage.getItem('loginTime'))


    const isLoggedIn = computed(() => !!token.value)

    const userAvatar = computed(() => {
        const name = nickname.value
        return name ? name.charAt(0).toUpperCase() : '未'
    })

    const currentUser = computed(() => ({
        userId: userId.value,
        nickname: nickname.value,
        avatar: avatar.value
    }))

    // 获取登录 IP 地址（从 ipInfo 中提取）
    const loginIp = computed(() => ipInfo.value?.address || '')

    // 获取登录位置（省/国家等，可按需组合）
    const location = computed(() => {
        const info = ipInfo.value
        if (!info) return null
        // 示例：组合 国家+省份，或仅使用 address
        return info.address || null
    })

    const openLoginDialog = (expired: boolean = false) => {
        showLoginDialog.value = true
        showRegisterDialog.value = false
        isTokenExpired.value = expired
    }


    const closeLoginDialog = () => {
        showLoginDialog.value = false
        isTokenExpired.value = false
    }


    const openRegisterDialog = () => {
        showRegisterDialog.value = true
        showLoginDialog.value = false
    }


    const closeRegisterDialog = () => {
        showRegisterDialog.value = false
    }

    // ---------- 方法 ----------
    /**
     * 设置登录信息（登录成功后调用）
     * @param data - 接口返回的 data 对象
     * @param time - 可选，登录时间（可由调用方传入，如 new Date().toISOString()）
     */
    const setLoginInfo = (data: ILoginData, time?: string) => {
        token.value = data.token
        userId.value = data.userId
        nickname.value = data.nickname
        avatar.value = data.avatar
        ipInfo.value = data.ipInfo
        loginTime.value = time || new Date().toISOString()

        showLoginDialog.value = false
        showRegisterDialog.value = false
        isTokenExpired.value = false

        // 持久化到 sessionStorage
        sessionStorage.setItem('token', data.token)
        sessionStorage.setItem('userId', String(data.userId))
        sessionStorage.setItem('nickname', data.nickname)
        sessionStorage.setItem('avatar', data.avatar)
        sessionStorage.setItem('ipInfo', JSON.stringify(data.ipInfo))
        sessionStorage.setItem('loginTime', loginTime.value)
    }

    /**
     * 退出登录，清空所有状态
     */
    const logout = () => {
        token.value = null
        userId.value = null
        nickname.value = null
        avatar.value = null
        ipInfo.value = null
        loginTime.value = null

        showLoginDialog.value = false
        showRegisterDialog.value = false
        isTokenExpired.value = false

        // 清空所有 sessionStorage
        sessionStorage.clear()
    }

    return {
        // 状态
        token,
        userId,
        nickname,
        avatar,
        ipInfo,
        loginTime,
        showLoginDialog,
        showRegisterDialog,
        isTokenExpired,
        // 计算属性
        isLoggedIn,
        userAvatar,
        currentUser,
        loginIp,
        location,
        // 方法
        setLoginInfo,
        logout,
        openLoginDialog,
        closeLoginDialog,
        openRegisterDialog,
        closeRegisterDialog,
    }
})