<template>
  <div class="request-card-wrapper">
    <el-card class="request-card" shadow="hover">
      <!-- 请求者信息区 -->
      <div class="request-header">
        <!-- 使用正确的头像展示逻辑 -->
        <el-avatar 
          :src="getAvatarUrl()" 
          class="request-avatar" 
        />
        <div class="request-info">
          <div class="request-name">
            {{ isReceived ? getNickname() : `发给：${getNickname()}` }}
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

// 获取头像地址
const getAvatarUrl = () => {
  const defaultAvatar = '/default-avatar.png';
  
  if (props.isReceived) {
    // 收到的请求，显示请求者的头像
    // 尝试各种可能的字段名
    if (props.request.requesterAvatarUrl) {
      return props.request.requesterAvatarUrl;
    } else if (props.request.requesterAvatar) {
      return props.request.requesterAvatar;
    } else if (props.request.avatarUrl) {
      return props.request.avatarUrl;
    } else {
      return defaultAvatar;
    }
  } else {
    // 发送的请求，显示接收者的头像
    // 尝试各种可能的字段名
    if (props.request.recipientAvatarUrl) {
      return props.request.recipientAvatarUrl;
    } else if (props.request.recipientAvatar) {
      return props.request.recipientAvatar;
    } else if (props.request.toUserAvatar) {
      return props.request.toUserAvatar;
    } else {
      return defaultAvatar;
    }
  }
};

// 获取显示的昵称
const getNickname = () => {
  if (props.isReceived) {
    // 收到的请求，显示请求者的昵称
    // 尝试各种可能的字段名
    if (props.request.requesterNickname) {
      return props.request.requesterNickname;
    } else if (props.request.requesterName) {
      return props.request.requesterName;
    } else if (props.request.nickname) {
      return props.request.nickname;
    } else {
      return `用户${props.request.requesterId || props.request.userId || 'Unknown'}`;
    }
  } else {
    // 发送的请求，显示接收者的昵称
    // 尝试各种可能的字段名
    if (props.request.recipientName) {
      return props.request.recipientName;
    } else if (props.request.recipientNickname) {
      return props.request.recipientNickname;
    } else if (props.request.toUserName) {
      return props.request.toUserName;
    } else {
      return `用户${props.request.recipientId || props.request.toUserId || 'Unknown'}`;
    }
  }
};

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
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  min-width: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  width: 100%;
  position: relative;
  background-color: #ffffff;
  border: none;
  overflow: visible;
}

.request-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-4px);
}

.request-card :deep(.el-card__body) {
  padding: 24px;
  position: relative;
  z-index: 1;
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
  border: 3px solid #fff;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.request-card:hover .request-avatar {
  transform: scale(1.05);
  box-shadow: 0 6px 15px rgba(0,0,0,0.15);
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
  padding: 20px 24px;
  background-color: #f7f9fe;
  border-radius: 12px;
  font-size: 16px;
  color: #333;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-line;
  position: relative;
  border-left: 4px solid #1890ff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  transition: all 0.3s ease;
}

.request-card:hover .request-message {
  background-color: #f0f7ff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.quote-icon {
  color: #1890ff;
  font-size: 18px;
  position: absolute;
  top: 15px;
  left: 15px;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.request-card:hover .quote-icon {
  transform: scale(1.1);
  opacity: 0.8;
}

.request-message {
  padding-left: 38px;
}

.request-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(0,0,0,0.05);
  position: relative;
}

.request-actions :deep(.el-button) {
  border-radius: 20px;
  transition: all 0.3s;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.request-actions :deep(.el-button i) {
  margin-right: 6px;
}

.request-actions :deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
  padding: 8px 16px;
  display: flex;
  align-items: center;
  background-color: #f9f9f9;
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.request-card:hover .request-status-info {
  box-shadow: 0 3px 8px rgba(0,0,0,0.08);
  transform: translateY(-2px);
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
