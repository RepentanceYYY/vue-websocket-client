<template>
  <main class="flex-1 flex flex-col h-full min-w-0 min-h-0 overflow-hidden bg-white relative">
    <!-- 侧边栏折叠后，显示打开按钮 -->
    <button v-if="sidebarCollapsed" @click="$emit('toggle-sidebar')"
      class="absolute top-4 left-4 z-20 p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
      title="展开侧边栏">
      <PanelLeftOpen class="w-4 h-4" />
    </button>

    <!-- 消息列表区域 -->
    <div ref="chatContainer"
      class="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-4 py-6 min-h-0 select-text flex flex-col"
      :class="{ 'justify-center items-center': messages.length === 0 }">
      <div class="max-w-4xl min-w-0 mx-auto w-full space-y-6">
        <!-- 空白状态 -->
        <div v-if="messages.length === 0" class="text-center select-none py-6">
          <Transition appear name="fade-up">
            <h2 class="text-2xl sm:text-3xl font-medium text-gray-700/80 tracking-wide">
              {{ authStore.ipInfo?.address ? `好久不见，你在${authStore.ipInfo.address}过得怎么样？` : "你好，我是Lisa，你最近过得还好吗？" }}
            </h2>
          </Transition>
        </div>

        <!-- 消息列表 -->
        <template v-for="(msg, index) in messages" :key="index">

          <!-- 用户消息 -->
          <div v-if="msg.role === 'USER'" class="flex justify-end">
            <div
              class="max-w-[80%] break-words bg-purple-400 text-white rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-xs">
              {{ msg.content }}
            </div>
          </div>


          <!-- 助理消息 -->
          <div v-else class="flex min-w-0 justify-start">
            <div class="markdown-body max-w-[85%] min-w-0 text-sm leading-relaxed text-gray-800 py-1 break-words">

              <!-- AI还没有返回内容 -->
              <div v-if="loading && !msg.content.trim()" class="flex items-center gap-2 text-gray-400">

                <span>思考中...</span>

              </div>


              <!-- 流式和完成后统一Markdown渲染 -->
              <div v-else v-html="renderMarkdown(msg.content)" />

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
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Square, ArrowUp, PanelLeftOpen } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useSessionStore } from '@/stores/sessionStore'
import { toast } from '@/composables/useToast'
import { type IMessage } from '@/types/twinbrain'
import MarkdownIt from 'markdown-it'
import type { MarkdownIt as MarkdownItType } from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

const props = defineProps<{
  sessionId: string
  sidebarCollapsed: boolean
}>()

const emit = defineEmits<{
  'update:sessionId': [sessionId: string]
  'session-created': [sessionId: string, firstMessage: string]
  'toggle-sidebar': []
}>()

const authStore = useAuthStore()
const sessionStore = useSessionStore()

const input = ref('')
const loading = ref(false)
const messages = ref<IMessage[]>([])
const chatContainer = ref<HTMLDivElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const textareaHeight = ref(40)
let abortController: AbortController | null = null

// 加载历史消息的状态
const isLoadingHistory = ref(false)
// 标志位：记录是否是本次发送消息触发的 sessionId 变更，避免 watch 重复覆盖 messages
let isCurrentCreatingSession = false

// ---------- Markdown 渲染 ----------
const md: MarkdownItType = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: true,

  highlight: (str: string, lang: string): string => {

    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, {
          language: lang,
          ignoreIllegals: true
        }).value
      } catch (e) {
        console.error('代码高亮失败:', e)
      }
    }

    return md.utils.escapeHtml(str)
  }
})

function renderMarkdown(content: string): string {
  if (!content) return ''
  return md.render(content)
}

// ---------- 唯一监听 sessionId 变化，加载历史消息 ----------
watch(
  () => props.sessionId,
  async (newId, oldId) => {
    if (newId === oldId) return

    // 如果是新建空会话
    if (!newId) {
      messages.value = []
      return
    }

    // 关键判断：如果是当前正在发送消息时，后端回传的新 sessionId，不需要请求历史接口覆写 UI
    if (isCurrentCreatingSession) {
      isCurrentCreatingSession = false
      return
    }

    // 真正的“切换历史会话”逻辑
    isLoadingHistory.value = true
    try {
      const res: any = await sessionStore.getSessionMessages(newId)
      const remote = res.data || []
      messages.value = remote.map((item: any) => ({
        role: item.role,
        content: item.content
      }))
    } catch (e: any) {
      toast.show(e.message || '加载会话失败', 'error')
    } finally {
      isLoadingHistory.value = false
      await nextTick()
      scrollBottom()
    }
  },
  { immediate: true }
)

// ---------- 暴露清空方法给父组件 ----------
function clearMessages() {
  messages.value = []
}

defineExpose({ clearMessages })

// ---------- 输入框自适应 ----------
function adjustTextareaHeight() {
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

// ---------- 发送消息 ----------
async function send() {
  if (!authStore.isLoggedIn) {
    authStore.logout()
    authStore.openLoginDialog()
    return
  }
  if (!input.value.trim() || loading.value) return

  const text = input.value
  input.value = ''
  textareaHeight.value = 40
  messages.value.push({ role: 'USER', content: text })

  const aiMsg: IMessage = { role: 'ASSISTANT', content: '' }
  messages.value.push(aiMsg)
  loading.value = true
  await scrollBottom()

  abortController = new AbortController()
  try {
    const response = await fetch(`${import.meta.env.VITE_CHAT_API_BASE_URL}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        sessionId: props.sessionId || null,
        message: text
      }),
      signal: abortController.signal
    })

    if (!response.ok) {
      if (response.status === 401) {
        authStore.logout()
        authStore.openLoginDialog()
        loading.value = false
        return
      } else {
        throw new Error(`请求失败: ${response.status}`)
      }
    }
    if (!response.body) throw new Error('浏览器不支持流式响应')

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      console.log(
        '收到chunk:',
        decoder.decode(value, { stream: true })
      )
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''

      for (const event of events) {
        let eventName = ''
        const lines = event.split('\n')
        let dataLines: string[] = []

        for (const line of lines) {

          if (line.startsWith('event:')) {
            eventName = line.substring(6).trim()
          }

          if (line.startsWith('data:')) {
            dataLines.push(line.substring(5))
          }
        }

        const data = dataLines.join('\n')

        if (eventName === 'session_created' && data) {
          // 标记本次 sessionId 更新是由发送消息触发的
          isCurrentCreatingSession = true
          emit('update:sessionId', data)
          emit('session-created', data, text)
        }

        if (eventName === 'title_generated' && data) {
          sessionStore.updateSessionTitle(props.sessionId, data)
        }

        if (eventName === 'done') break

        if (eventName === 'message' && data) {

          const index = messages.value.length - 1

          messages.value[index].content += data

          await scrollBottom()
        }
      }
    }
  } catch (e: any) {
    if (e.name === 'AbortError') {
      console.log('用户停止生成')
    } else {
      console.error('SSE请求失败:', e)
      aiMsg.content += '\n\n❌ 请求失败:' + e.message
    }
  } finally {
    loading.value = false
    abortController = null
    await scrollBottom()
  }
}

function stop() {
  abortController?.abort()
  abortController = null
  loading.value = false
}

async function scrollBottom() {
  await nextTick()
  const el = chatContainer.value
  if (el) el.scrollTop = el.scrollHeight
}
</script>
