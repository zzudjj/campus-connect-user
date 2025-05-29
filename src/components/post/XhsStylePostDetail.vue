<template>
  <!-- 使用 teleport 将模态框渲染到 body -->
  <teleport to="body">
    <!-- 全屏遮罩层 -->
    <div v-if="visible" class="xhs-modal-overlay" @click="close">
    <div class="xhs-post-detail-container" :class="{ 'is-mobile': isMobile }" @click.stop>
      <!-- 关闭按钮 -->
      <div class="close-button" @click="close">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </div>

      <!-- 左侧媒体区域 -->
      <div class="media-section">
        <!-- 轮播图，如果有多张图片/视频 -->
        <el-carousel
          v-if="post.media && post.media.length > 0"
          indicator-position="outside"
          arrow="always"
          height="100%"
          :autoplay="false"
          :initial-index="currentMediaIndex"
          @change="handleMediaChange"
        >
          <el-carousel-item v-for="(media, index) in post.media" :key="index">
            <!-- 图片媒体 -->
            <div v-if="media.type === 0" class="media-wrapper image">
              <img :src="media.url" class="media-content" />
            </div>

            <!-- 视频媒体 -->
            <div v-else-if="media.type === 1" class="media-wrapper video">
              <video
                :src="media.url"
                class="media-content video"
                controls
                :poster="media.thumbnailUrl || media.backgroundUrl"
              ></video>
            </div>
          </el-carousel-item>
        </el-carousel>

        <!-- 如果没有媒体内容，显示占位图 -->
        <div v-else class="no-media">
          <i class="fas fa-image"></i>
          <p>暂无媒体内容</p>
        </div>
      </div>

      <!-- 右侧内容区域 -->
      <div class="content-section">
        <!-- 用户信息 -->
        <div class="user-info">
          <el-avatar :size="40" :src="post.userAvatar || post.avatarUrl"></el-avatar>
          <div class="user-meta">
            <div class="username">
              {{ post.username || post.nickname }}
              <span v-if="post.authStatus === 2" class="auth-badge verified" title="已认证用户">
                <i class="fas fa-check-circle"></i>
              </span>
            </div>
            <div class="post-time">{{ formatTime(post.createTime || post.createdAt) }}</div>
          </div>
          <el-button
            size="small"
            :type="post.isFollowed ? 'primary' : 'default'"
            round
            @click="handleFollow"
          >
            {{ post.isFollowed ? '已关注' : '关注' }}
          </el-button>
        </div>

        <!-- 动态内容 -->
        <div class="post-content">
          <p>{{ post.content }}</p>

          <!-- 标签 -->
          <div v-if="tags.length > 0" class="post-tags">
            <span v-for="tag in tags" :key="tag" class="tag">
              #{{ tag }}
            </span>
          </div>
        </div>

        <!-- 互动操作栏 -->
        <div class="action-bar">
          <div class="action-item">
            <el-button
              class="action-btn"
              :type="post.isLiked ? 'danger' : 'default'"
              circle
              text
              @click="handleLike"
            >
              <i class="fas" :class="post.isLiked ? 'fa-heart' : 'fa-heart'"></i>
            </el-button>
            <span class="count">{{ post.likeCount || 0 }}</span>
          </div>
          <div class="action-item">
            <el-button
              class="action-btn"
              circle
              text
              @click="focusCommentInput"
            >
              <i class="fas fa-comment"></i>
            </el-button>
            <span class="count">{{ post.commentCount || 0 }}</span>
          </div>
          <div class="action-item">
            <el-button
              class="action-btn"
              circle
              text
              @click="handleCollect"
            >
              <i class="fas" :class="isCollected ? 'fa-bookmark' : 'fa-bookmark'"></i>
            </el-button>
            <span class="count">{{ collectionCount }}</span>
          </div>
          <div class="action-item">
            <el-button
              class="action-btn"
              circle
              text
              @click="handleShare"
            >
              <i class="fas fa-share-alt"></i>
            </el-button>
          </div>
        </div>

        <!-- 评论区 -->
        <div class="comments-section">
          <div class="comments-header">
            <h3>评论 {{ post.commentCount || 0 }}</h3>
          </div>

          <!-- 评论列表 -->
          <div v-if="comments.length > 0" class="comments-list">
            <XhsCommentItem
              v-for="comment in comments"
              :key="comment.id"
              :comment="comment"
              :post-id="post.id"
              @reply="handleReply"
              @like="handleCommentLike"
            />
          </div>

          <!-- 空评论状态 -->
          <div v-else class="no-comments">
            <i class="fas fa-comment-dots"></i>
            <p>暂无评论，快来抢沙发</p>
          </div>

          <!-- 加载更多 -->
          <div v-if="hasMoreComments" class="load-more">
            <el-button text @click="loadMoreComments">加载更多评论</el-button>
          </div>

          <!-- 评论输入框 -->
          <div class="comment-input-wrapper">
            <el-avatar :size="32" :src="currentUserAvatar"></el-avatar>
            <div class="comment-input-container">
              <input
                ref="commentInput"
                v-model="commentText"
                class="comment-input"
                :placeholder="replyTo ? `回复 @${replyTo.username}：` : '添加评论...'"
                @keyup.enter="submitComment"
              />
              <div v-if="replyTo" class="reply-badge" @click="cancelReply">
                回复：@{{ replyTo.username }} <i class="fas fa-times"></i>
              </div>
              <el-button
                class="send-btn"
                :disabled="!commentText.trim()"
                size="small"
                @click="submitComment"
              >
                发送
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import XhsCommentItem from './XhsCommentItem.vue';
import { getCommentList, addComment, batchGetUserInfo } from '@/api/comment';
import { toggleLike, getLikeStatus } from '@/api/like';

// 设置dayjs语言和插件
dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'like', 'follow', 'comment']);

// 响应式状态
const isMobile = computed(() => window.innerWidth <= 768);
const currentMediaIndex = ref(0);
const commentText = ref('');
const replyTo = ref(null);
const comments = ref([]);
const loading = ref(false);
const hasMoreComments = ref(false);
const commentPage = ref(1);
const commentPageSize = ref(10);
const isCollected = ref(false);
const collectionCount = ref(0);
const commentInput = ref(null);

// 从动态内容中提取标签
const tags = computed(() => {
  if (!props.post.content) return [];

  const tagRegex = /#([^#\s]+)/g;
  const matches = props.post.content.match(tagRegex);

  if (!matches) return [];

  // 删除#前缀，并去重
  return [...new Set(matches.map(tag => tag.slice(1)))];
});

// 当前用户头像
const currentUserAvatar = computed(() => {
  // 这里可以从本地存储或全局状态获取当前用户信息
  // 暂时使用占位图
  return localStorage.getItem('userAvatar') || 'https://via.placeholder.com/40';
});

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  return dayjs(time).fromNow();
};

// 处理媒体轮播变化
const handleMediaChange = (index) => {
  currentMediaIndex.value = index;
};

// 处理点赞
const handleLike = async () => {
  try {
    // 先保存原始状态，用于失败时恢复
    const originalLiked = props.post.isLiked;
    const originalCount = props.post.likeCount || 0;

    // 立即更新UI，提高响应速度
    props.post.isLiked = !props.post.isLiked;
    props.post.likeCount = props.post.isLiked ? originalCount + 1 : Math.max(0, originalCount - 1);

    // 调用API切换点赞状态
    const response = await toggleLike(props.post.id, 0); // 0表示动态

    if (response.code === 200) {
      // 使用服务器返回的正确数据更新UI
      props.post.isLiked = response.data.liked;
      props.post.likeCount = response.data.likeCount;
      console.log('动态点赞状态已更新:', response.data);

      // 通知父组件
      emit('like', props.post.id);
    } else {
      // 如果请求失败，恢复原始状态
      props.post.isLiked = originalLiked;
      props.post.likeCount = originalCount;
      ElMessage.error('点赞操作失败: ' + response.message);
    }
  } catch (error) {
    console.error('点赞动态失败:', error);
    // 恢复原始状态
    props.post.isLiked = originalLiked;
    props.post.likeCount = originalCount;
    ElMessage.error('点赞操作失败，请重试');
  }
};

// 处理关注
const handleFollow = () => {
  emit('follow', props.post.userId);
};

// 处理收藏
const handleCollect = () => {
  isCollected.value = !isCollected.value;
  collectionCount.value = isCollected.value
    ? collectionCount.value + 1
    : Math.max(0, collectionCount.value - 1);

  ElMessage.success(isCollected.value ? '收藏成功' : '已取消收藏');
};

// 处理分享
const handleShare = () => {
  ElMessage({
    message: '分享功能开发中...',
    type: 'info'
  });
};

// 加载评论
const loadComments = async (reset = false) => {
  if (loading.value) return;

  try {
    loading.value = true;

    if (reset) {
      commentPage.value = 1;
      comments.value = [];
    }

    const res = await getCommentList(props.post.id);

    if (res.code === 200 && res.data && res.data.length > 0) {
      // 获取所有评论的用户ID
      const userIds = [...new Set(res.data.map(comment => comment.userId))];

      // 批量获取用户信息
      let userInfoMap = {};
      try {
        const userInfoRes = await batchGetUserInfo(userIds);
        if (userInfoRes.code === 200) {
          // API返回的数据格式是 { "1": { nickname: "张三", ... }, "2": { ... } }
          userInfoMap = userInfoRes.data || {};
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }

      // 处理评论数据，确保字段名一致
      const processedComments = await Promise.all(res.data.map(async comment => {
        const userInfo = userInfoMap[comment.userId] || {};

        // 获取评论点赞状态
        let isLiked = false;
        try {
          const likeRes = await getLikeStatus(comment.commentId, 1); // 1表示评论
          if (likeRes.code === 200) {
            isLiked = likeRes.data.liked || false;
          }
        } catch (error) {
          console.error(`获取评论 ${comment.commentId} 点赞状态失败:`, error);
        }

        return {
          id: comment.commentId,
          postId: comment.postId,
          userId: comment.userId,
          username: userInfo.nickname || `用户${comment.userId}`,
          userAvatar: userInfo.avatarUrl || 'https://via.placeholder.com/40',
          authStatus: userInfo.authStatus || 0,
          content: comment.content,
          createTime: comment.createdAt,
          likeCount: comment.likeNum || 0,
          commentCount: comment.commentNum || 0,
          isLiked,
          replies: []
        };
      }));

      if (reset) {
        comments.value = processedComments;
      } else {
        comments.value = [...comments.value, ...processedComments];
      }

      // 暂时不支持分页，所以没有更多评论
      hasMoreComments.value = false;
    } else {
      // 没有评论数据
      if (reset) {
        comments.value = [];
      }
      hasMoreComments.value = false;
    }
  } catch (error) {
    console.error('获取评论失败:', error);
    ElMessage.error('获取评论失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 加载更多评论
const loadMoreComments = () => {
  loadComments();
};

// 处理评论回复
const handleReply = (comment) => {
  replyTo.value = comment;
  focusCommentInput();
};

// 处理评论点赞
const handleCommentLike = async (commentId) => {
  try {
    const targetComment = comments.value.find(c => c.id === commentId);
    if (!targetComment) return;

    // 先保存原始状态，用于失败时恢复
    const originalLiked = targetComment.isLiked;
    const originalCount = targetComment.likeCount || 0;

    // 立即更新UI，提高响应速度
    targetComment.isLiked = !targetComment.isLiked;
    targetComment.likeCount = targetComment.isLiked ? originalCount + 1 : Math.max(0, originalCount - 1);

    // 调用点赞切换API (targetType: 1表示评论)
    const response = await toggleLike(commentId, 1);

    if (response.code === 200) {
      // 使用服务器返回的正确数据更新UI
      targetComment.isLiked = response.data.liked;
      targetComment.likeCount = response.data.likeCount;
      console.log('评论点赞状态已更新:', response.data);
    } else {
      // 如果请求失败，恢复原始状态
      targetComment.isLiked = originalLiked;
      targetComment.likeCount = originalCount;
      ElMessage.error('点赞操作失败: ' + response.message);
    }
  } catch (error) {
    console.error('评论点赞失败:', error);
    // 恢复原始状态
    const targetComment = comments.value.find(c => c.id === commentId);
    if (targetComment) {
      targetComment.isLiked = originalLiked;
      targetComment.likeCount = originalCount;
    }
    ElMessage.error('点赞操作失败，请重试');
  }
};

// 提交评论
const submitComment = async () => {
  if (!commentText.value.trim()) return;

  try {
    // 获取动态ID，兼容不同的字段名
    const postIdValue = props.post.postId || props.post.id;

    if (!postIdValue) {
      ElMessage.error('无法获取动态ID，评论失败');
      return;
    }

    // 初始化评论数据
    let commentData = {
      postId: postIdValue,
      content: commentText.value.trim()
    };

    // 处理回复逻辑
    if (replyTo.value) {
      commentData.parentCommentId = replyTo.value.id;

      // 添加@用户名到评论内容（如果还没有的话）
      if (!commentData.content.includes(`@${replyTo.value.username}`)) {
        commentData.content = `@${replyTo.value.username} ${commentData.content}`;
      }
    } else {
      // 直接评论动态
      commentData.parentCommentId = '-1';
    }

    console.log('发送评论数据:', commentData);

    const response = await addComment(commentData);

    if (response.code === 200) {
      ElMessage.success('评论成功');

      // 重新加载评论列表
      await loadComments(true);

      // 更新评论计数
      if (props.post.commentCount !== undefined) {
        props.post.commentCount += 1;
      }

      // 通知父组件评论成功
      emit('comment', props.post.id);
    } else {
      ElMessage.error('评论失败: ' + response.message);
    }

    // 清空评论输入框和回复状态
    commentText.value = '';
    replyTo.value = null;
  } catch (error) {
    console.error('评论失败:', error);
    ElMessage.error('评论失败，请重试');
  }
};

// 取消回复
const cancelReply = () => {
  replyTo.value = null;
};

// 聚焦评论输入框
const focusCommentInput = () => {
  nextTick(() => {
    commentInput.value?.focus();
  });
};

// 关闭详情
const close = () => {
  emit('update:visible', false);
};

// 组件挂载时加载评论
onMounted(() => {
  if (props.visible) {
    loadComments(true);
  }
});

// 监听visible变化
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    loadComments(true);
  }
});
</script>

<style scoped>
/* 全屏遮罩层 */
.xhs-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.xhs-post-detail-container {
  display: flex;
  width: 90vw;
  max-width: 1200px;
  height: 85vh;
  max-height: 800px;
  background-color: #fff;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.close-button {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.9);
  color: #666;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000000;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 1);
  color: #333;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 左侧媒体区域 */
.media-section {
  width: 65%;
  background-color: #000;
  position: relative;
  height: 100%;
  min-height: 400px;
}

.media-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
}

.media-content {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.media-content.video {
  width: 100%;
  height: 100%;
}

.no-media {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.no-media i {
  font-size: 48px;
  margin-bottom: 16px;
}

/* 右侧内容区域 */
.content-section {
  width: 35%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: 600px;
  position: relative;
}

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.user-meta {
  margin-left: 12px;
  flex: 1;
}

.username {
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
}

.auth-badge {
  margin-left: 4px;
  font-size: 14px;
}

.auth-badge.verified {
  color: #4CAF50;
}

.post-time {
  font-size: 13px;
  color: #999;
  margin-top: 2px;
}

/* 动态内容 */
.post-content {
  margin-bottom: 24px;
  font-size: 15px;
  line-height: 1.6;
  color: #333;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tag {
  color: #1677ff;
  cursor: pointer;
  font-size: 14px;
}

/* 互动操作栏 */
.action-bar {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.action-item {
  display: flex;
  align-items: center;
  margin-right: 24px;
}

.action-btn {
  margin-right: 4px;
}

.count {
  font-size: 14px;
  color: #666;
}

/* 评论区 */
.comments-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.comments-header {
  margin-bottom: 16px;
}

.comments-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.comments-list {
  flex: 1;
  overflow-y: auto;
}

.no-comments {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
}

.no-comments i {
  font-size: 32px;
  margin-bottom: 12px;
}

.load-more {
  text-align: center;
  padding: 16px 0;
}

/* 评论输入框 */
.comment-input-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.comment-input-container {
  flex: 1;
  position: relative;
}

.comment-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  outline: none;
  transition: border-color 0.3s ease;
}

.comment-input:focus {
  border-color: #1677ff;
}

.reply-badge {
  background-color: #f0f7ff;
  color: #1677ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  display: inline-block;
}

.send-btn {
  margin-top: 8px;
}

/* 移动端样式 */
.is-mobile {
  flex-direction: column;
  width: 95vw;
  height: 90vh;
  max-width: none;
  max-height: none;
}

.is-mobile .media-section,
.is-mobile .content-section {
  width: 100%;
}

.is-mobile .media-section {
  height: 60vh;
  min-height: 300px;
}

.is-mobile .content-section {
  height: 40vh;
  max-height: none;
  padding: 16px;
}

.is-mobile .close-button {
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
}

/* 移动端遮罩层调整 */
@media (max-width: 768px) {
  .xhs-modal-overlay {
    padding: 10px;
  }

  .xhs-post-detail-container {
    width: 95vw;
    height: 90vh;
    border-radius: 12px;
  }
}

/* Element Plus 组件样式覆盖 */
:deep(.el-carousel__indicator) {
  background-color: rgba(255, 255, 255, 0.5);
}

:deep(.el-carousel__indicator.is-active) {
  background-color: #fff;
}

:deep(.el-carousel__arrow) {
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
}

:deep(.el-carousel__arrow:hover) {
  background-color: rgba(0, 0, 0, 0.7);
}

/* 滚动条样式 */
.content-section::-webkit-scrollbar {
  width: 6px;
}

.content-section::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.content-section::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.content-section::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.comments-list::-webkit-scrollbar {
  width: 4px;
}

.comments-list::-webkit-scrollbar-track {
  background: transparent;
}

.comments-list::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 2px;
}

.comments-list::-webkit-scrollbar-thumb:hover {
  background: #c0c0c0;
}
</style>
