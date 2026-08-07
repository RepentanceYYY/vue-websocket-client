<template>
    <div class="relative flex h-full w-full bg-gray-50/30 text-gray-700 min-h-0 overflow-hidden">

        <!-- 左侧会话菜单栏 - 仅在登录后显示 -->
        <aside v-if="authStore.isLoggedIn" class="w-64 bg-white border-r border-gray-200/60 flex flex-col shrink-0">
            <!-- 顶部新建按钮 -->
            <div class="p-4 border-b border-gray-100">
                <button @click="startNewChat"
                    class="w-full h-10 px-4 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white rounded-lg text-sm font-medium transition-all shadow-xs">
                    <Plus class="w-4 h-4" />
                    <span>新建聊天</span>
                </button>
            </div>
            <!-- 会话历史列表（滚动区域） -->
            <div class="flex-1 overflow-y-auto p-2 space-y-1">
                <!-- 1. 加载中状态（Spinner） -->
                <div v-if="sessionStore.sessionLoding"
                    class="py-12 flex flex-col items-center justify-center gap-2 text-xs text-gray-400 select-none">
                    <Loader2 class="w-5 h-5 animate-spin text-indigo-500" />
                    <span>加载中...</span>
                </div>

                <!-- 2. 会话列表展示 -->
                <template v-else-if="sessionStore.sessionList.length > 0">
                    <div v-for="session in sessionStore.sessionList" :key="session.sessionId"
                        @click="handleSelectSession(session)"
                        class="group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors"
                        :class="currentSessionId === session.sessionId ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-100/80'">
                        <div class="flex items-center gap-2.5 min-w-0 flex-1">
                            <MessageSquare class="w-4 h-4 shrink-0 text-gray-400 group-hover:text-indigo-500"
                                :class="{ 'text-indigo-600': currentSessionId === session.sessionId }" />
                            <span class="truncate">{{ session.title || session.sessionId }}</span>
                        </div>
                        <button @click.stop="handleDeleteSession(session.sessionId)"
                            class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all"
                            title="删除会话">
                            <Trash2 class="w-3.5 h-3.5" />
                        </button>
                    </div>
                </template>

                <!-- 3. 无数据提示 -->
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

                <!-- 右侧三个点图标（无事件，点击会冒泡到父级触发菜单） -->
                <div class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                    <MoreHorizontal class="w-4 h-4" />
                </div>

                <!-- 弹出菜单（绝对定位在卡片上方） -->
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

        <!-- 右侧主对话界面 -->
        <main class="flex-1 flex flex-col h-full min-w-0 min-h-0 bg-white">
            <div ref="chatContainer" class="flex-1 overflow-y-auto px-4 py-6 min-h-0 select-text flex flex-col"
                :class="{ 'justify-center items-center': messages.length === 0 }">

                <div class="max-w-4xl mx-auto w-full space-y-6">

                    <!-- 空白状态 -->
                    <div v-if="messages.length === 0" class="text-center select-none py-6">
                        <Transition appear name="fade-up">
                            <h2 class="text-2xl sm:text-3xl font-medium text-gray-700/80 tracking-wide">
                                {{ authStore.ipInfo?.address ? `好久不见，你在${authStore.ipInfo.address}过得怎么样？` :
                                    "你好，我是Lisa，你最近过得还好吗？"
                                }}
                            </h2>
                        </Transition>
                    </div>

                    <!-- ========== 消息列表 ========== -->
                    <template v-for="(msg, index) in messages" :key="index">
                        <!-- 用户消息 -->
                        <div v-if="msg.role === 'USER'" class="flex justify-end">
                            <div
                                class="max-w-[80%] bg-purple-400 text-white rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-xs">
                                {{ msg.content }}
                            </div>
                        </div>

                        <!-- AI 消息 -->
                        <div v-else class="flex justify-start">
                            <div class="max-w-[85%] text-sm leading-relaxed text-gray-800 py-1">

                                <div v-if="loading && msg.content === ''" class="flex items-center gap-2 text-gray-400">
                                    <span>思考中...</span>
                                </div>


                                <!-- 流式文本 -->
                                <div v-else-if="loading && msg.role === 'ASSISTANT'" class="whitespace-pre-wrap">
                                    {{ msg.content }}
                                </div>


                                <!-- 完成后的markdown -->
                                <div v-else class="markdown-body" v-html="renderMarkdown(msg.content)" />

                            </div>
                        </div>
                    </template>
                </div>
            </div>

            <!-- 输入区域 -->
            <div class="p-4 pt-0 shrink-0 max-w-4xl mx-auto w-full">
                <div
                    class="relative bg-gray-50/80 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 border border-gray-200/90 rounded-[26px] shadow-sm transition-all duration-200 flex items-center p-1.5 pr-2">
                    <textarea ref="textareaRef" v-model="input" rows="1" placeholder="有问题，尽管问"
                        class="resize-none flex-1 px-4 py-2.5 bg-transparent border-none outline-none text-gray-800 leading-5 overflow-y-auto placeholder:text-gray-400"
                        :style="{ height: textareaHeight + 'px' }" @input="adjustTextareaHeight"
                        @keydown.enter.exact.prevent="send" />

                    <div class="flex items-center shrink-0">
                        <button v-if="loading" @click="stop"
                            class="w-8 h-8 flex items-center justify-center bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full transition-all shadow-xs"
                            title="停止生成">
                            <Square class="w-3.5 h-3.5 fill-current" />
                        </button>
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
        <RegisterDialog />
        <ToastContainer />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onBeforeUnmount } from "vue";
import { User, Bot, Send, Square, Plus, MessageSquare, Trash2, ArrowUp, MoreHorizontal, Loader2 } from "@lucide/vue";
import request from '@/utils/request'
import LoginDialog from '@/components/LoginDialog.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { toast } from '@/composables/useToast'
import { useSessionStore } from '@/stores/sessionStore'
import { useAuthStore } from '@/stores/auth'
import { type IAiChatSession, type IMessage } from '@/types/twinbrain'
import MarkdownIt from 'markdown-it'
import type { MarkdownIt as MarkdownItType } from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import RegisterDialog from "@/components/RegisterDialog.vue";

// ---------- 用户菜单 ----------
// 菜单显示状态
const showUserMenu = ref(false)
// 卡片 DOM 引用（用于点击外部关闭）
const userCardRef = ref<HTMLElement | null>(null)

// 切换菜单
function toggleUserMenu() {
    showUserMenu.value = !showUserMenu.value
}

// 处理“我的个人资料”
function handleProfile() {
    toast.show('个人资料功能开发中...', 'info')
    showUserMenu.value = false
}

// 处理“退出”
function handleLogout() {
    authStore.logout()
    toast.show('已退出登录', 'success')
    showUserMenu.value = false
    // 可选：清空当前会话和消息，让界面回到未登录状态
    messages.value = []
    currentSessionId.value = ''
    // 如果有路由跳转，可在此添加
}

// 点击卡片外部关闭菜单
function handleClickOutside(event: MouseEvent) {
    if (!showUserMenu.value) return
    if (userCardRef.value && !userCardRef.value.contains(event.target as Node)) {
        showUserMenu.value = false
    }
}

// ---------- 初始化 markdown-it ----------

const md: MarkdownItType = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
    typographer: true,

    highlight: (str: string, lang: string): string => {

        if (lang && hljs.getLanguage(lang)) {
            try {
                return `<code class="hljs">${hljs.highlight(str, {
                    language: lang,
                    ignoreIllegals: true
                }).value
                    }</code>`
            } catch (e) {
                console.error(e)
            }
        }

        return `<code class="hljs">${str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            }</code>`
    }
})

// 渲染函数（直接暴露给模板）
const renderMarkdown = (content: string): string => {
    if (!content) return ''
    // 如果后端传的 \n 被转义，还原
    const formatted = content.replace(/\\n/g, '\n')
    const result = md.render(formatted)
    console.log('渲染Markdown，长度:', result.length) // 调试日志，确认调用
    return result
}

const authStore = useAuthStore()
const sessionStore = useSessionStore()


const currentSessionId = ref("")
const input = ref("")
const loading = ref(false)
const messages = ref<IMessage[]>([])
const chatContainer = ref<HTMLDivElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isMultiLine = ref(false)
const textareaHeight = ref(40)
let abortController: AbortController | null = null



const handleUserInfo = () => {
    toast.show('用户信息功能开发中...', 'warning')
}

const startNewChat = () => {
    currentSessionId.value = ""
    messages.value = []
}

const handleSelectSession = async (session: IAiChatSession) => {
    try {
        loading.value = true
        const res: any = await sessionStore.getSessionMessages(session.sessionId)
        messages.value = [];
        const remoteSessionMessages = res.data || [];
        messages.value = remoteSessionMessages.map((item: any) => ({
            role: item.role,
            content: item.content
        }))
        currentSessionId.value = session.sessionId
    } catch (e: any) {
        toast.show(e.message || '获取失败', 'error')
    } finally {
        loading.value = false
    }
}

const handleDeleteSession = async (targetSessionId: string) => {
    try {
        await sessionStore.deleteSession(targetSessionId)
        if (currentSessionId.value === targetSessionId) {
            startNewChat()
        }
    } catch (error: any) {

    } finally {

    }
}

const adjustTextareaHeight = () => {
    const el = textareaRef.value
    if (!el) return
    el.style.height = 'auto'
    const lineHeight = 20
    const padding = 20
    const singleHeight = 40
    const maxHeight = lineHeight * 5 + padding
    const scrollHeight = el.scrollHeight
    const newHeight = Math.min(Math.max(scrollHeight, singleHeight), maxHeight)
    textareaHeight.value = newHeight
    el.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden'
}

const send = async () => {
    console.log('isLoggedIn:', authStore.isLoggedIn, 'token:', authStore.token)
    if (!authStore.isLoggedIn) {
        console.log(`用户未登录`)
        // 清除登录状态
        authStore.logout()
        // 弹出登录对话框
        authStore.openLoginDialog()
        return
    }
    if (!input.value.trim() || loading.value) return

    const text = input.value
    input.value = ""
    isMultiLine.value = false
    textareaHeight.value = 40
    messages.value.push({ role: "USER", content: text })

    const aiMsg: IMessage = { role: "ASSISTANT", content: "" }
    messages.value.push(aiMsg)
    loading.value = true
    await scrollBottom()

    abortController = new AbortController()
    try {
        const response = await fetch(`${import.meta.env.VITE_CHAT_API_BASE_URL}/ai/chat/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authStore.token}` },
            body: JSON.stringify({
                sessionId: currentSessionId.value || null,
                message: text,
            }),
            signal: abortController.signal,
        })

        if (!response.ok) {
            if (response.status === 401) {
                // 清除登录状态
                authStore.logout()
                // 弹出登录对话框
                authStore.openLoginDialog()
                // 停止加载并返回
                loading.value = false
                await scrollBottom()
                return
            } else {
                // 其他 HTTP 错误（如 500）
                throw new Error(`请求失败: ${response.status}`)
            }
        }
        if (!response.body) {
            throw new Error("浏览器不支持流式响应")
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder("utf-8")
        let buffer = ""

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const events = buffer.split("\n\n")
            buffer = events.pop() || ""

            for (const event of events) {
                let eventName = ""
                let data = ""
                const lines = event.split("\n")
                for (const line of lines) {
                    if (line.startsWith("event:")) {
                        eventName = line.substring(6).trim()
                    }
                    if (line.startsWith("data:")) {
                        data = line.substring(5).trim()
                    }
                }

                if (eventName === "session_created" && data) {
                    console.log("收到新会话ID:", data)
                    currentSessionId.value = data
                    sessionStore.getSessionList()
                }

                if (eventName === "done") {
                    console.log("SSE完成")
                    break
                }

                if (eventName === "message" && data) {
                    aiMsg.content += data
                    await scrollBottom()
                }
            }
        }
    } catch (e: any) {
        if (e.name === "AbortError") {
            console.log("用户停止生成")
        } else {
            console.error("SSE请求失败:", e)
            aiMsg.content += "\n\n❌ 请求失败:" + e.message
        }
    } finally {
        loading.value = false
        abortController = null
        await scrollBottom()
    }
}

const stop = () => {
    if (abortController) {
        abortController.abort()
        abortController = null
    }
    loading.value = false
}

const scrollBottom = async () => {
    await nextTick()
    const el = chatContainer.value
    if (el) {
        el.scrollTop = el.scrollHeight
    }
}

onMounted(() => {
    if (authStore.isLoggedIn) {
        sessionStore.getSessionList()
    }

})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})

</script>

<style scoped>
/* 滚动条样式 */
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

/* ===== Markdown 富文本样式（穿透 scoped） ===== */
:deep(.markdown-body) {
    font-size: 0.875rem;
    line-height: 1.7;
    color: #374151;
    word-break: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
}

:deep(.markdown-body p) {
    margin-bottom: 0.75rem;
}

:deep(.markdown-body p:last-child) {
    margin-bottom: 0;
}

:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3),
:deep(.markdown-body h4) {
    font-weight: 700;
    color: #111827;
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
}

:deep(.markdown-body h1) {
    font-size: 1.25rem;
}

:deep(.markdown-body h2) {
    font-size: 1.125rem;
}

:deep(.markdown-body h3) {
    font-size: 1rem;
}

:deep(.markdown-body ul) {
    list-style-type: disc;
    padding-left: 1.25rem;
    margin-bottom: 0.75rem;
}

:deep(.markdown-body ol) {
    list-style-type: decimal;
    padding-left: 1.25rem;
    margin-bottom: 0.75rem;
}

:deep(.markdown-body li) {
    margin-bottom: 0.25rem;
}

:deep(.markdown-body :not(pre) > code) {
    background-color: #f3f4f6;
    color: #ef4444;
    padding: 0.15rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.85em;
    font-family: monospace;
}

:deep(.markdown-body pre.hljs) {
    background-color: #1e1e2e !important;
    color: #cdd6f4 !important;
    padding: 1rem;
    border-radius: 0.75rem;
    margin-top: 0.5rem;
    margin-bottom: 0.75rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.85rem;
    line-height: 1.6;
    max-width: 100%;
    box-sizing: border-box;
    white-space: pre-wrap !important;
    word-break: break-all !important;
    overflow-x: auto;
}

:deep(.markdown-body pre.hljs code) {
    font-family: inherit;
    white-space: pre-wrap !important;
    word-break: break-all !important;
}

:deep(.markdown-body blockquote) {
    border-left: 4px solid #818cf8;
    padding-left: 1rem;
    color: #6b7280;
    font-style: italic;
    margin: 0.75rem 0;
}

:deep(.markdown-body table) {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0.75rem;
}

:deep(.markdown-body th),
:deep(.markdown-body td) {
    border: 1px solid #e5e7eb;
    padding: 0.5rem 0.75rem;
    text-align: left;
}

:deep(.markdown-body th) {
    background-color: #f9fafb;
    font-weight: 600;
}

:deep(.markdown-body > *:first-child) {
    margin-top: 0;
}

:deep(.markdown-body > *:last-child) {
    margin-bottom: 0;
}

:deep(.markdown-body strong) {
    font-weight: 700;
    color: #111827;
}

:deep(.markdown-body a) {
    color: #2563eb;
    text-decoration: underline;
}

:deep(.markdown-body hr) {
    border-top: 1px solid #e5e7eb;
    margin: 1rem 0;
}

:deep(.markdown-body img) {
    max-width: 100%;
    border-radius: 8px;
}
</style>