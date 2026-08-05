<template>
    <Teleport to="body">
        <div class="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none max-w-md px-4">
            <TransitionGroup name="toast" tag="div" class="flex flex-col items-center gap-2 w-full">
                <div
                    v-for="item in toast.state.toasts"
                    :key="item.id"
                    class="pointer-events-auto px-5 py-3 rounded-full shadow-lg border-2 backdrop-blur-sm text-sm font-medium transition-all text-white text-center w-auto max-w-full"
                    :class="{
                        'bg-amber-600/60 border-amber-400/80': item.type === 'warning',
                        'bg-red-600/60 border-red-400/80': item.type === 'error',
                        'bg-blue-600/60 border-blue-400/80': item.type === 'info',
                        'bg-green-600/60 border-green-400/80': item.type === 'success',
                    }"
                >
                    {{ item.message }}
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { toast } from '@/composables/useToast'
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s ease;
}
.toast-enter-from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
}
.toast-leave-to {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
}
.toast-move {
    transition: transform 0.3s ease;
}
</style>