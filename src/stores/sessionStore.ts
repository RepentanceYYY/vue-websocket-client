import { defineStore } from "pinia";
import { fetchSessionList, remoteDeleteSession } from '@/api/sessionManager'
import { ref } from "vue";
import type { IAiChatSession } from "@/types/twinbrain";
import { toast } from '@/composables/useToast'

export const useSessionStore = defineStore('sessionStore', () => {

    const sessionLoding = ref(false)
    const sessionList = ref<IAiChatSession[]>([])

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

    return {
        sessionLoding,
        sessionList,
        getSessionList,
        deleteSession
    }
})