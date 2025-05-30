<template>
  <div class="fab-group">
    <button class="fab-btn fab-main" title="发布" @click="emit('create-post')">
      <el-icon><Edit /></el-icon>
    </button>
    <button class="fab-btn fab-sub" title="刷新" @click="handleRefresh">
      <el-icon><Refresh /></el-icon>
    </button>
    <button class="fab-btn fab-sub" title="回到顶部" @click="scrollToTop">
      <el-icon><Top /></el-icon>
    </button>
  </div>
</template>

<script setup>
import { Edit, Refresh, Top } from '@element-plus/icons-vue';

const emit = defineEmits(['create-post', 'refresh']);

// 刷新内容
 const handleRefresh = () => {
  // 触发刷新事件，由父组件来处理具体刷新逻辑
  emit('refresh');
  // 触发全局事件，确保所有需要刷新的组件都能响应
  document.dispatchEvent(new CustomEvent('refresh-feed-list'));
};

// 回到顶部
const scrollToTop = () => {
  // 浏览器兼容性处理
  try {
    // 获取内容区域元素 - 这是主要的滚动容器
    const mainContent = document.querySelector('.main-content');
    
    if (mainContent) {
      // 直接设置滚动位置，避免scrollTo兼容性问题
      mainContent.scrollTop = 0;
      
      // 如果浏览器支持平滑滚动，则使用平滑滚动
      if ('scrollBehavior' in document.documentElement.style) {
        mainContent.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
      
      // 触发自定义事件，通知其他可能需要响应的组件
      document.dispatchEvent(new CustomEvent('scroll-to-top'));
      
      return; // 已处理完毕，不需要继续
    }
    
    // 如果没有找到内容区域，则回退到滚动整个页面
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    // 兼容模式：如果上述方法失败，尝试最简单的方式
    try {
      window.scrollTo(0, 0);
    } catch (e) {
      console.error('滚动到顶部失败:', e);
    }
  }
};
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