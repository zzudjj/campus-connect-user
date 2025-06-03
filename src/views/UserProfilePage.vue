<template>
  <div class="user-profile-page">
    <HeaderBar :center-search="false" class="profile-header" />
    <div class="override-container">
      <el-card class="profile-card" shadow="hover">
        <div class="card-header">
          <h2 class="page-title">用户资料</h2>
          <el-button @click="router.back()" type="default" size="small">
            <i class="fas fa-arrow-left"></i> 返回
          </el-button>
        </div>

        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="5" animated />
        </div>
        
        <div v-else-if="error" class="error-container">
          <el-empty description="获取用户资料失败" />
          <p class="error-message">{{ errorMessage }}</p>
        </div>
        
        <div v-else class="user-profile-content">
          <!-- 用户基本信息 -->
          <div class="profile-header">
            <el-avatar 
              :size="100" 
              :src="userProfile.avatarUrl || '/default-avatar.png'" 
              class="profile-avatar"
            />
            <div class="profile-info">
              <h3 class="user-name">{{ userProfile.nickname || `用户${userId}` }}</h3>
              <div class="user-meta">
                <el-tag v-if="userProfile.authStatus === 1" type="success" class="auth-tag">
                  <i class="fas fa-check-circle"></i> 已认证
                </el-tag>
                <el-tag v-else type="info" class="auth-tag">
                  <i class="fas fa-question-circle"></i> 未认证
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 用户详细信息 -->
          <div class="profile-details">
            <div class="detail-item" v-if="userProfile.school">
              <span class="detail-label">学校:</span>
              <span class="detail-value">{{ userProfile.school }}</span>
            </div>
            
            <div class="detail-item" v-if="userProfile.department">
              <span class="detail-label">院系:</span>
              <span class="detail-value">{{ userProfile.department }}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">注册时间:</span>
              <span class="detail-value">{{ formatDate(userProfile.createdAt) }}</span>
            </div>
          </div>

          <!-- 操作按钮区域 -->
          <div class="profile-actions" v-if="!isSelf">
            <el-button type="success" disabled>
              <i class="fas fa-user-check"></i> 已是好友
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getUserPublicProfile } from '../api/user';
import { checkFriendStatus } from '../api/friend';
import { ElMessage } from 'element-plus';
import HeaderBar from '../components/layout/HeaderBar.vue';

const router = useRouter();
const route = useRoute();
const userId = computed(() => route.params.id);

const userProfile = ref({});
const loading = ref(true);
const error = ref(false);
const errorMessage = ref('');
const isFriend = ref(false);
const isSelf = ref(false);

// 获取用户公开资料
const fetchUserProfile = async () => {
  loading.value = true;
  error.value = false;
  
  try {
    const response = await getUserPublicProfile(userId.value);
    
    if (response.code === 200 && response.data) {
      userProfile.value = response.data;
      await checkUserRelationship();
    } else {
      error.value = true;
      errorMessage.value = response.message || '获取用户资料失败';
    }
  } catch (err) {
    console.error('获取用户资料失败:', err);
    error.value = true;
    errorMessage.value = '网络错误，请稍后再试';
  } finally {
    loading.value = false;
  }
};

// 检查与当前用户的关系
const checkUserRelationship = async () => {
  try {
    // 检查是否是自己
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    isSelf.value = currentUser.id && currentUser.id.toString() === userId.value.toString();
    
    // 如果不是自己，检查是否是好友
    if (!isSelf.value) {
      const response = await checkFriendStatus(userId.value);
      if (response.code === 200) {
        isFriend.value = response.data.status === 'friend';
      }
    }
  } catch (err) {
    console.error('检查用户关系失败:', err);
  }
};

// 不需要添加好友的功能

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '未知';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

onMounted(() => {
  fetchUserProfile();
});
</script>

<style scoped>
.user-profile-page {
  padding-bottom: 40px;
}

.override-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 15px;
}

.profile-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.page-title {
  font-size: 20px;
  margin: 0;
  color: #303133;
}

.loading-container,
.error-container {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.error-message {
  color: #f56c6c;
  margin-top: 16px;
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
}

.profile-avatar {
  margin-right: 24px;
  border: 3px solid #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.profile-info {
  flex: 1;
}

.user-name {
  font-size: 24px;
  margin: 0 0 8px 0;
  color: #303133;
}

.user-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.auth-tag {
  padding: 4px 8px;
  border-radius: 4px;
}

.profile-details {
  margin-bottom: 24px;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.detail-item {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 600;
  width: 80px;
  color: #606266;
}

.detail-value {
  color: #303133;
}

.profile-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
