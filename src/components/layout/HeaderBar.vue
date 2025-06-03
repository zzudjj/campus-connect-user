<template>
  <header class="main-header">
    <div class="header-inner">
      <div v-if="centerSearch" class="header-search header-search-center">
        <el-input 
          v-model="searchKeyword" 
          placeholder="搜索校园动态/用户..." 
          @keyup.enter="handleSearch"
          clearable
          @clear="clearSearch"
          class="search-input">
          <template #prefix>
            <el-icon class="search-icon"><i-ep-search /></el-icon>
          </template>
        </el-input>
      </div>
      <div v-else class="header-search"></div>
      
      <!-- 已登录状态 -->
      <div v-if="userStore.isLoggedIn" class="header-user">
        <el-dropdown trigger="click" @command="handleCommand">
          <div class="user-dropdown-link">
            <div class="avatar-container">
              <el-avatar :size="40" :src="userStore.userInfo.avatarUrl || '/avatar.png'" />
            </div>
            <div class="user-info">
              <span class="user-nickname">{{ userStore.userInfo.nickname || '用户' }}</span>
              <el-icon class="el-icon--right"><i-ep-arrow-down /></el-icon>
            </div>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人主页</el-dropdown-item>
              <el-dropdown-item command="verification">账号认证</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      
      <!-- 未登录状态 -->
      <div v-else class="header-user">
        <a href="javascript:void(0)" class="pure-login-btn" @click="handleLogin">登录/注册</a>
      </div>
    </div>
  </header>
  
  <!-- 登录/注册模态框 -->
  <AuthModal 
    v-if="showAuthModal"
    :is-visible="true" 
    :initial-mode="'login'" 
    @close="showAuthModal = false"
    @login-success="handleLoginSuccess"
    @register-success="handleRegisterSuccess"
  />
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/user';
import AuthModal from '../modals/AuthModal.vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  centerSearch: Boolean
});

const router = useRouter();
const userStore = useUserStore();
const showAuthModal = ref(false);
const searchKeyword = ref('');

// 处理搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    return ElMessage({
      message: '请输入搜索内容',
      type: 'warning'
    });
  }
  
  const searchTerm = searchKeyword.value.trim();
  
  // 判断当前是否已经在Feed页面
  if (router.currentRoute.value.path === '/' || router.currentRoute.value.name === 'Feed') {
    // 如果已经在Feed页面，只更新查询参数而不重新加载页面
    router.replace({
      query: { search: searchTerm }
    });
  } else {
    // 如果不在Feed页面，才进行跳转
    router.push({
      path: '/',
      query: { search: searchTerm }
    });
  }
};

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = '';
  // 如果当前在Feed页面并且有search参数，则清除参数
  if (router.currentRoute.value.path === '/feed' && router.currentRoute.value.query.search) {
    router.replace({ path: '/feed' });
  }
};

// 处理下拉菜单选项
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/user');
      break;
    case 'verification':
      // 账号认证页面路由
      router.push('/verification');
      break;
    case 'logout':
      userStore.logout();
      // 重置模态框状态，确保退出后可以再次点击登录
      showAuthModal.value = false;
      break;
  }
};

// 登录成功处理
const handleLoginSuccess = () => {
  showAuthModal.value = false;
};

// 注册成功处理
const handleRegisterSuccess = () => {
  // 可以在这里添加注册成功后的逻辑
};

// 点击登录按钮的处理函数
const handleLogin = () => {
  console.log('打开登录对话框');
  showAuthModal.value = true;
};
</script>

<style scoped>
.main-header {
  width: 100%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  position: sticky;
  top: 0;
  z-index: 100;
  height: 64px;
}
.header-inner {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 32px;
  justify-content: space-between;
}
.header-search {
  flex: 1;
  display: flex;
  align-items: center;
  position: relative;
  max-width: 420px;
}
.header-search-center {
  justify-content: center;
  width: 100%;
  max-width: none;
}
.search-input {
  width: 100%;
  max-width: 420px;
}
.header-user {
  display: flex;
  align-items: center;
  gap: 18px;
}
/* 此样式被移到下方更完整的用户信息样式中 */

/* 登录按钮样式 */
.pure-login-btn {
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  border: none;
  font-size: 14px;
  font-weight: 500;
  border-radius: 20px;
  height: 38px;
  width: 120px;
  color: white;
  cursor: pointer;
  box-shadow: 0 3px 12px rgba(22, 119, 255, 0.2);
  transition: all 0.3s ease;
  padding: 0;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.pure-login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(22, 119, 255, 0.25);
  background: linear-gradient(135deg, #2b84ff 0%, #5aa3ff 100%);
}

/* 用户下拉菜单样式 */
.user-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 24px;
  transition: all 0.3s ease;
  background-color: #f7f9fc;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.user-dropdown-link:hover {
  background-color: #edf2fc;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
}

.avatar-container {
  position: relative;
  margin-right: 10px;
}

.avatar-container::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: #52c41a;
  border: 2px solid #fff;
  border-radius: 50%;
  bottom: 0;
  right: 0;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-nickname {
  font-size: 15px;
  color: #1f2937;
  font-weight: 500;
  margin-right: 4px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.el-icon--right {
  margin-left: 4px;
  font-size: 12px;
  transition: transform 0.3s;
  color: #6b7280;
}

.user-dropdown-link:hover .el-icon--right {
  transform: rotate(180deg);
}
</style> 