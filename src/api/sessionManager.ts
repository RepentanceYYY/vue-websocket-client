import request from '@/utils/request'

export const fetchSessionList = async () => {
    const res = await request.get("/ai/session/list")
    return res;
}

export const remoteDeleteSession = async (targetSessionId: string) => {
    await request.delete(`/ai/session/delete/${targetSessionId}`)
}

export const fetchSessionMessages = async(sessionId:string)=>{
    const res = await request.get(`/ai/session/messages/${sessionId}`)
    return res;
}