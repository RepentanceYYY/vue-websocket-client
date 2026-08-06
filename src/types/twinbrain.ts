export interface IAiChatSession {
    id?: number;
    sessionId: string;
    userId?: number;
    title?: string;
    summary?: string;
    systemPrompt?: string;
    model?: string;
    createTime?: string;
    updateTime?: string;
}

export interface IMessage {
    role: "user" | "assistant";
    content: string;
}

// 定义 IP 信息接口
export interface IIpInfo {
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

// 定义登录返回数据接口
export interface ILoginData {
    token: string
    userId: number
    nickname: string
    avatar: string
    ipInfo: IIpInfo
}

