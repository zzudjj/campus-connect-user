<template>
  <div class="profile-page-root">
    <div class="profile-container">
      <!-- 个人信息卡 -->
      <el-card class="profile-card" shadow="hover" :body-style="{ padding: '40px 60px 30px 60px', width: '100%' }">
        <div class="profile-header">
          <el-avatar :src="user.avatarUrl" size="large" class="profile-avatar" />
          <div class="profile-info">
            <div class="nickname">{{ user.nickname }}</div>
            <div class="email">{{ user.email }}</div>
            <div class="meta">
              <span v-if="user.school">{{ user.school }}</span>
              <span v-if="user.department">{{ user.department }}</span>
              <el-tag v-if="user.verified" type="success" size="small">已认证</el-tag>
              <el-tag v-else type="info" size="small">未认证</el-tag>
            </div>
          </div>
          <el-button type="primary" size="small" @click="editProfile">编辑资料</el-button>
        </div>
        <div class="profile-stats">
          <div class="stat-item">
            <div class="stat-count">{{ user.postCount }}</div>
            <div class="stat-label">动态</div>
          </div>
          <div class="stat-item">
            <div class="stat-count">{{ user.followCount }}</div>
            <div class="stat-label">关注</div>
          </div>
          <div class="stat-item">
            <div class="stat-count">{{ user.fanCount }}</div>
            <div class="stat-label">粉丝</div>
          </div>
        </div>
      </el-card>
      <!-- tab切换区 -->
      <el-tabs v-model="activeTab" class="profile-tabs" :stretch="true">
        <el-tab-pane label="动态" name="posts">
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="3" animated />
            <el-skeleton :rows="3" animated style="margin-top: 16px" />
          </div>
          <div v-else-if="posts.length === 0" class="empty">
            <i class="fas fa-file-alt empty-icon"></i>
            <div>暂无动态内容</div>
            <el-button type="primary" size="small" class="create-post-btn" @click="goToCreatePost">发布新动态</el-button>
          </div>
          <div v-else class="post-list">
            <ProfilePostItem 
              v-for="post in posts" 
              :key="post.id" 
              :post="post" 
              @expand="expandPost"
            />
          </div>
        </el-tab-pane>
        <el-tab-pane label="收藏" name="favorites">
          <div class="empty">暂无收藏</div>
        </el-tab-pane>
        <el-tab-pane label="设置" name="settings">
          <div class="empty">设置功能开发中...</div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 查看完整动态的对话框 -->
    <el-dialog
      v-model="postDialogVisible"
      :title="'动态详情'"
      width="600px"
      :destroy-on-close="true"
      :show-close="true"
      :modal="true"
      :append-to-body="true"
      class="post-detail-dialog"
    >
      <PostItem 
        v-if="selectedPost" 
        :post="selectedPost" 
        :show-full-content="true" 
        @comment="openCommentModal(selectedPost)"
        @like="likePost"
      />
    </el-dialog>
    
    <!-- 评论模态框 -->
    <CommentModal
      v-model:visible="commentModalVisible"
      v-if="currentPost"
      :post-id="currentPost.id"
      :post-user-id="currentPost.userId"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import ProfilePostItem from '@/components/post/ProfilePostItem.vue';
import PostItem from '@/components/post/PostItem.vue';
import CommentModal from '@/components/modals/CommentModal.vue';
import { getUserProfile } from '@/api/user';
import { getCurrentUserPosts, getPostMedia } from '@/api/post';
import { getLikeStatus, toggleLike } from '@/api/like';

const router = useRouter();
const loading = ref(true);

// 评论相关状态
const commentModalVisible = ref(false);
const currentPost = ref(null);
const postDialogVisible = ref(false);
const selectedPost = ref(null);

const user = ref({
  avatarUrl: '',
  nickname: '',
  email: '',
  school: '',
  department: '',
  verified: false,
  postCount: 0,
  followCount: 0,
  fanCount: 0
});
const posts = ref([]);
const activeTab = ref('posts');

const fetchProfile = async () => {
  try {
    const res = await getUserProfile(localStorage.getItem('token'));
    user.value = res.data;
    await fetchUserPosts(); // 获取用户动态
  } catch (e) {
    console.error('获取个人资料失败:', e);
    ElMessage.error('获取个人资料失败');
  } finally {
    loading.value = false;
  }
};

// 获取用户动态列表
const fetchUserPosts = async () => {
  try {
    loading.value = true;
    const res = await getCurrentUserPosts();
    if (res.code === 200 && res.data) {
      // 处理动态数据，获取媒体和点赞状态
      const postsData = await Promise.all(res.data.map(async (post) => {
        // 获取媒体文件
        let media = [];
        try {
          const mediaRes = await getPostMedia(post.id);
          console.log(`动态 ${post.id} 的媒体数据:`, mediaRes.data);
          if (mediaRes.code === 200 && mediaRes.data) {
            media = mediaRes.data.map(item => ({
              url: item.mediaUrl,
              type: item.mediaType,
              thumbnailUrl: item.mediaType === 1 ? item.backgroundUrl : null,
              backgroundUrl: item.mediaType === 1 ? item.backgroundUrl : null,
              sortOrder: item.sortOrder
            }));
            // 按sortOrder排序
            media.sort((a, b) => a.sortOrder - b.sortOrder);
          }
        } catch (e) {
          console.error(`获取动态 ${post.id} 媒体失败:`, e);
        }
        
        // 获取点赞状态
        let isLiked = false;
        try {
          const likeRes = await getLikeStatus(post.id, 0); // 0表示动态
          if (likeRes.code === 200) {
            isLiked = likeRes.data.status === 1;
          }
        } catch (e) {
          console.error(`获取动态 ${post.id} 点赞状态失败:`, e);
        }
        
        return {
          ...post,
          media,
          isLiked
        };
      }));
      
      posts.value = postsData;
    } else {
      posts.value = [];
    }
  } catch (e) {
    console.error('获取用户动态失败:', e);
    ElMessage.error('获取用户动态失败');
    posts.value = [];
  } finally {
    loading.value = false;
  }
};

// 编辑用户资料
const editProfile = () => {
  ElMessage.info('资料编辑功能开发中...');
};

// 展开查看完整动态
const expandPost = (post) => {
  selectedPost.value = post;
  postDialogVisible.value = true;
};

// 前往发布动态页面
const goToCreatePost = () => {
  // 打开发布动态的模态窗口或导航到发布页面
  router.push({ name: 'feed' });
  // 延迟执行以确保页面已加载
  setTimeout(() => {
    // 通过触发自定义事件来打开发布模态窗口
    window.dispatchEvent(new CustomEvent('open-post-modal'));
  }, 300);
};

// 打开评论模态框
const openCommentModal = (post) => {
  currentPost.value = post;
  commentModalVisible.value = true;
};

// 点赞动态
const likePost = async (postId) => {
  try {
    const post = posts.value.find(p => p.id === postId) || selectedPost.value;
    if (!post) return;
    
    // 调用API切换点赞状态
    const res = await toggleLike(postId, 0); // 0表示动态
    if (res.code === 200) {
      // 更新当前点赞状态
      post.isLiked = !post.isLiked;
      post.likeCount = post.isLiked ? (post.likeCount || 0) + 1 : Math.max(0, (post.likeCount || 0) - 1);
    }
  } catch (e) {
    console.error('点赞操作失败:', e);
    ElMessage.error('点赞失败，请重试');
  }
};

// 添加窗口大小变化监听，以更新isMobile状态
onMounted(() => {
  fetchProfile();
});

// 监听标签页切换
watch(activeTab, (newTab) => {
  if (newTab === 'posts' && posts.value.length === 0) {
    fetchUserPosts();
  }
});
</script>

<style scoped>
/* 禁用MainPage中的浮动按钮组 */
:deep(.fab-group) {
  display: none !important;
}

.profile-page-root {
  min-height: 100vh;
  background: #f7f8fa;
  width: 100%;
  overflow-x: hidden;
}
.profile-container {
  max-width: 800px;
  width: 100%;
  margin: 32px auto;
  padding: 0 15px;
  box-sizing: border-box;
  position: relative;
  z-index: 20;
}
.profile-card {
  border-radius: 24px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  margin-bottom: 40px;
  width: 100%;
}
.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  width: 100%;
  margin-bottom: 20px;
}
.profile-avatar {
  width: 90px;
  height: 90px;
}
.profile-info {
  flex: 1;
}
.nickname {
  font-size: 26px;
  font-weight: 600;
  color: #222;
}
.email {
  font-size: 17px;
  color: #888;
  margin: 6px 0 10px 0;
}
.meta {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 16px;
  color: #888;
}
.profile-stats {
  display: flex;
  gap: 120px;
  justify-content: center;
  margin-top: 20px;
  border-top: 1px solid #f0f0f0;
  padding-top: 20px;
}
.stat-item {
  text-align: center;
}
.stat-count {
  font-size: 28px;
  font-weight: 600;
  color: #1677ff;
}
.stat-label {
  font-size: 16px;
  color: #888;
  margin-top: 4px;
}
.profile-tabs {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  padding: 16px 0 0 0;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

:deep(.el-tabs__header) {
  margin-bottom: 16px;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0 24px;
}

:deep(.el-tabs__item) {
  font-size: 18px;
  height: 48px;
  line-height: 48px;
  font-weight: 500;
}

:deep(.el-tabs__nav) {
  width: 100%;
}

:deep(.el-tabs__content) {
  padding: 0;
  overflow: visible;
}
.post-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 16px;
  padding: 0 24px 24px;
}
.empty {
  text-align: center;
  color: #bbb;
  font-size: 18px;
  padding: 60px 0;
}
</style> 