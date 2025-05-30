<template>
  <div class="notification-page" :key="refreshCounter">
    <div class="notification-card">
      <div class="notification-header">
        <h2>通知中心</h2>
        <div class="header-actions">
          <el-button 
            v-if="notificationState.unreadCount > 0" 
            type="primary" 
            plain 
            size="small" 
            @click="markAllNotificationsAsReadWS"
          >
            全部标为已读
          </el-button>
        </div>
      </div>
      
      <!-- 通知类型切换标签 -->
      <div class="notification-tabs">
        <el-tabs v-model="activeTab" class="modern-tabs">
          <el-tab-pane name="system">
            <template #label>
              <div class="tab-label">
                系统通知
                <el-badge v-if="getUnreadCountByType(0) > 0" :value="getUnreadCountByType(0)" class="tab-badge" />
              </div>
            </template>
          </el-tab-pane>
          
          <el-tab-pane name="comments">
            <template #label>
              <div class="tab-label">
                收到的回复
                <el-badge v-if="getUnreadCountByType(1) > 0" :value="getUnreadCountByType(1)" class="tab-badge" />
              </div>
            </template>
          </el-tab-pane>
          
          <el-tab-pane name="likes">
            <template #label>
              <div class="tab-label">
                收到的赞
                <el-badge v-if="getUnreadCountByType(2) > 0" :value="getUnreadCountByType(2)" class="tab-badge" />
              </div>
            </template>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <!-- 通知内容 -->
      <div class="notification-content-wrapper" v-loading="loading">
        <!-- 系统通知 -->
        <div v-if="activeTab === 'system'">
          <div class="notification-items" v-if="notificationsByType[0].length > 0">
            <div 
              v-for="notification in notificationsByType[0]" 
              :key="notification.notificationId"
              :class="['notification-item', {'unread': notification.readStatus === 0}]"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-content">
                <div class="notification-sender">
                  <el-avatar :size="32" :src="notification.senderAvatar" />
                  <span class="sender-name">{{ notification.senderName }}</span>
                </div>
                
                <div class="notification-text">{{ notification.content }}</div>
                
                <div class="notification-time">{{ formatNotificationTime(notification.createdAt) }}</div>
              </div>
              
              <div class="notification-status" v-if="notification.readStatus === 0">
                <div class="unread-dot"></div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无系统通知" />
        </div>
        
        <!-- 回复通知 -->
        <div v-if="activeTab === 'comments'">
          <div class="notification-items" v-if="notificationsByType[1].length > 0">
            <div 
              v-for="notification in notificationsByType[1]" 
              :key="notification.notificationId"
              :class="['notification-item', {'unread': notification.readStatus === 0}]"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-content">
                <div class="notification-sender">
                  <el-avatar :size="32" :src="notification.senderAvatar" />
                  <span class="sender-name">{{ notification.senderName }}</span>
                </div>
                
                <div class="notification-text">{{ notification.content }}</div>
                
                <div class="notification-time">{{ formatNotificationTime(notification.createdAt) }}</div>
              </div>
              
              <div class="notification-status" v-if="notification.readStatus === 0">
                <div class="unread-dot"></div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无回复通知" />
        </div>
        
        <!-- 点赞通知 -->
        <div v-if="activeTab === 'likes'">
          <div class="notification-items" v-if="notificationsByType[2].length > 0">
            <div 
              v-for="notification in notificationsByType[2]" 
              :key="notification.notificationId"
              :class="['notification-item', {'unread': notification.readStatus === 0}]"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-content">
                <div class="notification-sender">
                  <el-avatar :size="32" :src="notification.senderAvatar" />
                  <span class="sender-name">{{ notification.senderName }}</span>
                </div>
                
                <div class="notification-text">{{ notification.content }}</div>
                
                <div class="notification-time">{{ formatNotificationTime(notification.createdAt) }}</div>
              </div>
              
              <div class="notification-status" v-if="notification.readStatus === 0">
                <div class="unread-dot"></div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无点赞通知" />
        </div>
      </div>
      
      <!-- 分页 -->
      <div class="notification-pagination" v-if="showPagination && totalPages > 1">
        <el-pagination
          layout="prev, pager, next"
          :total="totalCount"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watchEffect, watch, reactive } from 'vue';
import { getNotificationList } from '../api/notification';
import chatSocketService, { 
  notificationState, 
  initWebSocket, 
  closeWebSocket, 
  markAllNotificationsAsReadWS, 
  handleNotificationClick,
  formatNotificationTime
} from '../services/ChatSocketService';

// 添加调试消息
console.log('NotificationPage组件已加载');
import { Bell, ChatDotRound, Star } from '@element-plus/icons-vue';

// 用于强制刷新视图的计数器
const refreshCounter = ref(0);

// 强制刷新视图的函数
const forceRefresh = () => {
  refreshCounter.value++;
  console.log(`强制刷新视图: ${refreshCounter.value}`);
};

// 页面状态
const activeTab = ref('likes'); // 默认显示点赞通知标签
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);
const totalPages = ref(1);

// 按类型分组的通知
const notificationsByType = computed(() => {
  const groupedNotifications = [[], [], []];
  
  notificationState.notifications.forEach(notification => {
    // 分组到对应类型数组，确保类型值在有效范围内
    const type = notification.type >= 0 && notification.type <= 2 ? notification.type : 0;
    groupedNotifications[type].push(notification);
  });
  
  return groupedNotifications;
});

// 是否有任何通知
const hasAnyNotifications = computed(() => {
  return notificationState.notifications.length > 0;
});

// 是否显示分页
const showPagination = computed(() => {
  return totalCount.value > pageSize.value;
});

// 获取指定类型的未读通知数量
const getUnreadCountByType = (type) => {
  return notificationState.notifications.filter(n => n.type === type && n.readStatus === 0).length;
};

// 初始化通知数据
const initNotifications = async () => {
  loading.value = true;
  
  try {
    // 不再初始化WebSocket连接和注册处理器，因为这些已在App.vue中完成
    console.log('通知页面初始化，使用全局WebSocket处理器...');
    
    // 通过API获取通知列表
    const response = await getNotificationList(currentPage.value, pageSize.value);
    
    if (response.code === 200 && response.data) {
      notificationState.notifications = response.data;
      totalCount.value = response.data.length;
      totalPages.value = Math.ceil(totalCount.value / pageSize.value);
      
      // 计算未读数量
      notificationState.unreadCount = response.data.filter(n => n.readStatus === 0).length;
    } else {
      console.error('获取通知列表失败:', response.message);
    }
  } catch (error) {
    console.error('初始化通知数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 处理分页变化
const handlePageChange = async (page) => {
  currentPage.value = page;
  await fetchNotificationsByPage(page);
};

// 根据页码获取通知
const fetchNotificationsByPage = async (page) => {
  loading.value = true;
  
  try {
    const response = await getNotificationList(page, pageSize.value);
    
    if (response.code === 200 && response.data) {
      notificationState.notifications = response.data;
    }
  } catch (error) {
    console.error('获取通知分页数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 直接监听 notificationState.lastUpdate 变化
watch(() => notificationState.lastUpdate, (newValue, oldValue) => {
  console.log(`监测到 lastUpdate 变化: ${oldValue} -> ${newValue}`);
  
  // 每次 lastUpdate 变化时触发强制刷新
  forceRefresh();
  
  // 更新分页信息
  totalCount.value = notificationState.notifications.length;
  totalPages.value = Math.ceil(totalCount.value / pageSize.value);
}, { immediate: true }); // 立即执行一次

// 深度监听notificationState的变化
watchEffect(() => {
  // 强制访问通知数组的所有元素及其属性，确保响应式追踪
  const notificationsList = notificationState.notifications;
  const count = notificationsList.length;
  
  // 访问当前选中标签页的通知
  const currentTabType = activeTab.value === 'system' ? 0 : (activeTab.value === 'comments' ? 1 : 2);
  const currentTabNotifications = notificationsByType.value[currentTabType];
  
  console.log('通知状态变化:', {
    unreadCount: notificationState.unreadCount,
    notificationsCount: count,
    currentTab: activeTab.value,
    currentTabCount: currentTabNotifications.length,
    refreshCounter: refreshCounter.value,
    timestamp: new Date().toISOString()
  });
});

// 用于监听来自全局的通知消息
// 全局消息处理器已移到App.vue中

// 页面初始化
onMounted(() => {
  // 初始化通知数据
  initNotifications();
  
  // 监听全局通知事件
  console.log('通知页面挂载，监听全局通知事件...');
  // 所有消息处理器已移到App.vue中
});

// 页面卸载时清理
onBeforeUnmount(() => {
  console.log('通知页面卸载...');
  // 不需要关闭WebSocket连接
  // 连接应该保持到用户登出时才断开
});
</script>

<style scoped>
.notification-page {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.notification-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 20px;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.notification-header h2 {
  font-size: 22px;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.notification-tabs {
  margin-bottom: 20px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-badge {
  transform: scale(0.8);
}

/* 现代化标签页样式 */
:deep(.modern-tabs) {
  --el-color-primary: #409eff;
}

:deep(.modern-tabs .el-tabs__header) {
  margin-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.modern-tabs .el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.modern-tabs .el-tabs__active-bar) {
  height: 3px;
  border-radius: 3px;
}

:deep(.modern-tabs .el-tabs__item) {
  padding: 0 20px 12px;
  height: 40px;
  font-size: 16px;
  color: #606266;
  line-height: 40px;
  transition: all 0.3s;
}

:deep(.modern-tabs .el-tabs__item.is-active) {
  color: var(--el-color-primary);
  font-weight: 500;
}

:deep(.modern-tabs .el-tabs__item:hover) {
  color: var(--el-color-primary);
}

.notification-content-wrapper {
  min-height: 300px;
}

.notification-items {
  background-color: #fafafa;
  border-radius: 8px;
  overflow: hidden;
}

.notification-item {
  padding: 16px 20px;
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
  position: relative;
  background-color: #fff;
  margin-bottom: 1px;
}

.notification-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.notification-item:hover {
  background-color: #f9f9f9;
}

.notification-item.unread {
  background-color: #f0f7ff;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.notification-icon-system {
  background-color: #e6f7ff;
  color: #1890ff;
}

.notification-icon-comment {
  background-color: #f6ffed;
  color: #52c41a;
}

.notification-icon-like {
  background-color: #fff7e6;
  color: #fa8c16;
}

.notification-content {
  flex-grow: 1;
}

.notification-sender {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.sender-name {
  font-weight: bold;
  margin-left: 8px;
  color: #333;
}

.notification-text {
  color: #333;
  line-height: 1.5;
  margin-bottom: 8px;
}

.notification-time {
  color: #999;
  font-size: 12px;
}

.notification-status {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #1890ff;
}

.notification-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 空状态样式 */
:deep(.el-empty) {
  padding: 40px 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .notification-card {
    padding: 16px;
  }
  
  .notification-item {
    padding: 12px 16px;
  }
  
  .notification-icon {
    width: 36px;
    height: 36px;
    margin-right: 12px;
  }
  
  .notification-header h2 {
    font-size: 20px;
  }
  
  .section-header h3 {
    font-size: 16px;
  }
}
</style>
