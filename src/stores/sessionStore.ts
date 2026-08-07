import { defineStore } from "pinia";
import { fetchSessionList, remoteDeleteSession, fetchSessionMessages } from '@/api/sessionManager'
import { ref } from "vue";
import type { IAiChatSession } from "@/types/twinbrain";
import { toast } from '@/composables/useToast'

export const useSessionStore = defineStore('sessionStore', () => {

    const sessionLoding = ref(false)
    const sessionList = ref<IAiChatSession[]>([])

    /**
     * 新增会话到列表最上方（防重）
     */
    const addSession = (sessionId: string, initialTitle: string = '新会话') => {
        const exists = sessionList.value.some(s => s.sessionId === sessionId)
        if (!exists) {
            // 如果传入了消息，截取前 12 个字作为临时标题
            const displayTitle = initialTitle.length > 15
                ? initialTitle.substring(0, 15) + '...'
                : initialTitle

            sessionList.value.unshift({
                sessionId,
                title: displayTitle
            })
        }
    }

    const updateSessionTitle = (sessionId: string, newTitle: string) => {
        const session = sessionList.value.find(s => s.sessionId === sessionId)
        if (session) {
            session.title = newTitle
        }
    }

    const getSessionList = async () => {
        sessionLoding.value = true
        try {
            const res: any = await fetchSessionList();
            sessionList.value = res.data || [];
        } catch (error: any) {
            toast.show(error.message || '获取会话列表失败', 'error')
        } finally {
            sessionLoding.value = false
        }
    }

    const deleteSession = async (targetSessionId: string) => {
        try {
            await remoteDeleteSession(targetSessionId)
            sessionList.value = sessionList.value.filter(session => session.sessionId !== targetSessionId)
            toast.show('删除成功', 'success')
        } catch (error: any) {
            toast.show(error.message, 'error')
        }
    }

    const getSessionMessages = async (sessionId: string) => {
        return await fetchSessionMessages(sessionId);
    }

    return {
        sessionLoding,
        sessionList,
        getSessionList,
        addSession,
        updateSessionTitle,
        deleteSession,
        getSessionMessages
    }
})