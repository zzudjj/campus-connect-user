<template>
  <div class="user-card-wrapper">
    <el-card class="user-card" shadow="hover">
      <!-- 用户信息区 -->
      <div class="user-header">
        <el-avatar :src="user.avatarUrl || '/default-avatar.png'" class="user-avatar" />
        <div class="user-info">
          <div class="user-name">
            {{ user.nickname || `用户${user.id}` }}
          </div>
          <div class="user-meta">
            <span v-if="user.school">{{ user.school }}</span>
            <span v-if="user.department">{{ user.department }}</span>
            <span v-if="user.email && !user.school && !user.department">{{ user.email }}</span>
            <el-tag 
              v-if="user.friendStatus === 'friend'" 
              size="small" 
              type="success" 
              class="friend-status-tag"
            >
              <i class="fas fa-user-check"></i> 好友
            </el-tag>
            <el-tag 
              v-else-if="user.friendStatus === 'pending'" 
              size="small" 
              type="warning" 
              class="friend-status-tag"
            >
              <i class="fas fa-paper-plane"></i> 已发送请求
            </el-tag>
          </div>
          <div class="user-email" v-if="user.email && (user.school || user.department)">
            <i class="fas fa-envelope"></i> {{ user.email }}
          </div>
        </div>
      </div>
      
      <!-- 操作区 -->
      <div class="user-actions">
        <template v-if="user.friendStatus === 'none'">
          <el-button type="primary" size="small" @click="$emit('add-friend', user)">
            <i class="fas fa-user-plus"></i> 添加好友
          </el-button>
        </template>
        <template v-else-if="user.friendStatus === 'pending'">
          <el-button type="info" size="small" disabled>
            <i class="fas fa-hourglass-half"></i> 请求中
          </el-button>
        </template>
        <template v-else-if="user.friendStatus === 'friend'">
          <el-button type="primary" size="small" @click="$emit('view-profile', user.id)">
            <i class="fas fa-user"></i> 查看主页
          </el-button>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  user: {
    type: Object,
    required: true
  }
});

defineEmits(['add-friend', 'view-profile']);
</script>

<style scoped>
.user-card-wrapper {
  width: 100%;
  margin-bottom: 24px;
}

.user-card {
  border-radius: 24px;
  overflow: hidden;
  transition: box-shadow 0.3s, transform 0.3s;
  min-width: 0;
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #e6e6e6;
}

.user-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.user-card :deep(.el-card__body) {
  padding: 24px 30px;
}

.user-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding-bottom: 16px;
}

.user-avatar {
  width: 70px;
  height: 70px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  font-size: 20px;
  margin-bottom: 8px;
  color: #222;
}

.user-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 15px;
  color: #888;
  margin-bottom: 8px;
}

.friend-status-tag {
  font-size: 12px;
  font-weight: normal;
  border-radius: 4px;
}

.friend-status-tag i {
  margin-right: 4px;
}

.user-email {
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-email i {
  font-size: 12px;
}

.user-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.user-actions :deep(.el-button) {
  border-radius: 8px;
  transition: all 0.3s;
  padding: 8px 16px;
  font-size: 14px;
}

.user-actions :deep(.el-button i) {
  margin-right: 6px;
}

.user-actions :deep(.el-button:hover) {
  transform: translateY(-2px);
}

.user-actions :deep(.el-button.el-button--primary:hover) {
  background-color: #1890ff;
}

.user-actions :deep(.el-button.el-button--danger:hover) {
  background-color: #ff4d4f;
}
</style>
