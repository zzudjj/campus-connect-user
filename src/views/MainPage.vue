<!-- 校园社交平台 - 现代化主布局（仿小红书/抖音） -->
<template>
  <div class="layout-root">
    <SideBar />
    <div class="layout-main">
      <HeaderBar v-if="$route.name === 'Feed' || $route.name === 'Notification'" :center-search="$route.name === 'Feed'" />
      <div class="main-flex">
        <div class="main-content">
          <router-view v-slot="{ Component }">
            <component :is="Component" @loading-changed="isLoading = $event" />
          </router-view>
        </div>
        <HotList v-if="$route.name === 'Feed' && !isLoading" class="main-hotlist" />
      </div>
      <FloatButtonGroup 
        @create-post="showPostModal = true" 
        @refresh="handleRefresh" 
      />
      
      <!-- 发布动态弹窗 -->
      <PostModal
        v-if="showPostModal"
        @close="showPostModal = false"
        @success="handlePostSuccess"
      />
      
      <!-- 评论弹窗 - 放在布局根组件中确保完全覆盖所有元素 -->
      <CommentModal
        v-if="showCommentModal"
        :post="currentCommentPost"
        @close="showCommentModal = false"
        @update-comment-count="handleCommentCountUpdate"
      />
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { ref, provide, nextTick, onMounted, onBeforeUnmount } from 'vue';
import SideBar from '../components/layout/SideBar.vue';
import HeaderBar from '../components/layout/HeaderBar.vue';
import HotList from '../components/layout/HotList.vue';
import FloatButtonGroup from '../components/layout/FloatButtonGroup.vue';
import PostModal from '../components/modals/PostModal.vue';
import CommentModal from '../components/modals/CommentModal.vue';
import { syncService } from '../services/SyncService.js';

const route = useRoute();
const isLoading = ref(true); // 默认为加载状态
const showPostModal = ref(false); // 控制发布动态弹窗的显示
const showCommentModal = ref(false); // 控制评论弹窗的显示
const currentCommentPost = ref(null); // 当前评论的帖子

// 处理刷新事件
const handleRefresh = () => {
  // 通过自定义事件通知相关组件进行刷新
  document.dispatchEvent(new CustomEvent('refresh-feed-list'));
};

// 处理发布动态成功事件
const handlePostSuccess = () => {
  showPostModal.value = false;
  // 如果当前页面是动态页，则刷新数据
  if (route.name === 'Feed') {
    // 触发刷新动态列表事件
    handleRefresh();
    // 这里可以添加更多逻辑，比如更新缓存或其他UI状态
  }
}

// 处理显示评论模态框
const showComment = (post) => {
  currentCommentPost.value = post;
  showCommentModal.value = true;
}

// 处理评论数量更新
const handleCommentCountUpdate = (count) => {
  if (currentCommentPost.value) {
    // 直接更新当前帖子的评论数
    currentCommentPost.value.commentCount = count;
    
    const postId = currentCommentPost.value.postId || currentCommentPost.value.id;
    console.log(`MainPage: 评论数量更新为 ${count}, 帖子ID: ${postId}`);
    
    // 刷新列表中同一帖子的评论数
    if (route.name === 'Feed') {
      document.dispatchEvent(new CustomEvent('comment-updated', {
        detail: { postId, commentCount: count }
      }));
    }
  }
}

// 处理评论更新事件
const handleCommentUpdated = (event) => {
  console.log('MainPage: 收到评论更新事件:', event.detail);
  
  if (currentCommentPost.value) {
    const postId = currentCommentPost.value.postId || currentCommentPost.value.id;
    const eventPostId = event.detail.postId;
    
    // 如果是当前查看的帖子，更新评论数
    if (postId && postId.toString() === eventPostId.toString()) {
      currentCommentPost.value.commentCount = event.detail.commentCount;
    }
  }
}

// 添加事件监听器
onMounted(() => {
  // 添加评论更新事件监听器
  document.addEventListener('comment-updated', handleCommentUpdated);
});

onBeforeUnmount(() => {
  // 移除事件监听器
  document.removeEventListener('comment-updated', handleCommentUpdated);
});

// 提供给子组件的方法
provide('showComment', showComment);
</script>

<style scoped>
/* 全局样式重置，使用 :global 确保全局生效 */
:global(html), :global(body) {
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow: hidden !important;
  overscroll-behavior: none; /* 防止滚动传播 */
}

:global(body) {
  position: relative; /* 确保 body 作为定位参考 */
  background-color: #f7f8fa;
}

.layout-root {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: #f7f8fa;
  overflow: hidden;
  margin: 0;
  padding: 0;
  position: fixed; /* 使用fixed定位确保整个布局不受模态框影响 */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* 重置全局边距 */
body, html {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
  height: 100vh;
}
.main-flex {
  display: flex;
  flex-direction: row;
  flex: 1;
  min-width: 0;
  align-items: flex-start;
  height: 100%;
  justify-content: center;
  padding-left: 120px;
}
.main-content {
  flex: 1;
  min-width: 0;
  height: calc(100vh - 60px); /* 调整高度以留出顶部空间 */
  overflow-y: auto;
  display: block;
  padding: 24px 24px 80px 24px; /* 添加顶部内边距 */
  box-sizing: border-box;
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
  max-width: 900px;
  margin: 80px auto 0; /* 调整顶部margin */
  position: relative;
  z-index: 10;
}
/* 自定义webkit滚动条样式 */
.main-content::-webkit-scrollbar {
  width: 4px; /* 比原来更细 */
  height: 4px;
}
.main-content::-webkit-scrollbar-track {
  background: transparent;
  margin: 10px 0; /* 默认允许滚动区域的上下边距 */
}
.main-content::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  background-clip: padding-box;
}
.main-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.15);
}
.main-content:hover::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.12); /* 悬停在内容区域时显示更明显的滚动条 */
}
.main-hotlist {
  width: 270px;
  flex-shrink: 0;
  margin-left: 32px;
  margin-right: 40px;
  margin-top: 104px; /* 增加顶部间距，与动态卡片保持一致 */
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
:deep(.main-sidebar) {
  position: fixed !important; /* 改为fixed定位 */
  top: 0;
  left: 0;
  z-index: 110;
  height: 100vh;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
:deep(.main-header) {
  width: 100% !important;
  left: 0;
  position: fixed !important; /* 改为fixed定位 */
  top: 0; /* 确保贴合顶部 */
  z-index: 100;
  margin: 0; /* 移除所有边距 */
  padding: 0;
}
@media (max-width: 1200px) {
  .main-hotlist {
    display: none;
  }
  .main-content {
    padding: 64px 8px 80px 8px;
  }
}
@media (max-width: 900px) {
  .main-sidebar {
    display: none;
  }
  .main-content {
    padding: 64px 2px 80px 2px;
  }
}
</style>
