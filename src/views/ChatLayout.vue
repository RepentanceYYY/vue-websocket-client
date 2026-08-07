<template>
    <div class="relative flex h-full w-full bg-gray-50/30 text-gray-700 min-h-0 overflow-hidden">

        <!-- 左侧会话菜单栏 -->
        <ChatSidebar v-if="authStore.isLoggedIn" :collapsed="sidebarCollapsed" :current-session-id="currentSessionId"
            @select-session="handleSelectSession" @delete-session="handleDeleteSession" @new-chat="startNewChat"
            @toggle-collapse="toggleSidebar" />

        <!-- 右侧主对话界面 -->
        <ChatPanel ref="chatPanelRef" :session-id="currentSessionId" :sidebar-collapsed="sidebarCollapsed"
            @update:session-id="currentSessionId = $event" @session-created="onSessionCreated"
            @toggle-sidebar="toggleSidebar" />

        <!-- 全局弹窗 -->
        <LoginDialog />
        <RegisterDialog />
        <ToastContainer />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSessionStore } from '@/stores/sessionStore'
import ChatSidebar from './ChatSidebar.vue'
import ChatPanel from './ChatPanel.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import RegisterDialog from '@/components/RegisterDialog.vue'
import ToastContainer from '@/components/ToastContainer.vue'

const authStore = useAuthStore()
const sessionStore = useSessionStore()

const currentSessionId = ref('')
const sidebarCollapsed = ref(false)
const chatPanelRef = ref<InstanceType<typeof ChatPanel> | null>(null)

const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
}

const startNewChat = () => {
    currentSessionId.value = ''
    // 通知右侧清空消息
    chatPanelRef.value?.clearMessages()
}

const handleSelectSession = async (sessionId: string) => {
    currentSessionId.value = sessionId
    // 右侧组件会通过 watch sessionId 自动加载历史消息
}

const handleDeleteSession = async (targetSessionId: string) => {
    try {
        await sessionStore.deleteSession(targetSessionId)

        if (currentSessionId.value === targetSessionId) {
            startNewChat()
        }
    } catch (error: any) {
        // 错误已在 store 内处理或忽略
    }
}

// 收到右侧创建新会话的回调
const onSessionCreated = (newSessionId: string,firstMessage:string) => {
    // 设置当前激活的会话 ID
    currentSessionId.value = newSessionId

    // 将新会话推入左侧 Store 列表中（自动顶到最前面）
    sessionStore.addSession(newSessionId, firstMessage)
}
</script>