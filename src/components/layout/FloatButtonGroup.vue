<template>
  <div class="fab-group">
    <button class="fab-btn fab-main" title="发布" @click="emit('create-post')">
      <el-icon><Edit /></el-icon>
    </button>
    <button class="fab-btn fab-sub" title="刷新">
      <el-icon><Refresh /></el-icon>
    </button>
    <button class="fab-btn fab-sub" title="回到顶部">
      <el-icon><Top /></el-icon>
    </button>
  </div>
</template>

<script setup>
import { Edit, Refresh, Top } from '@element-plus/icons-vue';

const emit = defineEmits(['create-post']);
</script>

<style scoped>
.fab-group {
  position: fixed;
  right: 40px;
  bottom: 40px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 9999;
}
.fab-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  cursor: pointer;
  transition: box-shadow 0.18s, background 0.18s, color 0.18s, transform 0.18s;
  padding: 0;
}
.fab-main {
  background: linear-gradient(135deg, #1677ff 60%, #4096ff 100%);
  box-shadow: 0 6px 24px rgba(22,119,255,0.18);
  color: #fff;
}
.fab-main .el-icon {
  font-size: 26px;
  color: #fff;
}
.fab-main:hover {
  box-shadow: 0 0 0 10px rgba(22,119,255,0.10), 0 8px 32px rgba(22,119,255,0.22);
  background: linear-gradient(135deg, #4096ff 60%, #1677ff 100%);
  color: #fff;
  transform: scale(1.08);
}
.fab-main:active {
  background: #165dff;
  color: #fff;
  transform: scale(0.96);
}
.fab-sub {
  background: #fff;
  color: #1677ff;
  box-shadow: 0 2px 8px rgba(22,119,255,0.10);
}
.fab-sub .el-icon {
  font-size: 26px;
  color: #1677ff;
}
.fab-sub:hover {
  background: #e6f4ff;
  color: #4096ff;
  box-shadow: 0 4px 16px rgba(22,119,255,0.16);
  transform: scale(1.08);
}
.fab-sub:active {
  background: #f0f6ff;
  color: #165dff;
  transform: scale(0.96);
}
@media (max-width: 600px) {
  .fab-group {
    right: 12px;
    bottom: 12px;
    gap: 8px;
  }
  .fab-btn {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
  .fab-btn .el-icon {
    font-size: 18px;
  }
}
</style> 