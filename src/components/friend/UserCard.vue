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
          <el-button class="add-friend-btn" @click="$emit('add-friend', user)">
            <i class="fas fa-plus"></i>
            <span class="btn-text">添加好友</span>
          </el-button>
        </template>
        <template v-else-if="user.friendStatus === 'pending'">
          <el-button class="pending-btn" disabled>
            <i class="fas fa-hourglass-half"></i>
            <span class="btn-text pending-text">请求中</span>
          </el-button>
        </template>
        <template v-else-if="user.friendStatus === 'friend'">
          <el-button class="view-profile-btn" @click="$emit('view-profile', user.id)">
            <i class="fas fa-user"></i>
            <span class="btn-text profile-text">查看主页</span>
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
  position: relative;
  transition: all 0.3s ease;
}

.user-card {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  min-width: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  width: 100%;
  background-color: #ffffff;
  border: none;
  position: relative;
}

.user-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-4px);
  border-color: #1890ff;
}

.user-card :deep(.el-card__body) {
  padding: 24px;
  position: relative;
  z-index: 1;
}

.user-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding-bottom: 16px;
  position: relative;
}

.user-avatar {
  width: 70px;
  height: 70px;
  border: 3px solid #fff;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.user-card:hover .user-avatar {
  transform: scale(1.05);
  box-shadow: 0 6px 15px rgba(0,0,0,0.15);
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  font-size: 20px;
  margin-bottom: 10px;
  color: #222;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 8px;
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
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(0,0,0,0.05);
  position: relative;
}

.user-actions :deep(.el-button) {
  border-radius: 24px;
  transition: all 0.3s;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.user-actions :deep(.el-button i) {
  margin-right: 8px;
  font-size: 16px;
}

.btn-text {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  color: white;
  display: inline-block;
  margin-top: 1px;
}

.user-actions :deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* 添加好友按钮 */
.add-friend-btn {
  background: #2196F3;
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  position: relative;
  overflow: hidden;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 150px;
  height: 46px;
}

.add-friend-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.3), rgba(255,255,255,0));
  transition: all 0.6s;
}

.add-friend-btn:hover {
  background: #1976d2;
  box-shadow: 0 6px 16px rgba(30, 136, 229, 0.4);
}

.add-friend-btn:hover::before {
  left: 100%;
}

/* 请求中按钮 */
.pending-btn {
  background: #f5f7fa;
  color: #909399;
  border: 1px solid #e4e7ed;
  opacity: 0.95;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 150px;
  height: 46px;
}

.pending-btn:hover {
  opacity: 1;
  transform: none;
  box-shadow: none;
}

.pending-text {
  color: #909399;
}

/* 查看主页按钮 */
.view-profile-btn {
  background: #ecf5ff;
  color: #3b91ff;
  border: 1px solid #d9ecff;
  box-shadow: 0 2px 6px rgba(59, 145, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 150px;
  height: 46px;
}

.view-profile-btn:hover {
  background: #d9ecff;
  color: #2a80f0;
  box-shadow: 0 4px 12px rgba(59, 145, 255, 0.2);
}

.profile-text {
  color: #3b91ff;
}

.view-profile-btn:hover .profile-text {
  color: #2a80f0;
}
</style>
