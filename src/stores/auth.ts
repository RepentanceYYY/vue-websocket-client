import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义 IP 信息接口
interface IpInfo {
    address: string
    country: string
    endLong: number
    isp: string
    lat: number
    lng: number
    overseas: boolean
    province: string
    startLong: number
}

// 定义登录返回数据接口（与后端一致）
interface LoginData {
    token: string
    userId: number
    nickname: string
    avatar: string
    ipInfo: IpInfo
}

export const useAuthStore = defineStore('authStore', () => {

    const showLoginDialog = ref(false)
    const isTokenExpired = ref(false)
    const token = ref<string | null>(sessionStorage.getItem('token'))
    const userId = ref<number | null>(
        sessionStorage.getItem('userId') ? Number(sessionStorage.getItem('userId')) : null
    )
    const nickname = ref<string | null>(sessionStorage.getItem('nickname'))
    const avatar = ref<string | null>(sessionStorage.getItem('avatar'))
    const ipInfo = ref<IpInfo | null>(
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
        isTokenExpired.value = expired
    }

    const closeLoginDialog = () => {
        showLoginDialog.value = false
        isTokenExpired.value = false
    }

    // ---------- 方法 ----------
    /**
     * 设置登录信息（登录成功后调用）
     * @param data - 接口返回的 data 对象
     * @param time - 可选，登录时间（可由调用方传入，如 new Date().toISOString()）
     */
    const setLoginInfo = (data: LoginData, time?: string) => {
        token.value = data.token
        userId.value = data.userId
        nickname.value = data.nickname
        avatar.value = data.avatar
        ipInfo.value = data.ipInfo
        loginTime.value = time || new Date().toISOString()

        showLoginDialog.value = false
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
        isTokenExpired.value = false

        // 清空所有 sessionStorage（或只清除本应用使用的键）
        sessionStorage.clear()
        // 若担心清除其他数据，可逐个移除：
        // sessionStorage.removeItem('token')
        // sessionStorage.removeItem('userId')
        // ...
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
    }
})