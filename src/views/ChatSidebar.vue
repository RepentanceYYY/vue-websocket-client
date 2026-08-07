<template>
    <aside
        class="bg-white border-r border-gray-200/60 flex flex-col shrink-0 transition-all duration-300 overflow-hidden"
        :class="collapsed ? 'w-0 border-r-0' : 'w-64'">
        <!-- 顶部区域：新建按钮 + 折叠按钮 -->
        <div class="p-4 border-b border-gray-100 flex items-center gap-2">
            <button @click="handleNewChat"
                class="flex-1 h-10 px-4 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white rounded-lg text-sm font-medium transition-all shadow-xs">
                <Plus class="w-4 h-4" />
                <span>新建聊天</span>
            </button>

            <button @click="handleToggleCollapse"
                class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="折叠侧边栏">
                <PanelLeftClose class="w-4 h-4" />
            </button>
        </div>

        <!-- 会话历史列表 -->
        <div class="flex-1 overflow-y-auto p-2 space-y-1">
            <div v-if="sessionStore.sessionLoding"
                class="py-12 flex flex-col items-center justify-center gap-2 text-xs text-gray-400 select-none">
                <Loader2 class="w-5 h-5 animate-spin text-indigo-500" />
                <span>加载中...</span>
            </div>

            <template v-else-if="sessionStore.sessionList.length > 0">
                <div v-for="session in sessionStore.sessionList" :key="session.sessionId"
                    @click="handleSelectSession(session.sessionId)"
                    class="group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors"
                    :class="currentSessionId === session.sessionId
                        ? 'bg-indigo-50 text-indigo-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-100/80'">

                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                        <MessageSquare class="w-4 h-4 shrink-0 text-gray-400 group-hover:text-indigo-500"
                            :class="{ 'text-indigo-600': currentSessionId === session.sessionId }" />

                        <span class="truncate">
                            {{ session.title || session.sessionId }}
                        </span>
                    </div>

                    <button @click.stop="handleDeleteSession(session.sessionId)"
                        class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all"
                        title="删除会话">
                        <Trash2 class="w-3.5 h-3.5" />
                    </button>
                </div>
            </template>

            <div v-else class="py-8 text-center text-xs text-gray-400 select-none">
                暂无历史会话
            </div>
        </div>

        <!-- 用户信息卡片 -->
        <div v-if="authStore.isLoggedIn" ref="userCardRef"
            class="border-t border-gray-100 p-3 flex items-center justify-between relative cursor-pointer"
            @click="toggleUserMenu">
            <div class="flex items-center gap-2.5 min-w-0">
                <div
                    class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold shrink-0">
                    {{ authStore.userAvatar }}
                </div>
                <span class="text-sm font-medium text-gray-700 truncate">{{ authStore.nickname || '用户' }}</span>
            </div>
            <div class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <MoreHorizontal class="w-4 h-4" />
            </div>
            <div v-if="showUserMenu"
                class="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200/60 py-1 z-20"
                @click.stop>
                <div class="px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 cursor-pointer transition-colors"
                    @click="handleProfile">
                    我的个人资料
                </div>
                <div class="px-4 py-2 hover:bg-gray-50 text-sm text-rose-600 cursor-pointer transition-colors"
                    @click="handleLogout">
                    退出
                </div>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {
    Plus,
    MessageSquare,
    Trash2,
    MoreHorizontal,
    Loader2,
    PanelLeftClose
} from '@lucide/vue'
import { useSessionStore } from '@/stores/sessionStore'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/composables/useToast'

const props = defineProps<{
    collapsed: boolean
    currentSessionId: string
}>()

const emit = defineEmits<{
    'select-session': [sessionId: string]
    'delete-session': [sessionId: string]
    'new-chat': []
    'toggle-collapse': []
}>()

const handleToggleCollapse = () => {
    emit('toggle-collapse')
}
const handleNewChat = () => {
    emit('new-chat')
}
const handleSelectSession = (sessionId: string) => {
    emit('select-session', sessionId)
}

const handleDeleteSession = (sessionId: string) => {
    emit('delete-session', sessionId)
}

const sessionStore = useSessionStore()
const authStore = useAuthStore()

const showUserMenu = ref(false)
const userCardRef = ref<HTMLElement | null>(null)

const toggleUserMenu = () => {
    showUserMenu.value = !showUserMenu.value
}

const handleProfile = () => {
    toast.show('个人资料功能开发中...', 'info')
    showUserMenu.value = false
}

const handleLogout = () => {
    authStore.logout()
    toast.show('已退出登录', 'success')
    showUserMenu.value = false
    // 父组件会通过 startNewChat 清空状态
    // 如果需要立即清空，可 emit 事件，但这里保持简单
}

const handleClickOutside = (event: MouseEvent) => {
    if (!showUserMenu.value) return

    if (userCardRef.value && !userCardRef.value.contains(event.target as Node)) {
        showUserMenu.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
    if (authStore.token) {
        sessionStore.getSessionList()
    }
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>