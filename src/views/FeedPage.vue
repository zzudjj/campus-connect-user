<template>
  <div class="feed-masonry-container">
    <!-- 加载动画 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner-circle"></div>
      </div>
      <div class="loading-text">加载中...</div>
    </div>
    
    <!-- 内容展示 -->
    <transition name="fade-in">
      <MasonryWall v-if="!loading" :items="posts" :column-width="800" :gap="24">
        <template #default="{ item }">
          <PostItem
            :post="item"
            @follow="followUser"
            @like="likePost"
            @comment="handleComment"
          />
        </template>
      </MasonryWall>
    </transition>
    <div class="bottom-safe-space"></div>
    
    <!-- 评论模态框已移至MainPage.vue -->
    <PostModal
      v-if="showPostModal"
      @close="showPostModal = false"
      @success="postSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, defineEmits, inject } from 'vue';
import { getPostList } from '../api/post';
import { toggleLike, getLikeStatus } from '@/api/like';
import PostItem from '../components/post/PostItem.vue';
import PostModal from '../components/modals/PostModal.vue';
import MasonryWall from '@yeger/vue-masonry-wall';
import { ElMessage } from 'element-plus';

// 定义可发出的事件

const emit = defineEmits(['loading-changed']);

const posts = ref([]); // 帖子列表
const showPostModal = ref(false);
const loading = ref(true); // 加载状态

// 注入父组件提供的显示评论函数
const showComment = inject('showComment');

// 处理评论按钮点击，调用父组件的showComment方法
const handleComment = (post) => {
  showComment(post);
};

// 监听加载状态变化并发出事件
watch(loading, (newValue) => {
  emit('loading-changed', newValue);
});

// 获取动态的点赞状态
const fetchPostLikeStatus = async (postId) => {
  try {
    // 动态类型点赞，targetType=0
    const response = await getLikeStatus(postId, 0);
    if (response.code === 200) {
      return {
        isLiked: response.data.liked,
        likeCount: response.data.likeCount
      };
    }
    return { isLiked: false, likeCount: 0 };
  } catch (error) {
    console.error(`获取动态 ${postId} 的点赞状态失败:`, error);
    return { isLiked: false, likeCount: 0 };
  }
};

const fetchPosts = async () => {
  loading.value = true; // 开始加载
  try {
    // 直接调用API，使用正确的参数名称: start 和 PostNum
    const res = await getPostList({ start: 0, PostNum: 20 });
    console.log('动态获取响应:', res); // 添加调试日志
    
    if (!res.data.list || res.data.list.length === 0) {
      // 如果没有获取到数据，显示空数组
      posts.value = [];
      console.log('获取到的动态列表为空');
    } else {
      // 初始化动态数组
      posts.value = res.data.list;
      console.log('成功获取动态列表:', posts.value.length, '条记录');
      
      // 获取每个动态的点赞状态
      const likeStatusPromises = posts.value.map(async (post, index) => {
        const likeStatus = await fetchPostLikeStatus(post.id);
        posts.value[index].isLiked = likeStatus.isLiked;
        posts.value[index].likeCount = likeStatus.likeCount;
      });
      
      // 等待所有点赞状态获取完成
      await Promise.all(likeStatusPromises);
      console.log('动态点赞状态获取完成');
    }
  } catch (error) {
    console.error('获取动态列表失败', error);
    posts.value = []; // 失败时显示空数组
    // 添加更详细的错误提示
    ElMessage.error(`获取动态失败: ${error.message || '未知错误'}`);
  } finally {
    loading.value = false; // 结束加载
  }
};

const followUser = (userId) => {
  const post = posts.value.find(p => p.userId === userId);
  if (post) {
    post.isFollowed = true;
  }
};

const likePost = async (postId) => {
  const post = posts.value.find(p => p.id === postId);
  if (post) {
    // 先更新UI状态，提高响应速度
    const originalLiked = post.isLiked;
    post.isLiked = !post.isLiked;
    post.likeCount += post.isLiked ? 1 : -1;
    
    try {
      // 调用点赞切换API，动态类型targetType=0
      const response = await toggleLike(postId, 0);
      
      if (response.code === 200) {
        // 使用服务器返回的正确数据更新UI
        post.isLiked = response.data.liked;
        post.likeCount = response.data.likeCount;
        console.log('动态点赞状态已更新:', response.data);
      } else {
        // 如果请求失败，恢复原始状态
        post.isLiked = originalLiked;
        post.likeCount = originalLiked ? (post.likeCount + 1) : (post.likeCount - 1);
        ElMessage.error('点赞操作失败: ' + response.message);
      }
    } catch (error) {
      console.error('点赞动态失败:', error);
      // 恢复原始状态
      post.isLiked = originalLiked;
      post.likeCount = originalLiked ? (post.likeCount + 1) : (post.likeCount - 1);
      ElMessage.error('点赞操作失败，请重试');
    }
  }
};

const postSuccess = () => {
  showPostModal.value = false;
  fetchPosts();
};



// 刷新帖子列表的事件处理函数
const handleRefreshFeedList = () => {
  console.log('收到刷新动态列表的事件，正在刷新...');
  fetchPosts();
};

onMounted(() => {
  fetchPosts();
  
  // 添加自定义事件监听器
  document.addEventListener('refresh-feed-list', handleRefreshFeedList);
});

onBeforeUnmount(() => {
  // 移除事件监听器以防止内存泄漏
  document.removeEventListener('refresh-feed-list', handleRefreshFeedList);
});


</script>

<style scoped>
.feed-masonry-container {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  min-height: 400px; /* 确保容器有最小高度 */
}
.bottom-safe-space {
  height: 80px;
}

/* 加载动画样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100vh;
  background-color: #f7f8fa;
  z-index: 1000;
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
  margin-bottom: 20px;
}

.spinner-circle {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 5px solid rgba(22, 119, 255, 0.15);
  border-top-color: #1677ff;
  border-left-color: #4096ff;
  animation: spinner-rotate 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  box-shadow: 0 0 10px rgba(22, 119, 255, 0.2);
}

.loading-text {
  color: #1677ff;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

@keyframes spinner-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 内容淡入动画 */
.fade-in-enter-active {
  transition: all 0.8s cubic-bezier(0.17, 0.67, 0.83, 0.67);
}

.fade-in-enter-from {
  opacity: 0;
  transform: translateY(40px);
}


</style>