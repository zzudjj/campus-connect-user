<script setup>
// App.vue 是应用的根组件
import { ref, onMounted, onUnmounted } from 'vue';
import HeaderBar from './components/layout/HeaderBar.vue';
import chatSocketService, { notificationState } from './services/ChatSocketService';
import { ElMessage } from 'element-plus';

// 处理未读通知消息
const handleUnreadNotification = (message) => {
  console.log('全局处理未读通知消息:', message);
  
  // 更新未读计数
  if (message && message.count !== undefined) {
    notificationState.unreadCount = message.count;
  }
  
  // 如果有新通知列表，则更新
  if (message && message.notifications && Array.isArray(message.notifications)) {
    // 检查重复通知
    const existingIds = new Set(notificationState.notifications.map(n => n.notificationId));
    const newNotifications = message.notifications.filter(n => !existingIds.has(n.notificationId));
    
    if (newNotifications.length > 0) {
      // 按时间排序，最新的在前
      const sortedNew = [...newNotifications].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      // 添加到列表头部
      notificationState.notifications.unshift(...sortedNew);
    }
  }
  
  // 触发状态更新
  notificationState.lastUpdate = new Date().getTime();
  
  // 分发事件，通知其他组件
  window.dispatchEvent(new CustomEvent('ws-unreadNotification-message', { detail: message }));
};

// 处理联机状态变化
const handleConnectionStatus = (message) => {
  console.log('全局处理联机状态变化:', message);
  
  // 更新联机状态
  if (message && message.connected !== undefined) {
    notificationState.connected = message.connected;
  }
  
  // 分发事件
  window.dispatchEvent(new CustomEvent('ws-connection-status', { detail: message }));
};

// 处理通知消息
const handleNotificationMessage = (message) => {
  console.log('全局处理通知消息:', message);
  
  // 根据API文档新格式处理通知
  if (message && message.data) {
    // 提取通知数据
    const notification = message.data;
    
    // 检查通知是否已存在
    const existingIndex = notificationState.notifications.findIndex(
      n => n.notificationId === notification.notificationId
    );
    
    if (existingIndex >= 0) {
      // 如果已存在，则替换
      notificationState.notifications.splice(existingIndex, 1, notification);
      console.log('更新现有通知:', notification);
    } else {
      // 如果不存在，则添加到列表头部
      notificationState.notifications.unshift(notification);
      console.log('添加新通知:', notification);
    }
  }
  
  // 更新未读通知数量
  if (message && message.unreadCount !== undefined) {
    notificationState.unreadCount = message.unreadCount;
  }
  
  // 触发状态更新
  notificationState.lastUpdate = new Date().getTime();
  
  // 分发事件，通知通知页面更新
  window.dispatchEvent(new CustomEvent('ws-notification-message', { detail: message }));
};

// 处理聊天未读消息更新
const handleUnreadUpdate = (message) => {
  console.log('全局处理聊天未读消息更新:', message);
  
  // 分发事件，通知聊天组件更新
  window.dispatchEvent(new CustomEvent('ws-unread-update', { detail: message }));
};

// 在应用启动时初始化WebSocket连接
onMounted(() => {
  // 检查用户是否登录
  const token = localStorage.getItem('token');
  if (token) {
    console.log('用户已登录，初始化WebSocket连接和所有处理器');
    
    // 初始化WebSocket服务，建立全局连接
    chatSocketService.init({ resetHandlers: true });
    
    // 注册所有全局消息处理器
    console.log('注册全局消息处理器...');
    // chat类型消息由ChatPage.vue组件内部处理
    // online_status类型消息由ChatPage.vue组件内部处理
    chatSocketService.addMessageHandler('notification', handleNotificationMessage); // 通知消息处理器
    chatSocketService.addMessageHandler('unreadNotification', handleUnreadNotification);
    chatSocketService.addMessageHandler('connection', handleConnectionStatus);
    chatSocketService.addMessageHandler('unread', handleUnreadUpdate); // 聊天未读消息处理器
  } else {
    console.log('用户未登录，不初始化WebSocket连接');
  }
});

// 应用卸载时清理处理器
onUnmounted(() => {
  // 这部分不会执行，因为App组件不会卸载
  // 但为了代码完整性还是添加这部分
  console.log('应用卸载，清理全局消息处理器');
  // chat类型消息由ChatPage.vue组件内部处理
  // online_status类型消息由ChatPage.vue组件内部处理
  chatSocketService.removeMessageHandler('notification', handleNotificationMessage); // 移除通知消息处理器
  chatSocketService.removeMessageHandler('unreadNotification', handleUnreadNotification);
  chatSocketService.removeMessageHandler('connection', handleConnectionStatus);
  chatSocketService.removeMessageHandler('unread', handleUnreadUpdate); // 移除聊天未读消息处理器
});
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style>
/* 引入全局样式 */
@import './assets/css/global.css';

/* 框架重置 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

#app {
  height: 100%;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 路由切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

/* 页面滑动过渡效果 */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.35s cubic-bezier(0.55, 0, 0.1, 1);
}

.slide-left-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to,
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
