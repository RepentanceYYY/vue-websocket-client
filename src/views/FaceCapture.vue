<template>
  <div class="max-w-4xl mx-auto p-5 bg-gray-50 rounded-lg font-sans">
    <h2 class="text-center text-xl font-bold text-gray-800 mb-6">双目摄像头抓拍与下载</h2>

    <div class="flex flex-wrap gap-5 justify-center items-center mb-6 p-4 bg-white rounded-md shadow-sm border border-gray-100">
      
      <div class="flex flex-col sm:flex-row sm:items-center gap-2">
        <label class="font-bold text-sm text-gray-600">彩色镜头 (RGB)：</label>
        <select 
          v-model="selectedRgbId" 
          :disabled="isStreaming" 
          class="px-3 py-1.5 rounded border border-gray-300 text-sm min-w-[200px] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500"
        >
          <option value="">-- 未选择 --</option>
          <option v-for="device in videoDevices" :key="device.deviceId" :value="device.deviceId">
            {{ device.label || '未知摄像头 (' + device.deviceId.substring(0, 5) + '...)' }}
          </option>
        </select>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center gap-2">
        <label class="font-bold text-sm text-gray-600">红外镜头 (IR)：</label>
        <select 
          v-model="selectedIrId" 
          :disabled="isStreaming" 
          class="px-3 py-1.5 rounded border border-gray-300 text-sm min-w-[200px] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500"
        >
          <option value="">-- 未选择 --</option>
          <option v-for="device in videoDevices" :key="device.deviceId" :value="device.deviceId">
            {{ device.label || '未知摄像头 (' + device.deviceId.substring(0, 5) + '...)' }}
          </option>
        </select>
      </div>

      <div class="flex gap-2.5">
        <button 
          :disabled="isStreaming" 
          @click="restartCameras" 
          class="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded shadow-sm transition-colors cursor-pointer"
        >
          ▶ 开启
        </button>
        
        <button 
          :disabled="!isStreaming" 
          @click="stopAllStreams" 
          class="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded shadow-sm transition-colors cursor-pointer"
        >
          ⏹ 停止
        </button>
        
        <button 
          :disabled="!isStreaming" 
          @click="downloadBothPhotos" 
          class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded shadow-sm transition-colors cursor-pointer"
        >
          📥 下载两张照片
        </button>
      </div>
    </div>

    <div class="flex gap-5 justify-center">
      <div class="flex-1 bg-black rounded-lg overflow-hidden shadow-md border border-gray-900 flex flex-col">
        <h3 class="text-white bg-gray-800 m-0 p-2 text-sm text-center font-medium">RGB 彩色预览</h3>
        <video ref="rgbVideoRef" autoplay playsinline muted class="w-full h-auto aspect-[4/3] object-cover bg-gray-950"></video>
      </div>
      
      <div class="flex-1 bg-black rounded-lg overflow-hidden shadow-md border border-gray-900 flex flex-col">
        <h3 class="text-white bg-gray-800 m-0 p-2 text-sm text-center font-medium">IR 红外预览</h3>
        <video ref="irVideoRef" autoplay playsinline muted class="w-full h-auto aspect-[4/3] object-cover bg-gray-950"></video>
      </div>
    </div>

    <canvas ref="rgbCanvasRef" class="hidden"></canvas>
    <canvas ref="irCanvasRef" class="hidden"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

// --- DOM 引用定义 ---
const rgbVideoRef = ref<HTMLVideoElement | null>(null);
const irVideoRef = ref<HTMLVideoElement | null>(null);
const rgbCanvasRef = ref<HTMLCanvasElement | null>(null);
const irCanvasRef = ref<HTMLCanvasElement | null>(null);

// --- 状态数据定义 ---
const videoDevices = ref<MediaDeviceInfo[]>([]);
const selectedRgbId = ref<string>('');
const selectedIrId = ref<string>('');
const isStreaming = ref<boolean>(false);

let rgbStream: MediaStream | null = null;
let irStream: MediaStream | null = null;

// 1. 初始化并仅获取设备列表
const initDevices = async () => {
  try {
    // 唤起一次权限申请以便拿到设备的 label 名字
    await navigator.mediaDevices.getUserMedia({ video: true });
    const devices = await navigator.mediaDevices.enumerateDevices();
    videoDevices.value = devices.filter(device => device.kind === 'videoinput');

    if (videoDevices.value.length === 0) {
      alert('未检测到任何视频输入设备');
      return;
    }

    // 仅自动对准设备 ID，不主动 restartCameras 开启
    autoDetectCameras();
  } catch (err: any) {
    alert(`摄像头权限获取失败: ${err.message}`);
  }
};

// 2. 自动识别 RGB 和 IR 镜头
const autoDetectCameras = () => {
  videoDevices.value.forEach(device => {
    const label = device.label.toLowerCase();
    if (label.includes('ir') || label.includes('infra') || label.includes('红外') || label.includes('uvc')) {
      if (!selectedIrId.value) selectedIrId.value = device.deviceId;
    } else {
      if (!selectedRgbId.value) selectedRgbId.value = device.deviceId;
    }
  });

  if (!selectedRgbId.value && videoDevices.value[0]) selectedRgbId.value = videoDevices.value[0].deviceId;
  if (!selectedIrId.value && videoDevices.value[1]) {
    selectedIrId.value = videoDevices.value[1].deviceId;
  } else if (!selectedIrId.value && videoDevices.value[0]) {
    selectedIrId.value = videoDevices.value[0].deviceId;
  }
};

// 3. 打开指定的摄像头视频流
const openCamera = async (deviceId: string, videoElement: HTMLVideoElement | null): Promise<MediaStream | null> => {
  if (!deviceId || !videoElement) return null;

  const constraints: MediaStreamConstraints = {
    video: {
      deviceId: { exact: deviceId },
      width: { ideal: 640 },
      height: { ideal: 480 }
    }
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    return stream;
  } catch (err: any) {
    alert(`无法打开设备 [${deviceId}]: ${err.message}`);
    return null;
  }
};

// 下拉框改变时触发
const handleDeviceChange = async () => {
  if (isStreaming.value) {
    await restartCameras();
  }
};

// 4. 【点击开启】启动双路摄像头
const restartCameras = async () => {
  // 启动前先清空旧状态
  stopAllStreams();

  if (!selectedRgbId.value && !selectedIrId.value) {
    alert('请至少选择一个摄像头再点击开启');
    return;
  }

  if (selectedRgbId.value && rgbVideoRef.value) {
    rgbStream = await openCamera(selectedRgbId.value, rgbVideoRef.value);
  }
  if (selectedIrId.value && irVideoRef.value) {
    irStream = await openCamera(selectedIrId.value, irVideoRef.value);
  }
  
  isStreaming.value = true;
};

// 5. 点击直接下载两张照片
const downloadBothPhotos = () => {
  const rgbBase64 = drawToCanvas(rgbVideoRef.value, rgbCanvasRef.value);
  const irBase64 = drawToCanvas(irVideoRef.value, irCanvasRef.value);

  if (!rgbBase64 || !irBase64) {
    alert('抓拍失败，请检查摄像头画面是否正常流转');
    return;
  }

  const timestamp = new Date().getTime();
  triggerDownload(rgbBase64, `FACE_RGB_${timestamp}.jpg`);
  triggerDownload(irBase64, `FACE_IR_${timestamp}.jpg`);
};

const drawToCanvas = (video: HTMLVideoElement | null, canvas: HTMLCanvasElement | null): string | null => {
  if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) return null;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.9);
};

const triggerDownload = (base64Data: string, fileName: string) => {
  const downloadLink = document.createElement('a');
  downloadLink.href = base64Data;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
};

// 6. 【秒停优化】关闭并释放视频流
const stopAllStreams = () => {
  // ⚡ 优化体验核心：立刻切断 UI 层与摄像头的绑定，画面瞬间变黑
  if (rgbVideoRef.value) rgbVideoRef.value.srcObject = null;
  if (irVideoRef.value) irVideoRef.value.srcObject = null;
  isStreaming.value = false;

  // 将具体硬件轨道的关闭动作留给后面执行，绝不卡顿 UI
  if (rgbStream) {
    rgbStream.getTracks().forEach(track => track.stop());
    rgbStream = null;
  }
  if (irStream) {
    irStream.getTracks().forEach(track => track.stop());
    irStream = null;
  }
};

// 生命周期
onMounted(() => { 
  initDevices(); 
});

onBeforeUnmount(() => { 
  stopAllStreams(); 
});
</script>