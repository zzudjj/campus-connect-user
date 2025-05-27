<template>
  <div class="request-card-wrapper">
    <el-card class="request-card" shadow="hover">
      <!-- 请求者信息区 -->
      <div class="request-header">
        <el-avatar :src="request.requesterAvatarUrl || request.recipientAvatarUrl || '/default-avatar.png'" class="request-avatar" />
        <div class="request-info">
          <div class="request-name">
            {{ isReceived ? request.requesterNickname : `发给：${request.recipientName || `用户${request.recipientId}`}` }}
          </div>
          <div class="request-meta">
            <span v-if="isReceived">收到的好友请求</span>
            <span v-else>发送的好友请求</span>
            <el-tag 
              v-if="request.status !== 0" 
              size="small" 
              :type="request.status === 1 ? 'success' : 'danger'" 
              class="request-status-tag"
            >
              <i class="fas" :class="request.status === 1 ? 'fa-check-circle' : 'fa-times-circle'"></i>
              {{ request.status === 1 ? '已接受' : '已拒绝' }}
            </el-tag>
          </div>
          <div class="request-time">
            <i class="fas fa-clock"></i>
            {{ formatTime(request.createdAt) }}
          </div>
        </div>
      </div>
      
      <!-- 请求消息 -->
      <div v-if="request.message" class="request-message">
        <i class="fas fa-quote-left quote-icon"></i>
        {{ request.message }}
      </div>
      
      <!-- 操作按钮 -->
      <div class="request-actions">
        <template v-if="isReceived && request.status === 0">
          <el-button type="primary" size="small" @click="$emit('accept', request)">
            <i class="fas fa-check"></i> 接受
          </el-button>
          <el-button type="danger" size="small" @click="$emit('reject', request)">
            <i class="fas fa-times"></i> 拒绝
          </el-button>
        </template>
        <template v-else-if="!isReceived">
          <div class="request-status-info">
            <i class="fas" :class="{
              'fa-hourglass-half': request.status === 0,
              'fa-check-circle': request.status === 1,
              'fa-times-circle': request.status === 2
            }"></i>
            {{ request.status === 0 ? '等待处理' : (request.status === 1 ? '已接受' : '已拒绝') }}
          </div>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  request: {
    type: Object,
    required: true
  },
  isReceived: {
    type: Boolean,
    default: true
  }
});

defineEmits(['accept', 'reject']);

// 格式化时间
const formatTime = (timeString) => {
  if (!timeString) return '';
  
  const date = new Date(timeString);
  const now = new Date();
  const diff = now - date; // 毫秒差值
  
  // 如果时间差小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  // 如果时间差小于30天
  else if (diff < 30 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
  }
  // 否则显示完整日期
  else {
    return date.toLocaleDateString('zh-CN');
  }
};
</script>

<style scoped>
.request-card-wrapper {
  width: 100%;
  margin-bottom: 24px;
}

.request-card {
  border-radius: 24px;
  overflow: hidden;
  transition: box-shadow 0.3s;
  min-width: 0;
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  width: 100%;
  position: relative;
  background-color: #ffffff;
  border: 1px solid #e6e6e6;
}

.request-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.request-card :deep(.el-card__body) {
  padding: 24px 30px;
}

.request-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding-bottom: 16px;
  position: relative;
}

.request-avatar {
  width: 70px;
  height: 70px;
}

.request-info {
  flex: 1;
}

.request-name {
  font-weight: 600;
  font-size: 20px;
  margin-bottom: 8px;
  color: #222;
}

.request-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 15px;
  color: #888;
  margin-bottom: 8px;
}

.request-status-tag {
  font-size: 12px;
  font-weight: normal;
  border-radius: 4px;
}

.request-status-tag i {
  margin-right: 4px;
}

.request-time {
  font-size: 14px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 6px;
}

.request-time i {
  font-size: 12px;
}

.request-message {
  margin: 12px 0 20px;
  padding: 16px 20px;
  background-color: #f9f9f9;
  border-radius: 12px;
  font-size: 16px;
  color: #333;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-line;
  position: relative;
}

.quote-icon {
  color: #ddd;
  font-size: 18px;
  position: absolute;
  top: 12px;
  left: 12px;
}

.request-message {
  padding-left: 38px;
}

.request-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.request-actions :deep(.el-button) {
  border-radius: 8px;
  transition: all 0.3s;
  padding: 8px 16px;
  font-size: 14px;
}

.request-actions :deep(.el-button i) {
  margin-right: 6px;
}

.request-actions :deep(.el-button:hover) {
  transform: translateY(-2px);
}

.request-actions :deep(.el-button.el-button--primary:hover) {
  background-color: #1890ff;
}

.request-actions :deep(.el-button.el-button--danger:hover) {
  background-color: #ff4d4f;
}

.request-status-info {
  font-size: 15px;
  color: #666;
  padding: 6px 0;
  display: flex;
  align-items: center;
}

.request-status-info i {
  margin-right: 8px;
  font-size: 18px;
}

.request-status-info i.fa-check-circle {
  color: #67C23A;
}

.request-status-info i.fa-times-circle {
  color: #F56C6C;
}

.request-status-info i.fa-hourglass-half {
  color: #E6A23C;
}
</style>
