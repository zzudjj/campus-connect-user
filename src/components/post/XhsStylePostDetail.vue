<template>
  <div class="xhs-post-detail-container" :class="{ 'is-mobile': isMobile }">
    <!-- 关闭按钮 -->
    <div class="close-button" @click="close">
      <i class="fas fa-times"></i>
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
        <el-avatar :size="40" :src="post.userAvatar"></el-avatar>
        <div class="user-meta">
          <div class="username">
            {{ post.username }}
            <span v-if="post.authStatus === 2" class="auth-badge verified" title="已认证用户">
              <i class="fas fa-check-circle"></i>
            </span>
          </div>
          <div class="post-time">{{ formatTime(post.createTime) }}</div>
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
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import XhsCommentItem from './XhsCommentItem.vue';
import { getPostComments } from '@/api/post';
import { toggleLike } from '@/api/like';

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
    const res = await toggleLike(props.post.id, 0); // 0表示动态
    if (res.code === 200) {
      emit('like', props.post.id);
    }
  } catch (error) {
    console.error('点赞失败:', error);
    ElMessage.error('点赞失败，请重试');
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
    
    const res = await getPostComments(props.post.id, {
      page: commentPage.value,
      pageSize: commentPageSize.value
    });
    
    if (res.code === 200) {
      if (reset) {
        comments.value = res.data.list;
      } else {
        comments.value = [...comments.value, ...res.data.list];
      }
      
      hasMoreComments.value = comments.value.length < res.data.total;
      commentPage.value++;
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
    // 调用评论点赞API
    // 暂时使用模拟数据
    const targetComment = comments.value.find(c => c.id === commentId);
    if (targetComment) {
      targetComment.isLiked = !targetComment.isLiked;
      targetComment.likeCount = targetComment.isLiked
        ? targetComment.likeCount + 1
        : Math.max(0, targetComment.likeCount - 1);
    }
  } catch (error) {
    console.error('评论点赞失败:', error);
    ElMessage.error('操作失败，请重试');
  }
};

// 提交评论
const submitComment = async () => {
  if (!commentText.value.trim()) return;
  
  try {
    // 根据是否有replyTo构建不同的评论对象
    const comment = {
      postId: props.post.id,
      content: commentText.value.trim(),
      // 如果是回复评论，则添加评论ID
      ...(replyTo.value ? { parentId: replyTo.value.id } : {})
    };
    
    // 添加评论的模拟数据
    const newComment = {
      id: Date.now(),
      postId: props.post.id,
      content: commentText.value.trim(),
      createTime: new Date().toISOString(),
      userId: 10001, // 模拟当前用户ID
      username: '当前用户', // 模拟当前用户名
      userAvatar: currentUserAvatar.value,
      likeCount: 0,
      isLiked: false,
      replies: []
    };
    
    if (replyTo.value) {
      // 如果是回复评论，则添加到相应评论的回复列表
      const parentComment = comments.value.find(c => c.id === replyTo.value.id);
      if (parentComment) {
        parentComment.replies = parentComment.replies || [];
        parentComment.replies.unshift({
          ...newComment,
          replyTo: replyTo.value.username
        });
      }
    } else {
      // 否则添加为顶级评论
      comments.value.unshift(newComment);
    }
    
    // 更新评论计数
    if (props.post.commentCount !== undefined) {
      props.post.commentCount += 1;
    }
    
    // 清空评论输入框和回复状态
    commentText.value = '';
    replyTo.value = null;
    
    ElMessage.success('评论成功');
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
  
  // 为了演示，假设收藏计数
  collectionCount.value = Math.floor(Math.random() * 20);
});

// 监听visible变化
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    loadComments(true);
  }
});
</script>

<style scoped>
.xhs-post-detail-container {
  display: flex;
  width: 100%;
  height: 100%;
  background-color: #fff;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: rgba(0, 0, 0, 0.7);
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
  padding: 24px 0;
  color: #999;
}

.no-comments i {
  font-size: 32px;
  margin-bottom: 8px;
}

.load-more {
  text-align: center;
  padding: 12px 0;
}

/* 评论输入框 */
.comment-input-wrapper {
  display: flex;
  align-items: flex-start;
  margin-top: 16px;
  position: relative;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.comment-input-container {
  position: relative;
  margin-left: 12px;
  flex: 1;
}

.comment-input {
  width: 100%;
  height: 36px;
  border: 1px solid #e0e0e0;
  border-radius: 18px;
  padding: 0 80px 0 16px;
  outline: none;
  font-size: 14px;
  transition: border-color 0.3s;
}

.comment-input:focus {
  border-color: #1677ff;
}

.send-btn {
  position: absolute;
  right: 4px;
  top: 4px;
  border-radius: 16px;
}

.reply-badge {
  position: absolute;
  top: -20px;
  left: 8px;
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
}

.reply-badge i {
  margin-left: 4px;
  cursor: pointer;
}

/* 移动端样式 */
.is-mobile {
  flex-direction: column;
}

.is-mobile .media-section,
.is-mobile .content-section {
  width: 100%;
}

.is-mobile .media-section {
  height: 50vh;
}

.is-mobile .content-section {
  max-height: 50vh;
}
</style>
