<template>
  <div class="flex-1 flex flex-col h-full space-y-4 p-6 bg-gray-50/30 text-gray-700 min-h-0">

    <!-- 第一行：WS 连接 -->
    <div class="flex items-center gap-3 bg-white p-3.5 rounded-xl shadow-xs border border-gray-200/60 shrink-0">
      <div class="flex items-center space-x-2 w-28 shrink-0 text-gray-600">
        <Link class="w-4 h-4 text-indigo-500" />
        <span class="text-sm font-semibold">服务连接</span>
      </div>
      <input v-model="wsUrl" type="text" placeholder="ws://localhost:8080"
        class="flex-1 px-3.5 py-2 bg-gray-50/80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-mono text-gray-800" />
      <button @click="toggleConnection" :disabled="loadingStates.connection" :class="[
        'flex items-center justify-center min-w-[120px] px-4 py-2 rounded-lg text-white text-sm font-medium transition-all active:scale-95 shadow-xs cursor-pointer',
        isConnected ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20',
        loadingStates.connection ? 'opacity-70 cursor-not-allowed' : ''
      ]">
        <Loader2 v-if="loadingStates.connection" class="w-4 h-4 mr-2 animate-spin" />
        <Power v-else class="w-4 h-4 mr-2" />
        {{ isConnected ? "断开服务" : "连接服务" }}
      </button>
    </div>

    <!-- 第二行：消息发送区 -->
    <div class="flex items-center gap-3 bg-white p-3.5 rounded-xl shadow-xs border border-gray-200/60 shrink-0">
      <input v-model="sendText" type="text" placeholder="输入发送内容 (JSON 或文本)" @keyup.enter="sendMessage"
        class="flex-1 px-3.5 py-2 bg-gray-50/80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-mono text-gray-800" />

      <button @click="sendMessage" :disabled="!isConnected || !sendText.trim()"
        class="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer shadow-xs shadow-indigo-600/20">
        <Send class="w-4 h-4" />
        发送
      </button>
    </div>

    <!-- 第三行：日志面板（铺满剩余所有高度） -->
    <div class="flex-1 flex flex-col min-h-0 bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800">
      <!-- 日志头部 -->
      <div class="flex justify-between items-center px-4 py-2.5 bg-gray-900/90 border-b border-gray-800/80 shrink-0">
        <div class="flex items-center space-x-2">
          <Terminal class="w-4 h-4 text-emerald-400" />
          <span class="text-xs font-mono font-semibold text-gray-300 uppercase tracking-widest">控制台输出</span>
        </div>
        <button @click="logs = []"
          class="text-xs text-gray-400 hover:text-rose-400 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-800 cursor-pointer">
          <Trash2 class="w-3.5 h-3.5" />
          清空
        </button>
      </div>

      <!-- 日志输出容器（垂直滚动） -->
      <div id="log-container" class="flex-1 overflow-y-auto font-mono text-xs p-4 space-y-2 select-text">
        <div v-if="logs.length === 0" class="h-full flex items-center justify-center text-gray-600 select-none">
          暂无控制台输出日志...
        </div>
        <div v-for="(log, index) in logs" :key="index" class="leading-relaxed border-l-2 pl-3 py-0.5 transition-all"
          :class="log.type === 'err' ? 'border-rose-500 bg-rose-500/5' : 'border-emerald-500/60 bg-emerald-500/5'">
          <span class="text-gray-500 mr-2.5 select-none">{{ log.time }}</span>
          <span :class="log.type === 'err' ? 'text-rose-400 font-medium' : 'text-emerald-300'">
            {{ log.content }}
          </span>
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, nextTick } from "vue";
import { Loader2, Power, Link, Trash2, Send, Terminal } from "@lucide/vue";
import { WebSocketClient } from "@/utils/CabinetWebSocketClient";

// 状态变量
const wsUrl = ref("ws://localhost:52001/ws/chat");
const isConnected = ref(false);
const logs = ref<{ time: string; content: string; type: "info" | "err" }[]>([]);
const sendText = ref("");

const sendMessage = () => {
  if (!client || !isConnected.value || !sendText.value.trim()) return;
  try {
    const payload = {
      sessionId: '90eac6ad-4911-40db-9f06-0bc8f4516263',
      message: sendText.value
    };

    client.send(payload);

    addLog(`📤➡️ 发送消息: ${JSON.stringify(payload)}`, "info");
    sendText.value = ""; // 发送后清空输入框
  } catch (err: any) {
    addLog(`❌ 发送失败: ${err.message}`, "err");
  }
};

// 统一管理所有加载状态
const loadingStates = reactive({
  connection: false,
  hardware: false,
  autoDetect: false,
  openDoor: false,
  doorStatus: false,
  temp: false,
  readRFID: false,
  disconnectHardware: false,
});

let client: WebSocketClient | null = null;

/**
 * 写入到日志
 */
const addLog = (msg: string, type: "info" | "err" = "info") => {
  const now = new Date();

  const time = now.toLocaleTimeString("zh-CN", {
    hour12: false,
  }) + `.${now.getMilliseconds().toString().padStart(3, "0")}`;

  logs.value.push({ time, content: msg, type });

  nextTick(() => {
    const container = document.getElementById("log-container");
    if (container) container.scrollTop = container.scrollHeight;
  });
};

/**
 * WebSocket 连接
 */
const toggleConnection = async () => {
  loadingStates.connection = true;
  if (!isConnected.value) {
    client = new WebSocketClient(wsUrl.value);
    try {
      await client.connect();
      isConnected.value = true;
      addLog("✅ 服务端连接成功");
      handleBindEvent(client);
    } catch (err: any) {
      addLog(`❌ 连接失败: ${err.message || '未知错误'}`, "err");
      client = null;
    } finally {
      loadingStates.connection = false;
    }
  } else {
    client?.disconnect();
    isConnected.value = false;
    client = null;
    addLog("🔌 服务端连接已断开");
    loadingStates.connection = false;
  }
};

/**
 * 绑定事件
 */
const handleBindEvent = (client: WebSocketClient) => {
  client.on("message", (msg) => {
    addLog(`⬅️📩 收到消息: ${JSON.stringify(msg)}`, "info");
  });

  client.on("readySend", (message) => {
    addLog(`📤➡️ 发送消息: ${message}`, "info");
  });

  client.on("webSocketDisconnected", () => {
    addLog("🔌 服务端连接已断开", "err");
    isConnected.value = false;
    loadingStates.connection = false;
  });
};
</script>

<style scoped>
#log-container::-webkit-scrollbar {
  width: 5px;
}

#log-container::-webkit-scrollbar-thumb {
  background-color: #374151;
  border-radius: 9999px;
}

#log-container::-webkit-scrollbar-track {
  background: transparent;
}
</style>