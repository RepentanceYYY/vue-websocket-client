<template>
    <div class="relative flex h-full w-full bg-gray-50/30 text-gray-700 min-h-0 overflow-hidden">
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
            <!-- 会话历史列表（滚动区域） -->
            <div class="flex-1 overflow-y-auto p-2 space-y-1">
                <div v-for="session in sessionList" :key="session.sessionId" @click="selectSession(session)"
                    class="group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors"
                    :class="sessionId === session.sessionId ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-100/80'">
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                        <MessageSquare class="w-4 h-4 shrink-0 text-gray-400 group-hover:text-indigo-500"
                            :class="{ 'text-indigo-600': sessionId === session.sessionId }" />
                        <span class="truncate">{{ session.title || session.sessionId }}</span>
                    </div>
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

            <!-- 用户信息卡片 -->
            <div v-if="authStore.isLoggedIn" class="border-t border-gray-100 p-3 flex items-center justify-between">
                <div class="flex items-center gap-2.5 min-w-0">
                    <div
                        class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold shrink-0">
                        {{ authStore.userAvatar }}
                    </div>
                    <span class="text-sm font-medium text-gray-700 truncate">{{ authStore.nickname || '用户' }}</span>
                </div>
                <button class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                    <MoreHorizontal class="w-4 h-4" />
                </button>
            </div>
        </aside>

        <!-- 右侧主对话界面 -->
        <main class="flex-1 flex flex-col h-full min-w-0 min-h-0 bg-white">
            <!-- 聊天内容区域 -->
            <div ref="chatContainer" class="flex-1 overflow-y-auto px-4 py-6 min-h-0 select-text">
                <!-- 限制与底部输入框同宽 (max-w-4xl mx-auto) -->
                <div class="max-w-4xl mx-auto w-full space-y-6">

                    <!-- 空白状态 -->
                    <div v-if="messages.length === 0" class="h-full py-20 flex items-center justify-center select-none">
                        <Transition appear name="fade-up">
                            <h2 class="text-2xl font-medium text-gray-700/80 tracking-wide">
                                你好，我是 Lisa，有什么我可以帮您的吗？
                            </h2>
                        </Transition>
                    </div>

                    <!-- 消息列表 -->
                    <template v-for="(msg, index) in messages" :key="index">

                        <!-- 用户消息：靠右、带气泡、无顶部角色名 -->
                        <div v-if="msg.role === 'user'" class="flex justify-end">
    <div
        class="max-w-[80%] bg-purple-400 text-white rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-xs">
        {{ msg.content }}
    </div>
</div>

                        <!-- AI 消息：靠左、Gemini 式极简文本（带流式输出/思考状态判断） -->
                        <div v-else class="flex justify-start">
                            <div class="max-w-[85%] text-sm leading-relaxed text-gray-800 whitespace-pre-wrap py-1">

                                <!-- 场景A：思考中（内容为空且处于加载状态） -->
                                <div v-if="loading && msg.content === ''"
                                    class="flex items-center gap-2 text-gray-400 select-none py-1">
                                    <span class="flex gap-1 items-center">
                                        <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                        <span
                                            class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse [animation-delay:200ms]"></span>
                                        <span
                                            class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse [animation-delay:400ms]"></span>
                                    </span>
                                    <span class="text-xs font-medium text-gray-500">思考中...</span>
                                </div>

                                <!-- 场景B：正常内容显示 -->
                                <div v-else class="text-gray-800">
                                    {{ msg.content }}
                                </div>

                            </div>
                        </div>

                    </template>
                </div>
            </div>

            <!-- ========== 输入区域 ========== -->
            <div class="p-4 pt-0 shrink-0 max-w-4xl mx-auto w-full">
                <div
                    class="relative bg-gray-50/80 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 border border-gray-200/90 rounded-[26px] shadow-sm transition-all duration-200 flex items-center p-1.5 pr-2">
                    <!-- 多行文本输入框 -->
                    <textarea ref="textareaRef" v-model="input" rows="1" placeholder="输入消息... (Enter发送，Shift+Enter换行)"
                        class="resize-none flex-1 px-4 py-2.5 bg-transparent border-none outline-none text-sm text-gray-800 leading-5 overflow-y-auto placeholder:text-gray-400"
                        :style="{ height: textareaHeight + 'px' }" @input="adjustTextareaHeight"
                        @keydown.enter.exact.prevent="send" />

                    <!-- 右侧内嵌按钮区域 -->
                    <div class="flex items-center shrink-0">
                        <!-- 停止生成按钮 -->
                        <button v-if="loading" @click="stop"
                            class="w-8 h-8 flex items-center justify-center bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full transition-all shadow-xs"
                            title="停止生成">
                            <Square class="w-3.5 h-3.5 fill-current" />
                        </button>
                        <!-- 发送按钮 -->
                        <button v-else @click="send" :disabled="!input.trim()"
                            class="w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-30 disabled:hover:bg-indigo-600 disabled:active:scale-100 text-white rounded-full transition-all shadow-xs"
                            title="发送消息">
                            <ArrowUp class="w-4 h-4 stroke-[2.5]" />
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <LoginDialog />
        <ToastContainer />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { User, Bot, Send, Square, Plus, MessageSquare, Trash2, ArrowUp, MoreHorizontal } from "@lucide/vue";
import request from '@/utils/request'
import LoginDialog from '@/components/LoginDialog.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { useAuthStore } from '@/stores/auth'   // 引入 auth store

const authStore = useAuthStore()  // 使用 store

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
        const res = await request.get("/ai/session/list");
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
        const res = await request.delete(`/ai/session/delete/${targetSessionId}`);
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
        const res = await request.post("/ai/session/create");
        const newSessionId = res.data;
        return newSessionId;
    } catch (error) {
        console.error("创建新会话失败:", error);
    }
    return null;
};

const adjustTextareaHeight = () => {
    const el = textareaRef.value;
    if (!el) return;

    el.style.height = 'auto';
    const lineHeight = 20;
    const padding = 20;
    const singleHeight = 40;
    const maxHeight = lineHeight * 5 + padding;
    const scrollHeight = el.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, singleHeight), maxHeight);
    textareaHeight.value = newHeight;
    el.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
};

const send = async () => {
    if (!input.value.trim() || loading.value) return;
    if (!sessionId.value) {
        const newId = await createNewSession();
        if (newId) {
            sessionId.value = newId;
            fetchSessionList();
        } else {
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
        const response = await fetch(`${import.meta.env.VITE_CHAT_API_BASE_URL}/ai/chat/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authStore.token}` },
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

.fade-up-enter-active {
    transition: all 0.8s ease-out;
}

.fade-up-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.fade-up-enter-to {
    opacity: 1;
    transform: translateY(0);
}
</style>