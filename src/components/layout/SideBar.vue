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
      
      <!-- 聊天选项 -->
      <div
        class="nav-item"
        :class="{ active: route.path === '/chat' }"
        @click="router.push('/chat')"
      >
        <el-icon><i-ep-chat-dot-round /></el-icon>
        <span>聊天</span>
        <el-badge v-if="unreadMessageCount > 0" :value="unreadMessageCount" class="message-badge" />
      </div>
      
      <div
        class="nav-item"
        :class="{ active: route.path === '/user' }"
        @click="router.push('/user')"
      >
        <el-icon><i-ep-user /></el-icon>
        <span>我的</span>
      </div>
      
      <!-- 分隔线 -->
      <div class="sidebar-divider"></div>
      
      <!-- 通知选项 -->
      <div
        class="nav-item"
        :class="{ active: route.path === '/notification' }"
        @click="router.push('/notification')"
      >
        <el-icon><i-ep-bell /></el-icon>
        <span>通知</span>
        <el-badge v-if="unreadNotificationCount > 0" :value="unreadNotificationCount" class="notification-badge" />
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { House, User, UserFilled, ChatDotRound, Bell } from '@element-plus/icons-vue';
import { getConversations } from '../../api/chat';
import { getUnreadCount } from '../../api/notification';
import { notificationState, initWebSocket } from '../../services/ChatSocketService';

const route = useRoute();
const router = useRouter();
const pendingRequestCount = ref(0);
const unreadMessageCount = ref(0);
const unreadNotificationCount = ref(0);

// 获取待处理好友请求数量
const fetchPendingRequestCount = async () => {
  try {
    const data = await fetch('http://localhost:8080/friend/request/pending/count', {
      headers: {
        'token': localStorage.getItem('token')
      }
    }).then(res => res.json());
    
    if (data.code === 200) {
      pendingRequestCount.value = data.data;
    }
  } catch (error) {
    console.error('获取待处理好友请求数量失败', error);
  }
};

// 获取未读消息数量
const fetchUnreadMessageCount = async () => {
  try {
    const data = await getConversations();
    if (data.code === 200) {
      // 计算未读消息数量
      const unreadCount = data.data.filter(conversation => conversation.readStatus === 0).length;
      unreadMessageCount.value = unreadCount;
    }
  } catch (error) {
    console.error('获取未读消息数量失败', error);
  }
};

// 获取未读通知数量
const fetchUnreadNotificationCount = async () => {
  try {
    // 优先使用WebSocket状态中的数据
    if (notificationState.unreadCount > 0) {
      unreadNotificationCount.value = notificationState.unreadCount;
      return;
    }
    
    // 如果WebSocket没有数据，则使用API获取
    const data = await getUnreadCount();
    if (data.code === 200) {
      unreadNotificationCount.value = data.data;
      notificationState.unreadCount = data.data;
    }
  } catch (error) {
    console.error('获取未读通知数量失败', error);
  }
};

let requestTimer;
let messageTimer;

// 监听通知状态变化
const setupNotificationWatcher = () => {
  // 使用watch API监听notificationState.unreadCount变化
  const unsubscribe = setInterval(() => {
    if (notificationState.unreadCount !== unreadNotificationCount.value) {
      unreadNotificationCount.value = notificationState.unreadCount;
    }
  }, 1000); // 每秒检查一次状态变化
  
  return unsubscribe;
};

let notificationWatcher;

onMounted(() => {
  // 初始化待处理请求数量和未读消息数量
  fetchPendingRequestCount();
  fetchUnreadMessageCount();
  fetchUnreadNotificationCount();
  
  // 初始化WebSocket连接，开始接收通知
  initWebSocket();
  
  // 设置状态监听
  notificationWatcher = setupNotificationWatcher();
  
  // 设置定时器，每分钟获取一次待处理请求数量
  requestTimer = setInterval(fetchPendingRequestCount, 60000);
  
  // 设置定时器，每30秒获取一次未读消息数量
  messageTimer = setInterval(fetchUnreadMessageCount, 30000);
});

onBeforeUnmount(() => {
  // 清除定时器
  if (requestTimer) clearInterval(requestTimer);
  if (messageTimer) clearInterval(messageTimer);
  if (notificationWatcher) clearInterval(notificationWatcher);
  
  // 这里不关闭WebSocket连接，因为其他组件可能还在使用
  // WebSocket连接会在用户登出时由user.js中的logout方法关闭
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

.sidebar-divider {
  height: 1px;
  background-color: #e6e6e6;
  margin: 12px 24px;
  width: 80%;
}

.notification-badge {
  position: absolute;
  right: 24px;
}
</style> 