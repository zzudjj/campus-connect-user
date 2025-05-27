<template>
  <aside class="main-sidebar">
    <div class="sidebar-header">
      <img class="logo-img" src="/logo.png" alt="logo" />
      <span class="site-title">校园社交平台</span>
    </div>
    <nav class="sidebar-nav">
      <div
        class="nav-item"
        :class="{ active: route.path === '/' }"
        @click="router.push('/')"
      >
        <el-icon><i-ep-house /></el-icon>
        <span>推荐</span>
      </div>
      
      <!-- 好友选项 -->
      <div
        class="nav-item"
        :class="{ active: route.path === '/friends' }"
        @click="router.push('/friends')"
      >
        <el-icon><i-ep-user-filled /></el-icon>
        <span>好友</span>
        <el-badge v-if="pendingRequestCount > 0" :value="pendingRequestCount" class="request-badge" />
      </div>
      
      <div
        class="nav-item"
        :class="{ active: route.path === '/user' }"
        @click="router.push('/user')"
      >
        <el-icon><i-ep-user /></el-icon>
        <span>我的</span>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { House, User, UserFilled, Message } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const pendingRequestCount = ref(0);

// 获取待处理好友请求数量
const fetchPendingRequestCount = async () => {
  try {
    const response = await fetch('/friend/request/pending/count', {
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    const data = await response.json();
    if (data.code === 200) {
      pendingRequestCount.value = data.data;
    }
  } catch (error) {
    console.error('获取待处理好友请求数量失败', error);
  }
};

// 定时器ID
let countTimer = null;

onMounted(() => {
  // 立即获取一次数据
  fetchPendingRequestCount();
  
  // 设置定时器，每分钟获取一次数据
  countTimer = setInterval(fetchPendingRequestCount, 60000);
});

onBeforeUnmount(() => {
  // 组件卸载前清除定时器
  if (countTimer) {
    clearInterval(countTimer);
  }
});
</script>

<style scoped>
.main-sidebar {
  width: 220px;
  background: #fff;
  border-radius: 0 24px 24px 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 100vh;
  box-shadow: none;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 110;
  height: 100vh;
}
.sidebar-header {
  display: flex;
  align-items: center;
  padding: 0 0 0 32px;
  width: 100%;
  height: 64px;
  box-sizing: border-box;
}
.logo-img {
  width: 36px;
  height: 36px;
  margin-right: 12px;
  border-radius: 8px;
  background: #e6f4ff;
  object-fit: contain;
}
.site-title {
  font-size: 20px;
  font-weight: 700;
  color: #1677ff;
  letter-spacing: 1px;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  align-items: flex-start;
  padding: 24px 0 0 0;
}
.nav-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  color: #222;
  font-size: 17px;
  cursor: pointer;
  padding: 0 24px;
  height: 48px;
  border-radius: 12px;
  width: 92%;
  transition: background 0.18s, color 0.18s;
  text-decoration: none;
  font-weight: 500;
  position: relative;
}
.nav-item.active {
  background: #e6f4ff;
  color: #1677ff;
}
.nav-section {
  width: 100%;
  margin-top: 20px;
}
.section-title {
  padding: 0 24px;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #888;
}
.request-badge {
  position: absolute;
  right: 24px;
}
.nav-item:hover {
  background: #e6f4ff;
  color: #1677ff;
}
</style> 