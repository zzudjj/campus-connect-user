<template>
  <div class="friends-page">
    <HeaderBar :center-search="false" class="friends-header" />
    <div class="override-container">
      <el-card class="main-card" shadow="hover">
        <div class="card-header">
          <h2 class="page-title">好友</h2>
        </div>
        
        <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="friends-tabs">
          <!-- 好友列表标签页 -->
          <el-tab-pane label="好友列表" name="friendsList">
            <div v-if="loadingFriends" class="loading-container">
              <div class="loading-spinner">
                <div class="spinner-circle"></div>
              </div>
              <div class="loading-text">加载中...</div>
            </div>
            
            <div v-else-if="friends.length === 0" class="empty-state">
              <el-empty description="暂无好友" />
              <el-button type="primary" @click="activeTab = 'allUsers'">去添加好友</el-button>
            </div>
            
            <div v-else class="masonry-container">
              <FriendCard 
                v-for="friend in friends" 
                :key="friend.friendshipId" 
                :friend="friend"
              >
                <template #actions>
                  <el-button size="small" @click="router.push(`/user/${friend.otherUserId}`)">查看</el-button>
                  <el-button size="small" type="danger" @click="confirmDeleteFriend(friend)">删除</el-button>
                </template>
              </FriendCard>
            </div>
          </el-tab-pane>
          
          <!-- 收到的好友请求标签页 -->
          <el-tab-pane :label="'收到的请求' + (pendingRequestCount > 0 ? `(${pendingRequestCount})` : '')" name="receivedRequests">
            <div v-if="loadingReceived" class="loading-container">
              <div class="loading-spinner">
                <div class="spinner-circle"></div>
              </div>
              <div class="loading-text">加载中...</div>
            </div>
            
            <div v-else-if="receivedRequests.length === 0" class="empty-state">
              <el-empty description="暂无收到的好友请求" />
            </div>
            
            <div v-else class="masonry-container">
              <RequestCard
                v-for="request in receivedRequests"
                :key="request.requestId"
                :request="request"
                :is-received="true"
                @accept="acceptRequest"
                @reject="rejectRequest"
              />
            </div>
          </el-tab-pane>
          
          <!-- 发送的好友请求标签页 -->
          <el-tab-pane label="发送的请求" name="sentRequests">
            <div v-if="loadingSent" class="loading-container">
              <div class="loading-spinner">
                <div class="spinner-circle"></div>
              </div>
              <div class="loading-text">加载中...</div>
            </div>
            
            <div v-else-if="sentRequests.length === 0" class="empty-state">
              <el-empty description="暂无发送的好友请求" />
              <el-button type="primary" @click="activeTab = 'allUsers'">去添加好友</el-button>
            </div>
            
            <div v-else class="masonry-container">
              <RequestCard
                v-for="request in sentRequests"
                :key="request.requestId"
                :request="request"
                :is-received="false"
              />
            </div>
          </el-tab-pane>
          
          <!-- 全部用户标签页 -->
          <el-tab-pane label="全部用户" name="allUsers">
            <div class="search-container">
              <div class="search-box">
                <el-input
                  v-model="searchQuery"
                  placeholder="搜索用户昵称..."
                  clearable
                  @input="handleSearch"
                  @clear="handleSearch"
                  @keyup.enter="handleSearch"
                >
                  <template #prefix>
                    <el-icon><i-ep-search /></el-icon>
                  </template>
                </el-input>
              </div>
              <p class="no-results" v-if="isSearching && totalUsers === 0">
                未找到符合 "{{ searchQuery }}" 的用户
              </p>
            </div>
            
            <div v-if="loadingUsers" class="loading-container">
              <div class="loading-spinner">
                <div class="spinner-circle"></div>
              </div>
              <div class="loading-text">加载中...</div>
            </div>
            
            <div v-else-if="filteredUsers.length === 0" class="empty-state">
              <el-empty description="没有找到匹配的用户" />
            </div>
            
            <div v-else class="masonry-container">
              <UserCard
                v-for="user in filteredUsers"
                :key="user.id"
                :user="user"
                @add-friend="showAddFriendDialog"
                @view-profile="viewUserProfile"
              />
              
              <!-- 分页器 -->
              <div class="pagination-container" v-if="isSearching && totalPages > 1">
                <el-pagination
                  v-model:currentPage="currentPage"
                  :page-size="pageSize.value"
                  layout="prev, pager, next"
                  :total="totalUsers"
                  @current-change="handlePageChange"
                  :pager-count="5"
                  background
                  hide-on-single-page
                />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
        
        <!-- 删除好友确认对话框 -->
        <el-dialog
          v-model="deleteDialogVisible"
          title="删除好友"
          width="30%"
        >
          <span>确定要删除好友 "{{ currentFriend?.nickname || '' }}" 吗？</span>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="deleteDialogVisible = false">取消</el-button>
              <el-button type="danger" @click="deleteFriend">确认删除</el-button>
            </span>
          </template>
        </el-dialog>
        
        <!-- 添加好友对话框 -->
        <el-dialog
          v-model="addFriendDialogVisible"
          title="添加好友"
          width="400px"
          append-to-body
          :modal-append-to-body="true"
          :lock-scroll="true"
          :close-on-click-modal="false"
          :show-close="true"
          destroy-on-close
          custom-class="friend-dialog"
          :top="'15vh'"
        >
          <div v-if="currentUser" class="add-friend-content">
            <div class="friend-request-header">
              <el-avatar :size="64" :src="currentUser.avatarUrl || '/default-avatar.png'" class="friend-avatar" />
              <div class="friend-info">
                <h3 class="friend-name">{{ currentUser.nickname || `用户${currentUser.id}` }}</h3>
                <p class="friend-meta" v-if="currentUser.school || currentUser.department">
                  {{ currentUser.school || '' }} {{ currentUser.department || '' }}
                </p>
              </div>
            </div>
            
            <div class="message-section">
              <p class="message-label">添加验证消息<span class="optional-tag">（选填）</span></p>
              <el-input
                v-model="requestMessage"
                type="textarea"
                :rows="3"
                placeholder="说点什么吧..."
                maxlength="100"
                show-word-limit
                class="message-input"
              />
            </div>
          </div>
          <template #footer>
            <div class="dialog-footer">
              <el-button plain @click="cancelAddFriend" class="cancel-btn">取消</el-button>
              <el-button type="primary" @click="sendFriendRequest" class="send-btn">
                <i class="fas fa-paper-plane"></i> 发送请求
              </el-button>
            </div>
          </template>
        </el-dialog>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import HeaderBar from '../components/layout/HeaderBar.vue';
import FriendCard from '../components/friend/FriendCard.vue';
import UserCard from '../components/friend/UserCard.vue';
import RequestCard from '../components/friend/RequestCard.vue';
import { debounce } from 'lodash';

// 导入API
import { 
  getFriendsList, 
  deleteFriend as apiDeleteFriend, 
  getReceivedRequests, 
  getSentRequests, 
  getPendingRequestCount, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  checkFriendStatus, 
  sendFriendRequest as apiSendFriendRequest 
} from '../api/friend.js';
import { getNonFriendUsers, getUserPublicProfile, searchUsersByNickname } from '../api/user.js';

const router = useRouter();

// 标签页状态
const activeTab = ref('friendsList');

// 好友列表相关
const friends = ref([]);
const loadingFriends = ref(true);
const deleteDialogVisible = ref(false);
const currentFriend = ref(null);

// 好友请求相关
const receivedRequests = ref([]);
const sentRequests = ref([]);
const loadingReceived = ref(true);
const loadingSent = ref(true);
const pendingRequestCount = ref(0);

// 全部用户相关
const users = ref([]);
const loadingUsers = ref(false);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalUsers = ref(0);
const totalPages = ref(1);
const isSearching = ref(false);
const searchError = ref('');

const addFriendDialogVisible = ref(false);
const currentUser = ref(null);
const requestMessage = ref('');

// 定时器ID
let countTimer = null;

// 获取好友列表
const fetchFriends = async () => {
  loadingFriends.value = true;
  try {
    const data = await getFriendsList();
    if (data.code === 200) {
      friends.value = data.data || [];
    } else {
      ElMessage.error(data.message || '获取好友列表失败');
    }
  } catch (error) {
    console.error('获取好友列表失败', error);
    ElMessage.error('获取好友列表失败，请检查网络连接');
  } finally {
    loadingFriends.value = false;
  }
};

// 删除好友确认
const confirmDeleteFriend = (friend) => {
  currentFriend.value = friend;
  deleteDialogVisible.value = true;
};

// 删除好友
const deleteFriend = async () => {
  if (!currentFriend.value) return;
  
  try {
    const data = await apiDeleteFriend(currentFriend.value.otherUserId);
    if (data.code === 200) {
      ElMessage.success('好友删除成功');
      // 从列表中移除该好友
      friends.value = friends.value.filter(f => f.friendshipId !== currentFriend.value.friendshipId);
      deleteDialogVisible.value = false;
      
      // 如果当前是在用户标签页，也需要更新用户的好友状态
      if (users.value.length > 0) {
        const userIndex = users.value.findIndex(u => u.id === currentFriend.value.otherUserId);
        if (userIndex !== -1) {
          users.value[userIndex].friendStatus = 'none';
        }
      }
    } else {
      ElMessage.error(data.message || '删除好友失败');
    }
  } catch (error) {
    console.error('删除好友失败', error);
    ElMessage.error('删除好友失败，请检查网络连接');
  }
};

// 获取收到的好友请求
const fetchReceivedRequests = async () => {
  loadingReceived.value = true;
  try {
    const data = await getReceivedRequests();
    if (data.code === 200) {
      receivedRequests.value = data.data || [];
      // 打印收到的请求数据以便调试
      console.group('收到的好友请求数据');
      console.log('数据:', receivedRequests.value);
      console.log('第一条数据的字段:', receivedRequests.value.length > 0 ? Object.keys(receivedRequests.value[0]) : []);
      console.groupEnd();
      // 更新待处理请求数量
      pendingRequestCount.value = receivedRequests.value.filter(req => req.status === 0).length;
    } else {
      ElMessage.error(data.message || '获取收到的好友请求失败');
    }
  } catch (error) {
    console.error('获取收到的好友请求失败', error);
    ElMessage.error('获取收到的好友请求失败，请检查网络连接');
  } finally {
    loadingReceived.value = false;
  }
};

// 获取发送的好友请求 - 使用getUserPublicProfile API
const fetchSentRequests = async () => {
  loadingSent.value = true;
  try {
    const data = await getSentRequests();
    if (data.code === 200) {
      // 处理发送请求列表，为每个请求添加接收方的信息
      const requests = data.data || [];
      
      // 使用getUserPublicProfile API获取用户信息
      const processedRequests = await Promise.all(requests.map(async (req) => {
        try {
          // 使用getUserPublicProfile API获取用户公开资料
          const userRes = await getUserPublicProfile(req.recipientId);
          
          if (userRes && userRes.code === 200 && userRes.data) {
            // 从用户信息中提取头像和昵称
            return {
              ...req,
              // 使用getUserPublicProfile返回的字段名称
              recipientName: userRes.data.nickname || `用户${req.recipientId}`,
              recipientAvatarUrl: userRes.data.avatarUrl || '/default-avatar.png'
            };
          } else {
            return {
              ...req,
              recipientAvatarUrl: '/default-avatar.png',
              recipientName: `用户${req.recipientId}`
            };
          }
        } catch (err) {
          console.error(`获取用户${req.recipientId}公开资料失败:`, err);
          return {
            ...req,
            recipientAvatarUrl: '/default-avatar.png',
            recipientName: `用户${req.recipientId}`
          };
        }
      }));
      
      sentRequests.value = processedRequests;
    } else {
      ElMessage.error(data.message || '获取发送的好友请求失败');
    }
  } catch (error) {
    console.error('获取发送的好友请求失败', error);
    ElMessage.error('获取发送的好友请求失败，请检查网络连接');
  } finally {
    loadingSent.value = false;
  }
};

// 获取待处理的好友请求数量
const fetchPendingRequestCount = async () => {
  try {
    const data = await getPendingRequestCount();
    if (data.code === 200) {
      pendingRequestCount.value = data.data;
    }
  } catch (error) {
    console.error('获取待处理好友请求数量失败', error);
  }
};

// 接受好友请求
const acceptRequest = async (request) => {
  try {
    const data = await acceptFriendRequest(request.requestId);
    if (data.code === 200) {
      ElMessage.success('已接受好友请求');
      // 从收到的请求列表中移除
      receivedRequests.value = receivedRequests.value.filter(req => req.requestId !== request.requestId);
      // 更新待处理请求数量
      pendingRequestCount.value = Math.max(0, pendingRequestCount.value - 1);
      // 刷新好友列表
      fetchFriends();
    } else {
      ElMessage.error(data.message || '接受好友请求失败');
    }
  } catch (error) {
    console.error('接受好友请求失败', error);
    ElMessage.error('接受好友请求失败，请检查网络连接');
  }
};

// 拒绝好友请求
const rejectRequest = async (request) => {
  try {
    const data = await rejectFriendRequest(request.requestId);
    if (data.code === 200) {
      ElMessage.success('已拒绝好友请求');
      // 从收到的请求列表中移除
      receivedRequests.value = receivedRequests.value.filter(req => req.requestId !== request.requestId);
      // 更新待处理请求数量
      pendingRequestCount.value = Math.max(0, pendingRequestCount.value - 1);
    } else {
      ElMessage.error(data.message || '拒绝好友请求失败');
    }
  } catch (error) {
    console.error('拒绝好友请求失败', error);
    ElMessage.error('拒绝好友请求失败，请检查网络连接');
  }
};

// 获取所有用户
// 检查登录状态的辅助函数
const checkLoginStatus = () => {
  console.group('当前登录状态详情');
  // 打印所有localStorage内容供调试
  console.log('全部localStorage内容:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`${key}: ${value}`);
  }
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const nickname = localStorage.getItem('nickname');
  console.log('登录状态检查:', { 
    token: token ? '存在' : '不存在', 
    userId, 
    nickname,
    userAgent: navigator.userAgent
  });
  console.groupEnd();
  return { token, userId, nickname };
};

const fetchUsers = async () => {
  loadingUsers.value = true;
  try {
    // 在获取用户列表前检查登录状态
    const loginStatus = checkLoginStatus();
    
    let data;
    
    // 如果有搜索关键词，使用searchUsersByNickname API，否则获取非好友用户
    if (searchQuery.value.trim()) {
      isSearching.value = true;
      data = await searchUsersByNickname(searchQuery.value, currentPage.value, pageSize.value);
    } else {
      isSearching.value = false;
      // 使用新的API获取非好友用户列表
      data = await getNonFriendUsers(currentPage.value, pageSize.value);
    }
    
    if (data.code === 200) {
      console.group('处理用户列表');
      // 获取数据信息
      if (isSearching.value || !Array.isArray(data.data)) {
        // 兼容不同分页字段
        // 判断是否使用分页形式的API返回
        if (data.data.list) {
          const total = data.data.total || 0;
          const pages = data.data.pages || 1;
          
          console.log('用户列表结果:', { 总数: total, 总页数: pages });
          
          totalUsers.value = total;
          totalPages.value = pages;
        } else if (data.data.totalCount) {
          // 兼容旧的格式
          totalUsers.value = data.data.totalCount;
          totalPages.value = data.data.totalPages || 1;
        } else {
          // 无分页信息
          totalUsers.value = 0;
          totalPages.value = 1;
        }
      } else {
        console.log('用户数据总数:', data.data.length);
        totalUsers.value = data.data.length;
        totalPages.value = 1;
      }
      console.log('浏览器类型:', navigator.userAgent.indexOf('Edg') > -1 ? 'Edge' : 'Chrome/其他');
      
      // 获取当前用户ID值 - 从 userInfo 对象中提取
      let currentUserId = null;
      try {
        // 先尝试直接获取 userId
        currentUserId = localStorage.getItem('userId');
        
        // 如果不存在，尝试从 userInfo 对象中获取
        if (!currentUserId) {
          const userInfoStr = localStorage.getItem('userInfo');
          if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr);
            if (userInfo && userInfo.userId) {
              currentUserId = userInfo.userId.toString();
              console.log('从 userInfo 中提取到 userId:', currentUserId);
            }
          }
        }
      } catch (error) {
        console.error('提取用户ID时出错:', error);
      }
      
      console.log('最终的当前用户ID值:', currentUserId, '类型:', typeof currentUserId);
      
      // 处理数据列表
      let userList;
      
      // 兼容不同的API返回结构
      if (data.data.list) {
        // 非好友用户和搜索用户API都返回 list 字段
        userList = data.data.list;
        console.log('使用data.data.list数据结构');
      } else if (data.data.users) {
        userList = data.data.users;
        console.log('使用data.data.users数据结构');
      } else if (Array.isArray(data.data)) {
        // 兼容旧的getAllUsers返回数组的情况
        userList = data.data;
        console.log('使用data.data数组');
      } else {
        console.warn('用户列表数据结构异常！', data.data);
        userList = [];
      }
      
      // 输出完整的数据结构以便调试
      console.log('用户列表完整结构:', data);
      console.log('处理后的用户列表:', userList);
      
      // 使用非好友API时不需要再过滤当前用户，API已经帮我们过滤了
      let filteredList = userList;
      
      console.log('过滤后用户数据总数:', filteredList.length);
      console.groupEnd();
      
      // 重新映射字段以适应现有组件
      const mappedUsers = filteredList.map(user => ({
        id: user.userId || user.id, // 兼容不同API的返回格式
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        department: user.department,
        school: user.school,
        authStatus: user.authStatus
      }));
      
      // 检查好友关系
      await checkFriendRelationship(mappedUsers);
      
      users.value = mappedUsers;
    } else {
      ElMessage.error(data.message || '获取用户列表失败');
    }
  } catch (error) {
    console.error('获取用户列表失败', error);
    ElMessage.error('获取用户列表失败，请检查网络连接');
  } finally {
    loadingUsers.value = false;
  }
};

// 检查好友关系状态
const checkFriendRelationship = async (userList) => {
  if (!userList || userList.length === 0) return;
  
  try {
    // 逐一检查每个用户的好友关系
    for (const user of userList) {
      const data = await checkFriendStatus(user.id);
      if (data.code === 200) {
        // 根据返回结果设置好友状态
        user.friendStatus = data.data.status || 'none';
      } else {
        user.friendStatus = 'none';
      }
    }
  } catch (error) {
    console.error('检查好友关系失败', error);
    // 出错时默认设置为none
    userList.forEach(user => user.friendStatus = 'none');
  }
};

// 过滤用户列表
const filteredUsers = computed(() => {
  return users.value;
});

// 显示添加好友对话框
const showAddFriendDialog = (user) => {
  currentUser.value = user;
  requestMessage.value = '';
  addFriendDialogVisible.value = true;
  // 打开对话框时禁用背景滚动
  document.body.style.overflow = 'hidden';
};

// 取消添加好友
const cancelAddFriend = () => {
  addFriendDialogVisible.value = false;
  // 恢复背景滚动
  document.body.style.overflow = '';
  // 重置数据
  requestMessage.value = '';
  setTimeout(() => {
    currentUser.value = null;
  }, 200);
};

// 发送好友请求
const sendFriendRequest = async () => {
  if (!currentUser.value) return;
  
  try {
    // 发送请求
    const data = await apiSendFriendRequest(currentUser.value.id, requestMessage.value);
    if (data.code === 200) {
      const requestId = data.data; // 新创建的请求ID
      
      ElMessage.success('好友请求已发送');
      addFriendDialogVisible.value = false;
      
      // 更新用户状态为已发送请求
      const userIndex = users.value.findIndex(u => u.id === currentUser.value.id);
      if (userIndex !== -1) {
        users.value[userIndex].friendStatus = 'pending';
      }
      
      // 将该请求添加到发送的请求列表中
      // 确保我们保存接收方的头像和昵称
      const newRequest = {
        requestId: requestId,
        requesterId: JSON.parse(localStorage.getItem('userInfo')).userId, // 当前用户ID
        recipientId: currentUser.value.id, // 接收方ID
        recipientName: currentUser.value.nickname || `用户${currentUser.value.id}`, // 接收方昵称
        recipientAvatarUrl: currentUser.value.avatarUrl || '/default-avatar.png', // 接收方头像
        message: requestMessage.value,
        status: 0, // 状态：等待处理
        createdAt: new Date().toISOString()
      };
      
      // 将新请求添加到列表中
      sentRequests.value.unshift(newRequest);
      
      // 刷新发送的请求列表(如果当前标签页是发送的请求)
      if (activeTab.value === 'sentRequests') {
        // 数据已经更新，不需要重新获取
        loadingSent.value = false;
      }
    } else {
      ElMessage.error(data.message || '发送好友请求失败');
    }
  } catch (error) {
    console.error('发送好友请求失败', error);
    ElMessage.error('发送好友请求失败，请检查网络连接');
  }
};

// 查看用户资料
const viewUserProfile = (userId) => {
  router.push(`/user/${userId}`);
};

// 搜索处理 - 使用debounce防抖，300ms延迟
const handleSearch = debounce(async () => {
  // 搜索时重置页码和错误状态
  currentPage.value = 1;
  searchError.value = '';
  await fetchUsers();
}, 300);

// 分页处理
const handlePageChange = async (page) => {
  currentPage.value = page;
  await fetchUsers();
};

// 标签页切换
const handleTabClick = () => {
  switch (activeTab.value) {
    case 'friendsList':
      fetchFriends();
      break;
    case 'receivedRequests':
      fetchReceivedRequests();
      break;
    case 'sentRequests':
      fetchSentRequests();
      break;
    case 'allUsers':
      fetchUsers();
      break;
  }
};

// 设置定时刷新待处理请求数量
const setupPendingRequestsTimer = () => {
  // 每60秒刷新一次待处理请求数量
  countTimer = setInterval(() => {
    fetchPendingRequestCount();
  }, 60000);
};

onMounted(() => {
  // 根据初始标签页加载数据
  if (activeTab.value === 'friendsList') {
    fetchFriends();
  }
  
  // 获取待处理的好友请求数量
  fetchPendingRequestCount();
  
  // 设置定时刷新
  setupPendingRequestsTimer();
});

onBeforeUnmount(() => {
  // 清除定时器
  if (countTimer) {
    clearInterval(countTimer);
    countTimer = null;
  }
});
</script>

<style scoped>
.friends-page {
  width: 96%;
  margin: 0 auto;
  padding-top: 40px; /* 为顶栏留出空间 */
  min-height: calc(100vh - 60px);
  position: relative;
  background-color: #f9fafc;
}

.friends-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  margin: 0;
  padding: 0;
}

.override-container {
  margin-left: -6px;
  width: calc(100% + 6px);
  padding-right: 0;
  display: flex;
  justify-content: center;
}

.main-card {
  border-radius: 10px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
  background-color: #ffffff;
  overflow: hidden;
  padding: 0;
  border: none;
  transition: all 0.3s ease;
  margin-bottom: 15px;
  max-width: 1300px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.main-card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.main-card :deep(.el-card__body) {
  padding: 12px 20px 15px;
  background-color: #ffffff;
}

.card-header {
  padding: 0 0 16px 0;
  margin-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  padding: 0;
  letter-spacing: 0.5px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 320px;
  background: linear-gradient(to bottom, #fafbfc, #f5f7fa);
  border-radius: 12px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.02);
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinner-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4px solid rgba(22, 119, 255, 0.15);
  border-top-color: #409EFF;
  animation: spin 1.2s infinite cubic-bezier(0.55, 0.15, 0.45, 0.85);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 24px;
  color: #606266;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.5px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* 改进的瀑布流布局 */
.masonry-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-gap: 24px;
  margin-top: 20px;
  padding: 10px;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 在较大屏幕上使用3列 */
@media (min-width: 768px) {
  .masonry-container {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

/* 在更大的屏幕上使用4列 */
@media (min-width: 1200px) {
  .masonry-container {
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  }
}

/* 美化卡片组件样式 */
:deep(.friend-card),
:deep(.user-card),
:deep(.request-card) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
  border: none;
}

:deep(.friend-card:hover),
:deep(.user-card:hover),
:deep(.request-card:hover) {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

:deep(.card-content) {
  padding: 18px 20px;
}

/* 美化卡片内按钮 */
:deep(.card-actions) {
  padding: 10px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #f5f5f5;
}

:deep(.card-actions .el-button) {
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.2s;
}

:deep(.card-actions .el-button--primary) {
  background-color: #409EFF;
  border-color: #409EFF;
}

:deep(.card-actions .el-button--primary:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
  transform: translateY(-2px);
}

:deep(.card-actions .el-button--danger) {
  background-color: #fff;
  color: #f56c6c;
  border-color: #fbc4c4;
}

:deep(.card-actions .el-button--danger:hover) {
  background-color: #f56c6c;
  color: #fff;
  border-color: #f56c6c;
  transform: translateY(-2px);
}

.search-container {
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
  width: 100%;
}

.search-box {
  max-width: 600px;
  margin: 0 auto;
  transition: all 0.3s;
}

.search-box:focus-within {
  transform: translateY(-2px);
}

.search-box :deep(.el-input__wrapper) {
  border-radius: 24px;
  padding-left: 16px;
  height: 48px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8e8e8;
  transition: all 0.3s;
}

.search-box :deep(.el-input__wrapper:hover),
.search-box :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  border-color: #409EFF;
}

.search-box :deep(.el-input__inner) {
  font-size: 16px;
  height: 46px;
  font-weight: 400;
  color: #333;
  caret-color: #409EFF;
}

.search-box :deep(.el-input__inner::placeholder) {
  color: #909399;
  font-weight: 400;
}

.search-box :deep(.el-input__prefix) {
  color: #409EFF;
  font-size: 18px;
  margin-right: 8px;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 40px 0;
  margin: 20px 0;
  background-color: #f9fafc;
  border-radius: 12px;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.02);
}

.empty-state :deep(.el-empty__image) {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
}

.empty-state :deep(.el-empty__description) {
  color: #606266;
  font-size: 16px;
  margin-bottom: 10px;
}

.empty-state .el-button {
  margin-top: 24px;
  padding: 12px 32px;
  border-radius: 24px;
  font-weight: 500;
  font-size: 15px;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  transition: all 0.3s;
}

.empty-state .el-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.3);
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  position: fixed !important;
  margin-top: 15vh !important;
}

:deep(.el-dialog__header) {
  padding: 20px 24px;
  margin: 0;
  border-bottom: 1px solid #f0f2f5;
  background-color: #fafbfc;
}

:deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

:deep(.el-dialog__headerbtn) {
  top: 20px;
  right: 20px;
}

:deep(.el-dialog__body) {
  padding: 24px;
  color: #606266;
}

/* 添加好友对话框特定样式 */
.friend-dialog {
  z-index: 9999 !important;
}

.friend-dialog :deep(.el-dialog__wrapper) {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.friend-dialog :deep(.el-overlay) {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9000;
}

.friend-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.friend-dialog :deep(.el-dialog__header) {
  background: linear-gradient(90deg, #3b91ff, #6cc5ff);
  padding: 18px 20px;
  margin: 0;
  text-align: center;
  position: relative;
}

.friend-dialog :deep(.el-dialog__title) {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.friend-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: rgba(255, 255, 255, 0.9);
  font-size: 20px;
}

.friend-dialog :deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: #fff;
}

.friend-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.add-friend-content {
  padding: 5px 0 15px;
}

.friend-request-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f2f5;
}

.friend-avatar {
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(59, 145, 255, 0.2);
}

.friend-info {
  flex: 1;
}

.friend-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px;
}

.friend-meta {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.message-section {
  margin-top: 10px;
}

.message-label {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 10px;
}

.optional-tag {
  font-size: 13px;
  color: #909399;
  font-weight: normal;
  margin-left: 4px;
}

.message-input {
  margin-top: 5px;
}

.message-input :deep(.el-textarea__inner) {
  border-radius: 12px;
  padding: 12px 16px;
  border-color: #e4e7ed;
  font-size: 15px;
  resize: none;
  transition: all 0.3s;
}

.message-input :deep(.el-textarea__inner:focus) {
  border-color: #3b91ff;
  box-shadow: 0 0 0 2px rgba(59, 145, 255, 0.2);
}

.message-input :deep(.el-input__count) {
  background: transparent;
  font-size: 12px;
  color: #909399;
  padding: 2px 6px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 15px;
}

.dialog-footer .cancel-btn {
  border-radius: 24px;
  padding: 10px 20px;
  transition: all 0.3s;
}

.dialog-footer .send-btn {
  border-radius: 24px;
  padding: 10px 24px;
  background: linear-gradient(90deg, #3b91ff, #6cc5ff);
  border: none;
  font-weight: 500;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(59, 145, 255, 0.3);
  transition: all 0.3s;
}

.dialog-footer .send-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 145, 255, 0.4);
}

.dialog-footer .send-btn i {
  margin-right: 6px;
  font-size: 15px;
}

:deep(.el-dialog__body p) {
  margin-top: 0;
  margin-bottom: 16px;
}

:deep(.el-dialog__body .el-textarea) {
  margin-top: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f2f5;
}

.dialog-footer .el-button {
  margin-left: 16px;
  min-width: 90px;
  border-radius: 8px;
  font-weight: 500;
  padding: 10px 20px;
  transition: all 0.25s;
}

.dialog-footer .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dialog-footer .el-button--primary {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.dialog-footer .el-button--danger {
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.15);
}

/* 标签页样式优化 */
.friends-tabs {
  margin-top: 10px;
}

.friends-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
  border-bottom: none;
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 4px;
}

.friends-tabs :deep(.el-tabs__nav-wrap) {
  margin-bottom: 0;
}

.friends-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.friends-tabs :deep(.el-tabs__nav) {
  width: 100%;
  display: flex;
  background-color: transparent;
}

.friends-tabs :deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
  font-size: 15px;
  padding: 0;
  height: 40px;
  line-height: 40px;
  transition: all 0.25s ease;
  font-weight: 500;
  color: #606266;
  position: relative;
}

.friends-tabs :deep(.el-tabs__active-bar) {
  display: none;
}

.friends-tabs :deep(.el-tabs__item.is-active) {
  background-color: #ffffff;
  color: #409EFF;
  font-weight: 600;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.friends-tabs :deep(.el-tabs__item:not(.is-active):hover) {
  color: #409EFF;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
}

.friends-tabs :deep(.el-tabs__content) {
  padding: 10px 0;
}
</style>
