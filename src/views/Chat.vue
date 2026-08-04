<template>
    <div class="flex h-full w-full bg-gray-50/30 text-gray-700 min-h-0 overflow-hidden">
        <!-- 左侧会话菜单栏 -->
        <aside class="w-64 bg-white border-r border-gray-200/60 flex flex-col shrink-0">
            <!-- 顶部新建按钮 -->
            <div class="p-4 border-b border-gray-100">
                <button @click="startNewChat"
                    class="w-full h-10 px-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs">
                    <Plus class="w-4 h-4" />
                    <span>新建聊天</span>
                </button>
            </div>
            <!-- 会话历史列表 -->
            <div class="flex-1 overflow-y-auto p-2 space-y-1">
                <div v-for="session in sessionList" :key="session.sessionId" @click="selectSession(session)"
                    class="group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors"
                    :class="sessionId === session.sessionId ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-100/80'">
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                        <MessageSquare class="w-4 h-4 shrink-0 text-gray-400 group-hover:text-indigo-500"
                            :class="{ 'text-indigo-600': sessionId === session.sessionId }" />
                        <span class="truncate">{{ session.title || session.sessionId }}</span>
                    </div>
                    <!-- 删除按钮 -->
                    <button @click.stop="deleteSession(session.sessionId)"
                        class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all"
                        title="删除会话">
                        <Trash2 class="w-3.5 h-3.5" />
                    </button>
                </div>
                <div v-if="sessionList.length === 0" class="py-8 text-center text-xs text-gray-400 select-none">
                    暂无历史会话
                </div>
            </div>
        </aside>

        <!-- 右侧主对话界面（已修改：移除 space-y-4 和 p-6，背景与左侧自然衔接） -->
        <main class="flex-1 flex flex-col h-full min-w-0 min-h-0 bg-white">
            <!-- 聊天内容区域（已修改：移除卡片边框/外阴影/圆角，拉满高度） -->
            <div ref="chatContainer" class="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 select-text">
                <!-- 空白状态（已优化：无图标、居中大气文案） -->
                <div v-if="messages.length === 0" class="h-full flex items-center justify-center select-none">
                    <h2 class="text-xl font-semibold text-gray-700/80 tracking-wide">
                        你好，我是Lisa，有什么我可以帮您的吗？
                    </h2>
                </div>
                <!-- 消息列表 -->
                <div v-for="(msg, index) in messages" :key="index" class="flex gap-3"
                    :class="msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white shadow-xs"
                        :class="msg.role === 'user' ? 'bg-indigo-600' : 'bg-emerald-600'">
                        <User v-if="msg.role === 'user'" class="w-4 h-4" />
                        <Bot v-else class="w-4 h-4" />
                    </div>
                    <div class="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-xs"
                        :class="msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-100/80 text-gray-800 border border-gray-200/50 rounded-tl-none'">
                        <div class="text-[10px] opacity-70 mb-1 font-medium select-none">
                            {{ msg.role === 'user' ? '用户' : 'Lisa' }}
                        </div>
                        <div>{{ msg.content }}</div>
                    </div>
                </div>
                <!-- AI加载 -->
                <div v-if="loading && messages[messages.length - 1]?.content === ''" class="flex gap-3 items-center">
                    <div class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
                        <Bot class="w-4 h-4" />
                    </div>
                    <div
                        class="bg-gray-100/80 border border-gray-200/50 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-gray-500 flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span
                            class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse [animation-delay:200ms]"></span>
                        <span
                            class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse [animation-delay:400ms]"></span>
                        <span class="ml-1 text-gray-400">正在思考与生成...</span>
                    </div>
                </div>
            </div>

            <!-- 输入区域：胶囊形态 + 内嵌圆形发送按钮 -->
            <div class="p-4 pt-0 shrink-0 max-w-4xl mx-auto w-full">
                <div
                    class="relative bg-gray-50/80 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 border border-gray-200/90 rounded-[26px] shadow-sm transition-all duration-200 flex items-end p-1.5 pr-2">
                    <!-- 多行文本输入框 -->
                    <textarea ref="textareaRef" v-model="input" rows="1" placeholder="输入消息... (Enter发送，Shift+Enter换行)"
                        class="resize-none flex-1 px-4 py-2.5 bg-transparent border-none outline-none text-sm text-gray-800 leading-5 overflow-y-auto max-h-36 placeholder:text-gray-400"
                        :style="{ height: textareaHeight + 'px' }" @input="adjustTextareaHeight"
                        @keydown.enter.exact.prevent="send" />

                    <!-- 右侧内嵌按钮区域 -->
                    <div class="flex items-center shrink-0 mb-1">
                        <!-- 停止生成按钮 (圆形) -->
                        <button v-if="loading" @click="stop"
                            class="w-8 h-8 flex items-center justify-center bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full transition-all shadow-xs"
                            title="停止生成">
                            <Square class="w-3.5 h-3.5 fill-current" />
                        </button>

                        <!-- 向上箭头发送按钮 (圆形胶囊风格) -->
                        <button v-else @click="send" :disabled="!input.trim()"
                            class="w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-30 disabled:hover:bg-indigo-600 disabled:active:scale-100 text-white rounded-full transition-all shadow-xs"
                            title="发送消息">
                            <ArrowUp class="w-4 h-4 stroke-[2.5]" />
                        </button>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { User, Bot, Send, Square, Plus, MessageSquare, Trash2, ArrowUp } from "@lucide/vue";
import axios from "axios";

const baseUrl = `http://192.168.1.99:52001`;
const api = axios.create({
    baseURL: baseUrl,
    timeout: 60000,
});

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface AiChatSession {
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

const sessionId = ref("");
const input = ref("");
const loading = ref(false);
const messages = ref<Message[]>([]);
const sessionList = ref<AiChatSession[]>([]);
const chatContainer = ref<HTMLDivElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const isMultiLine = ref(false);
const textareaHeight = ref(40);
let abortController: AbortController | null = null;

onMounted(() => {
    fetchSessionList();
});

const fetchSessionList = async () => {
    try {
        const res = await api.get("/ai/session/list");
        const result = res.data;
        if (result.code === 200 || result.success) {
            sessionList.value = result.data || [];
        }
    } catch (error) {
        console.error("获取会话列表失败:", error);
    }
};

const startNewChat = () => {
    sessionId.value = "";
    messages.value = [];
    fetchSessionList();
};

const selectSession = (session: AiChatSession) => {
    sessionId.value = session.sessionId;
};

const deleteSession = async (targetSessionId: string) => {
    try {
        const res = await api.delete(`/ai/session/delete/${targetSessionId}`);
        const result = res.data;
        if (result.code === 200 || result.success) {
            if (sessionId.value === targetSessionId) {
                startNewChat();
            } else {
                fetchSessionList();
            }
        }
    } catch (error) {
        console.error("删除会话失败:", error);
    }
};

const createNewSession = async (): Promise<string | null> => {
    try {
        const res = await api.post("/ai/session/create");
        const result = res.data;
        if (result.code === 200 || result.success) {
            return result.data;
        }
    } catch (error) {
        console.error("创建新会话失败:", error);
    }
    return null;
};

const adjustTextareaHeight = () => {
    const el = textareaRef.value;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 20;
    const padding = 20;
    const singleHeight = 40;
    const maxHeight = lineHeight * 5 + padding;
    const height = el.scrollHeight;
    if (height <= singleHeight + 2) {
        isMultiLine.value = false;
        textareaHeight.value = singleHeight;
    } else {
        isMultiLine.value = true;
        textareaHeight.value = Math.min(height, maxHeight);
    }
};

const send = async () => {
    if (!input.value.trim() || loading.value) return;
    if (!sessionId.value) {
        const newId = await createNewSession();
        if (newId) {
            sessionId.value = newId;
            fetchSessionList();
        } else {
            alert("创建新会话失败，请重试");
            return;
        }
    }
    const text = input.value;
    input.value = "";
    isMultiLine.value = false;
    textareaHeight.value = 40;
    messages.value.push({ role: "user", content: text });
    const aiMsg: Message = { role: "assistant", content: "" };
    messages.value.push(aiMsg);
    loading.value = true;
    await scrollBottom();
    abortController = new AbortController();
    try {
        const response = await fetch(`${baseUrl}/ai/chat/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sessionId: sessionId.value,
                message: text,
            }),
            signal: abortController.signal,
        });
        if (!response.ok) {
            throw new Error(`请求失败:${response.status}`);
        }
        if (!response.body) {
            throw new Error("浏览器不支持流式响应");
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split("\n\n");
            buffer = events.pop() || "";
            for (const event of events) {
                let eventName = "";
                let data = "";
                const lines = event.split("\n");
                for (const line of lines) {
                    if (line.startsWith("event:")) {
                        eventName = line.substring(6).trim();
                    }
                    if (line.startsWith("data:")) {
                        data = line.substring(5).trim();
                    }
                }
                if (eventName === "done") {
                    console.log("SSE完成");
                    break;
                }
                if (eventName === "message" && data) {
                    aiMsg.content += data;
                    scrollBottom();
                }
            }
        }
    } catch (e: any) {
        if (e.name === "AbortError") {
            console.log("用户停止生成");
        } else {
            console.error("SSE请求失败:", e);
            aiMsg.content += "\n\n❌ 请求失败:" + e.message;
        }
    } finally {
        loading.value = false;
        abortController = null;
        await scrollBottom();
    }
};

const stop = () => {
    if (abortController) {
        abortController.abort();
        abortController = null;
    }
    loading.value = false;
};

const scrollBottom = async () => {
    await nextTick();
    const el = chatContainer.value;
    if (el) {
        el.scrollTop = el.scrollHeight;
    }
};
</script>

<style scoped>
div::-webkit-scrollbar,
textarea::-webkit-scrollbar {
    width: 5px;
}

div::-webkit-scrollbar-thumb,
textarea::-webkit-scrollbar-thumb {
    background-color: #e5e7eb;
    border-radius: 9999px;
}

div::-webkit-scrollbar-track,
textarea::-webkit-scrollbar-track {
    background: transparent;
}
</style>