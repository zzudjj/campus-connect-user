<template>
  <div class="feed-page-container">
    <!-- 模式切换器 -->
    <div class="feed-mode-switcher">
      <div class="tabs-container">
        <div 
          class="mode-tab" 
          :class="{ active: mode === 'hot' }" 
          @click="switchMode('hot')"
        >
          热门
        </div>
        <div 
          class="mode-tab" 
          :class="{ active: mode === 'new' }" 
          @click="switchMode('new')"
        >
          最新
        </div>
        <div 
          class="mode-tab" 
          :class="{ active: mode === 'friend' }" 
          @click="switchMode('friend')"
        >
          好友
        </div>
        <div class="active-tab-indicator" :class="mode"></div>
      </div>
    </div>
    
    <!-- 初始加载动画 -->
    <div v-if="initialLoading" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner-circle"></div>
      </div>
      <div class="loading-text">加载中...</div>
    </div>
    
    <!-- 内容展示 -->
    <div v-else class="feed-content">
      <!-- 无数据提示 -->
      <div v-if="posts.length === 0" class="empty-state">
        <el-empty description="暂无动态" :image-size="200">
          <el-button type="primary" @click="refreshPosts">刷新试试</el-button>
        </el-empty>
      </div>
      
      <!-- 动态列表 -->
      <transition-group name="fade-in" tag="div" class="posts-container">
        <PostItem
          v-for="item in posts"
          :key="item.id || item.postId"
          :post="item"
          @follow="followUser"
          @like="likePost"
          @comment="handleComment"
        />
      </transition-group>
      
      <!-- 底部加载更多 -->
      <div class="load-more" ref="loadMoreTrigger">
        <div v-if="loadingMore" class="loading-more">
          <div class="loading-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
          <span>加载更多...</span>
        </div>
        
        <div v-if="!loadingMore && hasMore && !initialLoading" class="load-more-hint">
          <span>上滑加载更多</span>
        </div>
      </div>
      
      <!-- 到底了提示 -->
      <div v-if="!hasMore && posts.length > 0" class="no-more">
        <div class="divider"></div>
        <span>没有更多了</span>
        <div class="divider"></div>
      </div>
    </div>
    
    <!-- 评论模态框已移至MainPage.vue -->
    <PostModal
      v-if="showPostModal"
      @close="showPostModal = false"
      @success="postSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, defineEmits, inject, nextTick, computed } from 'vue';
import { getHotPosts, getNewPosts, getPostsByIds, getFriendPosts } from '../api/post';
import { toggleLike, getLikeStatus } from '@/api/like';
import PostItem from '../components/post/PostItem.vue';
import PostModal from '../components/modals/PostModal.vue';
import { ElMessage } from 'element-plus';

// 定义可发出的事件
const emit = defineEmits(['loading-changed']);

// 注入父组件提供的显示评论函数
const showComment = inject('showComment');

// 基本状态
const posts = ref([]); // 动态列表
const showPostModal = ref(false); // 发布动态模态框

// 加载状态
const initialLoading = ref(true); // 初始加载状态
const loadingMore = ref(false); // 加载更多状态
const hasMore = ref(true); // 是否还有更多数据

// 分页参数
const pageSize = 15; // 每页数量，与API文档默认值保持一致
const currentStart = ref(0); // 当前起始位置

// 模式切换
const mode = ref('hot'); // 默认为热门模式
const loadMoreTrigger = ref(null); // 加载更多的触发元素引用
const isTabSwitching = ref(false); // 记录是否正在切换标签

// 处理评论按钮点击，调用父组件的showComment方法
const handleComment = (post) => {
  showComment(post);
};

// 监听初始加载状态变化并发出事件
watch(initialLoading, (newValue) => {
  emit('loading-changed', newValue);
});

// 切换热门/最新模式
const switchMode = async (newMode) => {
  if (mode.value === newMode) return;
  
  // 先标记模式切换中，让CSS动画生效
  isTabSwitching.value = true;
  const previousMode = mode.value;
  mode.value = newMode; // 立即切换模式，触发CSS动画
  
  // 延迟加载数据，等动画完成
  setTimeout(async () => {
    try {
      // 显示加载状态，但不是全屏加载
      loadingMore.value = true;
      
      // 重置分页参数
      currentStart.value = 0;
      hasMore.value = true;
      
      // 先清空内容，再加载新数据
      posts.value = [];
      await loadPosts();
    } catch (error) {
      console.error('切换模式失败:', error);
      mode.value = previousMode; // 恢复原模式
      ElMessage.error('切换模式失败，请重试');
    } finally {
      loadingMore.value = false;
      isTabSwitching.value = false;
    }
  }, 250); // 等待250毫秒，让动画有足够时间完成
};

// 刷新帖子列表
const refreshPosts = async () => {
  currentStart.value = 0;
  hasMore.value = true;
  initialLoading.value = true;
  posts.value = [];
  await loadPosts();
};

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

// 加载动态列表
const loadPosts = async () => {
  if (!hasMore.value || loadingMore.value) return;
  
  console.group('加载动态');
  console.log(`当前模式: ${mode.value}, 页码: ${currentStart.value}`);
  
  loadingMore.value = true;
  
  try {
    // 根据不同模式，调用不同的API获取动态ID列表
    let postsResult;
    let postIds = [];
    let postsList = [];
    
    // 如果是热门模式，获取热门动态列表
    if (mode.value === 'hot') {
      console.log('获取热门动态列表...');
      postsResult = await getHotPosts(currentStart.value, pageSize);
      
      if (postsResult.code === 200) {
        console.log('热门动态获取成功:', postsResult);
        // 处理可能的不同响应格式
        if (Array.isArray(postsResult.data)) {
          postIds = postsResult.data.map(post => post.postId || post);
        } else if (postsResult.data && Array.isArray(postsResult.data.list)) {
          postIds = postsResult.data.list.map(post => post.postId || post);
        } else {
          console.warn('热门动态响应格式异常:', postsResult.data);
          postIds = [];
        }
      } else {
        throw new Error(postsResult.message || '获取热门动态失败');
      }
    } 
    // 如果是最新模式，获取最新动态列表
    else if (mode.value === 'new') {
      console.log('获取最新动态列表...');
      postsResult = await getNewPosts(currentStart.value * pageSize, pageSize);
      
      if (postsResult.code === 200) {
        console.log('最新动态获取成功:', postsResult.data);
        // 处理可能的不同响应格式
        if (Array.isArray(postsResult.data)) {
          postIds = postsResult.data.map(item => typeof item === 'object' ? (item.postId || item) : item);
        } else if (postsResult.data && Array.isArray(postsResult.data.list)) {
          postIds = postsResult.data.list.map(item => typeof item === 'object' ? (item.postId || item) : item);
        } else {
          console.warn('最新动态响应格式异常:', postsResult.data);
          postIds = [];
        }
      } else {
        throw new Error(postsResult.message || '获取最新动态失败');
      }
    }
    // 如果是好友模式，获取好友动态列表
    else if (mode.value === 'friend') {
      console.log('获取好友动态列表...');
      const params = {
        page: currentStart.value + 1, // API从1开始计数
        size: pageSize
      };
      
      postsResult = await getFriendPosts(params);
      
      if (postsResult.code === 200 && postsResult.data && postsResult.data.list) {
        console.log('好友动态获取成功:', postsResult.data);
        
        // 抽取好友动态ID列表，然后使用与热门和最新模式相同的逻辑获取完整详情
        console.log('处理好友动态数据...');
        const friendPostIds = postsResult.data.list.map(post => post.postId);
        
        // 好友动态API可能返回空列表
        if (postsResult.data.list.length < pageSize || currentStart.value + 1 >= postsResult.data.pages) {
          console.log('没有更多好友动态');
          hasMore.value = false;
        }
        
        // 如果没有好友动态，直接返回
        if (friendPostIds.length === 0) {
          loadingMore.value = false;
          console.groupEnd();
          return;
        }
        
        // 获取动态详情，包括媒体文件和用户信息
        const postDetailsResponse = await getPostsByIds(friendPostIds);
        
        if (postDetailsResponse.code === 200 && postDetailsResponse.data) {
          console.log('批量获取好友动态详情成功:', postDetailsResponse.data.length, '条记录');
          
          // 处理返回的好友动态详情
          const newPosts = postDetailsResponse.data;
          
          // 处理每个动态的数据
          for (let i = 0; i < newPosts.length; i++) {
            const post = newPosts[i];
            // 确保字段名称一致
            post.id = post.id || post.postId;
            post.likeCount = post.likeNum || post.likeCount || 0;
            post.commentCount = post.commentNum || post.commentCount || 0;
            
            // 确保媒体字段存在
            if (!post.media) {
              post.media = [];
            }
          }
          
          // 获取每个动态的点赞状态
          const likeStatusPromises = newPosts.map(async (post) => {
            const postId = post.id || post.postId;
            try {
              const likeStatus = await fetchPostLikeStatus(postId);
              post.isLiked = likeStatus.isLiked;
              post.likeCount = likeStatus.likeCount || post.likeCount;
            } catch (error) {
              console.error(`获取好友动态 ${postId} 的点赞状态失败:`, error);
            }
          });
          
          // 等待所有点赞状态获取完成
          await Promise.all(likeStatusPromises);
          
          // 更新好友动态列表
          posts.value = [...posts.value, ...newPosts];
          currentStart.value++;
          loadingMore.value = false;
          console.groupEnd();
          return;
        }
      } else {
        if (postsResult.code === 401) {
          ElMessage.warning('请先登录后查看好友动态');
        } else if (postsResult.data && postsResult.data.list && postsResult.data.list.length === 0) {
          ElMessage.info('暂无好友动态，快去添加好友吧');
        } else {
          throw new Error(postsResult.message || '获取好友动态失败');
        }
        hasMore.value = false;
        loadingMore.value = false;
        console.groupEnd();
        return;
      }
    }
    
    // 如果没有更多动态，设置hasMore为false
    if (!postIds || postIds.length === 0) {
      console.log('没有更多动态');
      hasMore.value = false;
      loadingMore.value = false;
      console.groupEnd();
      return;
    }
    
    // 获取到动态ID列表，然后批量获取动态详情
    const postDetailsResponse = await getPostsByIds(postIds);
    
    if (postDetailsResponse.code === 200 && postDetailsResponse.data) {
      console.log('批量获取动态详情成功:', postDetailsResponse.data.length, '条记录');
      
      // 处理返回的动态详情
      const newPosts = postDetailsResponse.data;
      
      // 处理每个动态的数据
      for (let i = 0; i < newPosts.length; i++) {
        const post = newPosts[i];
        // 确保字段名称一致
        post.id = post.id || post.postId;
        post.likeCount = post.likeNum || post.likeCount || 0;
        post.commentCount = post.commentNum || post.commentCount || 0;
        
        // 确保媒体字段存在
        if (!post.media) {
          post.media = [];
        }
      }
      
      // 获取每个动态的点赞状态
      const likeStatusPromises = newPosts.map(async (post, index) => {
        const postId = post.id || post.postId;
        const likeStatus = await fetchPostLikeStatus(postId);
        newPosts[index].isLiked = likeStatus.isLiked;
        newPosts[index].likeCount = likeStatus.likeCount;
        
        // 打印调试信息
        console.log(`动态 ${postId} 的媒体:`, newPosts[index].media);
      });
      
      // 等待所有点赞状态获取完成
      await Promise.all(likeStatusPromises);
      
      // 如果是加载更多，则追加到现有列表；否则替换整个列表
      if (currentStart.value > 0) {
        posts.value = [...posts.value, ...newPosts];
      } else {
        posts.value = newPosts;
      }
      
      // 更新数据加载开始位置
      currentStart.value += newPosts.length;
      
      // 判断是否还有更多数据
      hasMore.value = newPosts.length === pageSize;
    } else {
      if (currentStart.value === 0) {
        posts.value = [];
      }
      hasMore.value = false;
      console.error('批量获取动态详情失败:', postDetailsResponse);
    }
  } catch (error) {
    console.error(`获取${mode.value === 'hot' ? '热门' : mode.value === 'new' ? '最新' : '好友'}动态失败:`, error);
    if (currentStart.value === 0) {
      posts.value = [];
    }
    ElMessage.error(`获取动态失败: ${error.message || '未知错误'}`);
  } finally {
    initialLoading.value = false;
    loadingMore.value = false;
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

// 成功发布动态后的回调
const postSuccess = () => {
  showPostModal.value = false;
  refreshPosts();
};

// 回到顶部功能
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

// 刷新帖子列表的事件处理函数
const handleRefreshFeedList = () => {
  console.log('收到刷新动态列表的事件，正在刷新...');
  refreshPosts();
};

// 初始化无限滚动交叉观察器
const setupInfiniteScroll = () => {
  // 如果浏览器支持交叉观察器API
  if ('IntersectionObserver' in window) {
    // 创建交叉观察器
    const observer = new IntersectionObserver(
      async (entries) => {
        // 当观察到目标元素进入视口
        if (entries[0].isIntersecting && hasMore.value && !loadingMore.value && !initialLoading.value) {
          console.log('观察到加载更多触发元素进入视口，开始加载更多数据');
          await loadPosts();
        }
      },
      {
        rootMargin: '0px 0px 200px 0px', // 提前200px触发加载
        threshold: 0.1 // 只需观察到目标元素的10%就触发
      }
    );

    // 监听触发元素的引用变化，当元素存在时添加观察
    watch(
      loadMoreTrigger,
      (newTrigger) => {
        if (newTrigger) {
          observer.observe(newTrigger);
        }
      },
      { immediate: true }
    );

    // 组件卸载时清理观察器
    onBeforeUnmount(() => {
      if (loadMoreTrigger.value) {
        observer.unobserve(loadMoreTrigger.value);
      }
      observer.disconnect();
    });
  } else {
    // 如果浏览器不支持交叉观察器，使用滚动事件作为备选
    const handleScroll = () => {
      if (loadMoreTrigger.value && !loadingMore.value && !initialLoading.value && hasMore.value) {
        const rect = loadMoreTrigger.value.getBoundingClientRect();
        if (rect.top < window.innerHeight + 200) {
          loadPosts();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    onBeforeUnmount(() => {
      window.removeEventListener('scroll', handleScroll);
    });
  }
};

onMounted(() => {
  // 初始加载数据
  loadPosts();
  
  // 设置无限滚动
  nextTick(() => {
    setupInfiniteScroll();
  });
  
  // 添加自定义事件监听器
  document.addEventListener('refresh-feed-list', handleRefreshFeedList);
});

onBeforeUnmount(() => {
  // 移除事件监听器以防止内存泄漏
  document.removeEventListener('refresh-feed-list', handleRefreshFeedList);
});
</script>

<style scoped>
.feed-page-container {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  min-height: 400px;
  padding: 0 16px;
}

/* 模式切换器样式 */
.feed-mode-switcher {
  display: flex;
  justify-content: center;
  margin: 0 0 16px;
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: #f5f5f7;
  padding: 8px 0;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  width: 300px;
  margin-left: auto;
  margin-right: auto;
  margin-top: -5px;
  transform: translateY(-5px);
}

.tabs-container {
  position: relative;
  display: flex;
  width: 100%;
}

/* 添加滑动指示器 - 使用CSS类名来控制位置 */
.active-tab-indicator {
  position: absolute;
  height: 36px;
  width: 50%;
  background-color: #fff;
  border-radius: 50px;
  top: 0;
  z-index: 1;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

/* 标签指示器位置 - 三个标签 */
.active-tab-indicator {
  width: 33.33%;
}

/* 热门标签指示器位置 */
.active-tab-indicator.hot {
  transform: translateX(0);
}

/* 最新标签指示器位置 */
.active-tab-indicator.new {
  transform: translateX(100%);
}

/* 好友标签指示器位置 */
.active-tab-indicator.friend {
  transform: translateX(200%);
}

.mode-tab {
  padding: 8px 24px;
  flex: 1;
  text-align: center;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.3s ease;
  position: relative;
  font-size: 15px;
  color: #606266;
  z-index: 2;
  background-color: transparent;
}

.mode-tab.active {
  color: #333;
  font-weight: 600;
}

/* 内容区域样式 */
.feed-content {
  min-height: calc(100vh - 180px);
  padding-bottom: 80px;
}

.posts-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

/* 无数据状态 */
.empty-state {
  padding: 60px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 底部加载更多 */
.load-more {
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  margin-bottom: 20px;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #909399;
  font-size: 14px;
}

.load-more-hint {
  color: #909399;
  font-size: 14px;
  padding: 10px 16px;
  border-radius: 20px;
  background-color: #f5f5f7;
  transition: all 0.3s ease;
}

.load-more-hint:hover {
  background-color: #eaeaea;
  color: #666;
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #909399;
  animation: dotPulse 1.5s infinite ease-in-out;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotPulse {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

/* 到底了提示 */
.no-more {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
  margin: 30px 0;
  gap: 12px;
}

.divider {
  height: 1px;
  background-color: #eaeaea;
  flex: 1;
  max-width: 100px;
}

/* 加载动画样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  width: 100%;
}

.loading-spinner {
  position: relative;
  width: 50px;
  height: 50px;
  margin-bottom: 16px;
}

.spinner-circle {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4px solid rgba(22, 119, 255, 0.15);
  border-top-color: #1677ff;
  border-left-color: #4096ff;
  animation: spinner-rotate 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  box-shadow: 0 0 8px rgba(22, 119, 255, 0.2);
}

.loading-text {
  color: #1677ff;
  font-size: 15px;
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
  transition: all 0.5s cubic-bezier(0.17, 0.67, 0.83, 0.67);
}

.fade-in-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* 右下角浮动按钮 */
.floating-buttons {
  position: fixed;
  bottom: 30px;
  right: 30px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 99;
}

.floating-button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.floating-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.floating-button.refresh i::before {
  content: '\21bb';
  font-size: 20px;
  font-weight: bold;
}

.floating-button.top i::before {
  content: '\2191';
  font-size: 20px;
  font-weight: bold;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .feed-mode-switcher {
    margin: 8px 0 16px;
  }
  
  .mode-tab {
    padding: 6px 20px;
    font-size: 14px;
  }
  
  .feed-page-container {
    padding: 0 8px;
  }
  
  .floating-buttons {
    bottom: 20px;
    right: 20px;
    gap: 10px;
  }
  
  .floating-button {
    width: 40px;
    height: 40px;
  }
}
</style>