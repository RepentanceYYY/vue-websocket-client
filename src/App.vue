<script setup lang="ts"></script>

<template>
  <div class="fixed top-0 left-0 w-full h-16 bg-white shadow z-50 flex items-center justify-center">
    <h1 class="text-xl font-bold text-gray-800">scenery</h1>
  </div>
  
  <div class="fixed top-16 bottom-12 left-0 right-0 overflow-y-auto bg-white">
    <RouterView />
  </div>

  <div
    class="fixed bottom-0 left-0 w-full h-12 bg-gray-100 shadow-inner z-50 flex items-center justify-center text-sm text-gray-600">
    alice-scenery © 2026
  </div>
</template>

<style scoped>
</style>
