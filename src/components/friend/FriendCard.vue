<template>
  <div class="friend-card-wrapper">
    <el-card class="friend-card" shadow="hover">
      <!-- 好友信息区 -->
      <div class="friend-header">
        <el-avatar :src="friend.avatarUrl || '/default-avatar.png'" class="friend-avatar" />
        <div class="friend-info">
          <div class="friend-name">
            {{ friend.nickname || `用户${friend.id}` }}
          </div>
          <div class="friend-meta">
            <span v-if="friend.school">{{ friend.school }}</span>
            <span v-if="friend.department">{{ friend.department }}</span>
            <el-tag size="small" type="success" class="friend-tag">
              <i class="fas fa-user-check"></i> 好友
            </el-tag>
          </div>
          <div class="friend-time" v-if="showTime">
            <i class="fas fa-clock"></i>
            {{ formatTime(friend.createdAt) }}
          </div>
        </div>
      </div>
      
      <!-- 内容区 (可选) -->
      <div v-if="friend.message" class="friend-content">
        {{ friend.message }}
      </div>
      
      <!-- 操作区 -->
      <div class="friend-actions">
        <slot name="actions">
          <!-- 默认操作按钮 -->
          <el-button size="small" type="primary" class="action-button">
            <i class="fas fa-user"></i> 查看主页
          </el-button>
          <el-button size="small" type="danger" class="action-button">
            <i class="fas fa-user-times"></i> 删除好友
          </el-button>
        </slot>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  friend: {
    type: Object,
    required: true
  },
  showTime: {
    type: Boolean,
    default: true
  }
});

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
.friend-card-wrapper {
  width: 100%;
  margin-bottom: 24px;
}

.friend-card {
  border-radius: 24px;
  overflow: hidden;
  transition: box-shadow 0.3s;
  min-width: 0;
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #e6e6e6;
}

.friend-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.friend-card :deep(.el-card__body) {
  padding: 24px 30px;
}

.friend-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding-bottom: 16px;
}

.friend-avatar {
  width: 70px;
  height: 70px;
}

.friend-info {
  flex: 1;
}

.friend-name {
  font-weight: 600;
  font-size: 20px;
  margin-bottom: 8px;
  color: #222;
}

.friend-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 15px;
  color: #888;
  margin-bottom: 8px;
}

.friend-tag {
  font-size: 12px;
  font-weight: normal;
  border-radius: 4px;
}

.friend-tag i {
  margin-right: 4px;
}

.friend-time {
  font-size: 14px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 6px;
}

.friend-time i {
  font-size: 12px;
}

.friend-content {
  margin: 12px 0 20px;
  font-size: 16px;
  color: #333;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-line;
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 12px;
}

.friend-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.friend-actions :deep(.el-button) {
  border-radius: 8px;
  transition: all 0.3s;
  padding: 8px 16px;
  font-size: 14px;
}

.friend-actions :deep(.el-button i) {
  margin-right: 6px;
}

.friend-actions :deep(.el-button:hover) {
  transform: translateY(-2px);
}

.friend-actions :deep(.el-button.el-button--primary:hover) {
  background-color: #1890ff;
}

.friend-actions :deep(.el-button.el-button--danger:hover) {
  background-color: #ff4d4f;
}
</style>
