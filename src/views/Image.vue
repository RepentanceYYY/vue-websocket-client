<template>
  <div class="flex flex-col h-full space-y-4 p-6  shadow-lg  text-gray-700">

    <div class="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
      <div class="flex items-center space-x-2 w-28 shrink-0 text-gray-500">
        <Link class="w-4 h-4" />
        <span class="text-sm font-bold">服务连接</span>
      </div>
      <input v-model="wsUrl" type="text" placeholder="ws://localhost:8080"
        class="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm" />
      <button @click="toggleConnection" :disabled="loadingStates.connection" :class="[
        'flex items-center justify-center min-w-[120px] px-4 py-2 rounded-md text-white font-medium transition-all active:scale-95 shadow-sm',
        isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700',
        loadingStates.connection ? 'opacity-70 cursor-not-allowed' : ''
      ]">
        <Loader2 v-if="loadingStates.connection" class="w-4 h-4 mr-2 animate-spin" />
        <Power v-else class="w-4 h-4 mr-2" />
        {{ isConnected ? "断开服务" : "连接服务" }}
      </button>
    </div>

    <div class="flex flex-col gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
      <div class="flex items-center gap-3">
        <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="handleFileChange" />

        <button @click="fileInput?.click()"
          class="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-sm font-medium transition-colors">
          选择图片 (自动转 Base64)
        </button>

        <span class="text-xs text-gray-400 flex-1 truncate">
          {{ imageName || '暂未选择图片' }}
        </span>

        <button @click="sendMessage" :disabled="!isConnected || !imageBase64"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm disabled:opacity-50">
          发送
        </button>
      </div>

      <div v-if="imageBase64"
        class="mt-1 border border-dashed border-gray-200 p-2 rounded-md flex items-center gap-4 bg-gray-50">
        <img :src="imageBase64" class="w-16 h-16 object-cover rounded-md border" alt="预览" />
        <div class="text-xs text-gray-500 space-y-1">
          <p class="font-bold text-gray-700">Base64 转换成功</p>
          <p>字符长度: <span class="text-indigo-600">{{ imageBase64.length }}</span> 字节</p>
        </div>
      </div>
    </div>

    <div
      class="flex-1 flex flex-col min-h-0 bg-[#1e1e1e] rounded-lg overflow-hidden shadow-inner border border-gray-800">
      <div class="flex justify-between items-center px-4 py-2 bg-[#252526] border-b border-gray-800">
        <div class="flex items-center space-x-1">
          <span class="text-xs font-mono text-gray-400 ml-2 uppercase tracking-widest">控制台输出</span>
        </div>
        <button @click="logs = []" class="text-xs text-gray-500 hover:text-white transition-colors flex items-center">
          <Trash2 class="w-3 h-3 mr-1" /> 清空
        </button>
      </div>
      <div id="log-container" class="flex-1 overflow-y-auto font-mono text-[13px] p-4 space-y-1">
        <div v-for="(log, index) in logs" :key="index" class="leading-relaxed border-l-2 pl-3"
          :class="log.type === 'err' ? 'border-red-500/50' : 'border-blue-500/30'">
          <span class="text-gray-500 mr-2">{{ log.time }}</span>
          <span :class="log.type === 'err' ? 'text-red-400' : 'text-emerald-400'">
            {{ log.content }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, nextTick } from "vue";
import { Loader2, Power, Link, Trash2 } from "lucide-vue-next";
import { WebSocketClient } from "@/utils/CabinetWebSocketClient";

// 状态变量
const wsUrl = ref("ws://localhost:8080/ws/device");
const isConnected = ref(false);
const logs = ref<{ time: string; content: string; type: "info" | "err" }[]>([]);

// 图片上传相关的响应式变量
const fileInput = ref<HTMLInputElement | null>(null);
const imageName = ref("");
const imageBase64 = ref("");

/**
 * 监听图片选择，转为 Base64
 */
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  imageName.value = file.name;

  const reader = new FileReader();
  reader.onload = (event) => {
    // 获取到的就是带有 data:image/png;base64,... 前缀的完整字符串
    imageBase64.value = event.target?.result as string || "";
    addLog(`📸 图片 [${file.name}] 已转为 Base64`, "info");
  };
  reader.onerror = () => {
    addLog("❌ 图片转 Base64 失败", "err");
  };
  reader.readAsDataURL(file); // 读取为 DataURL
};

/**
 * 触发发送
 */
const sendMessage = () => {
  if (!client || !isConnected.value || !imageBase64.value) return;

  try {

    let fullBase64 = imageBase64.value;

    // 举个例子：
    let payload = {
      type: "detectFace",
      data: {
        faceImage: {
          rgbBase64: fullBase64,
          irBase64: null
        }
      }
    };

    // 执行发送
    client.send(payload);

    // ========================================================

    // 日志中由于 base64 太长，截取前 50 个字符显示，防止撑爆控制台
    addLog(`📤➡️ 发送图片数据, 字符截取: ${fullBase64.substring(0, 50)}...`, "info");
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
    // 同样防止发送长字符串时日志刷屏
    const displayMsg = message.length > 100 ? message.substring(0, 100) + "..." : message;
    addLog(`📤➡️ 发送消息: ${displayMsg}`, "info");
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
  width: 6px;
}

#log-container::-webkit-scrollbar-thumb {
  background-color: #374151;
  border-radius: 10px;
}

#log-container::-webkit-scrollbar-track {
  background: transparent;
}
</style>