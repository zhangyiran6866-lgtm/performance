<script setup lang="ts">
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold tracking-tight text-slate-800">
        绩效总览
      </h1>
    </div>
    
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <el-card
        shadow="hover"
        class="rounded-xl border-slate-200"
      >
        <template #header>
          <div class="flex flex-row items-center justify-between">
            <span class="text-sm font-medium text-slate-600">总考核任务</span>
          </div>
        </template>
        <div class="text-2xl font-bold text-slate-900">
          128
        </div>
        <p class="text-xs text-slate-500 mt-1">
          即将截止: 12
        </p>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
}
</style>
