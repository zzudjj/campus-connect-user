<template>
  <div class="users-page">
    <h2 class="page-title">全部用户</h2>
    
    <div class="search-box">
      <el-input
        v-model="searchQuery"
        placeholder="搜索用户..."
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><i-ep-search /></el-icon>
        </template>
      </el-input>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>
    
    <div v-else-if="filteredUsers.length === 0" class="empty-state">
      <el-empty description="没有找到匹配的用户" />
    </div>
    
    <div v-else class="users-list">
      <div v-for="user in filteredUsers" :key="user.id" class="user-card">
        <div class="user-avatar">
          <el-avatar :size="50" :src="user.avatarUrl || '/default-avatar.png'" />
        </div>
        <div class="user-info">
          <div class="user-name">{{ user.nickname || `用户${user.id}` }}</div>
          <div class="user-email" v-if="user.email">{{ user.email }}</div>
        </div>
        <div class="user-actions">
          <template v-if="user.friendStatus === 'none'">
            <el-button type="primary" size="small" @click="showAddFriendDialog(user)">添加好友</el-button>
          </template>
          <template v-else-if="user.friendStatus === 'pending'">
            <el-button type="info" size="small" disabled>请求中</el-button>
          </template>
          <template v-else-if="user.friendStatus === 'friend'">
            <el-button type="success" size="small" icon="el-icon-check" disabled>已是好友</el-button>
            <el-button size="small" @click="router.push(`/user/${user.id}`)">查看</el-button>
          </template>
        </div>
      </div>
    </div>
    
    <el-dialog
      v-model="addFriendDialogVisible"
      title="添加好友"
      width="30%"
    >
      <div v-if="currentUser">
        <p>发送好友请求给 {{ currentUser.nickname || `用户${currentUser.id}` }}</p>
        <el-input
          v-model="requestMessage"
          type="textarea"
          :rows="3"
          placeholder="添加验证消息（选填）"
          maxlength="100"
          show-word-limit
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addFriendDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="sendFriendRequest">发送请求</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';

const router = useRouter();
const users = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const addFriendDialogVisible = ref(false);
const currentUser = ref(null);
const requestMessage = ref('');

// 过滤用户列表
const filteredUsers = computed(() => {
  if (!searchQuery.value) {
    return users.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return users.value.filter(user => {
    return (
      (user.nickname && user.nickname.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      user.id.toString().includes(query)
    );
  });
});

// 获取所有用户
const fetchUsers = async () => {
  loading.value = true;
  try {
    // 使用API文档中提到的"获取所有用户简要信息"接口
    const response = await fetch('/user/brief/all', {
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    
    const data = await response.json();
    if (data.code === 200) {
      // 将用户数据处理成所需格式
      const usersList = data.data || [];
      
      // 获取当前用户ID
      const currentUserId = localStorage.getItem('userId');
      
      // 过滤掉当前用户自己
      const filteredList = usersList.filter(user => user.id.toString() !== currentUserId);
      
      // 检查好友关系
      await checkFriendStatus(filteredList);
      
      users.value = filteredList;
    } else {
      ElMessage.error(data.message || '获取用户列表失败');
    }
  } catch (error) {
    console.error('获取用户列表失败', error);
    ElMessage.error('获取用户列表失败，请检查网络连接');
  } finally {
    loading.value = false;
  }
};

// 检查好友关系状态
const checkFriendStatus = async (userList) => {
  try {
    // 获取已发送的好友请求
    const sentResponse = await fetch('/friend/request/sent', {
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    
    const sentData = await sentResponse.json();
    const sentRequests = sentData.code === 200 ? sentData.data : [];
    
    // 获取好友列表
    const friendsResponse = await fetch('/friend/list', {
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    
    const friendsData = await friendsResponse.json();
    const friendsList = friendsData.code === 200 ? friendsData.data : [];
    
    // 更新用户的好友关系状态
    for (const user of userList) {
      // 检查是否已发送好友请求
      const hasSentRequest = sentRequests.some(req => 
        req.recipientId.toString() === user.id.toString() && req.status === 0
      );
      
      // 检查是否已经是好友
      const isFriend = friendsList.some(friend => 
        friend.otherUserId.toString() === user.id.toString()
      );
      
      if (isFriend) {
        user.friendStatus = 'friend';
      } else if (hasSentRequest) {
        user.friendStatus = 'pending';
      } else {
        user.friendStatus = 'none';
      }
    }
  } catch (error) {
    console.error('检查好友状态失败', error);
  }
};

// 搜索处理
const handleSearch = () => {
  // 这里可以添加防抖处理
  // 当前实现直接使用computed属性过滤即可
};

// 显示添加好友对话框
const showAddFriendDialog = (user) => {
  currentUser.value = user;
  requestMessage.value = '';
  addFriendDialogVisible.value = true;
};

// 发送好友请求
const sendFriendRequest = async () => {
  if (!currentUser.value) return;
  
  try {
    const params = new URLSearchParams();
    params.append('recipientId', currentUser.value.id);
    if (requestMessage.value) {
      params.append('message', requestMessage.value);
    }
    
    const response = await fetch('/friend/request/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'token': localStorage.getItem('token')
      },
      body: params
    });
    
    const data = await response.json();
    if (data.code === 200) {
      ElMessage.success('好友请求已发送');
      // 更新用户状态
      currentUser.value.friendStatus = 'pending';
      addFriendDialogVisible.value = false;
    } else {
      ElMessage.error(data.message || '发送好友请求失败');
    }
  } catch (error) {
    console.error('发送好友请求失败', error);
    ElMessage.error('发送好友请求失败，请检查网络连接');
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.users-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.search-box {
  margin-bottom: 20px;
}

.loading-container {
  padding: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.user-avatar {
  margin-right: 16px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.user-email {
  font-size: 14px;
  color: #666;
}

.user-actions {
  display: flex;
  gap: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>
