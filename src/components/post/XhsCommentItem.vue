<template>
  <div class="xhs-comment-item">
    <!-- 评论主体 -->
    <div class="comment-main">
      <el-avatar :size="32" :src="comment.userAvatar" class="user-avatar"></el-avatar>
      
      <div class="comment-content">
        <div class="comment-header">
          <span class="username">{{ comment.username }}</span>
          <span v-if="comment.replyTo" class="reply-to">
            回复 <span class="reply-username">@{{ comment.replyTo }}</span>
          </span>
        </div>
        
        <div class="comment-text">
          {{ comment.content }}
        </div>
        
        <div class="comment-footer">
          <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
          <span class="comment-action" @click="handleReply">回复</span>
          <span v-if="showDelete" class="comment-action delete" @click="handleDelete">删除</span>
        </div>
      </div>
      
      <div class="comment-like">
        <i 
          class="fas fa-heart" 
          :class="{ 'is-liked': comment.isLiked }" 
          @click="handleLike"
        ></i>
        <span v-if="comment.likeCount > 0">{{ comment.likeCount }}</span>
      </div>
    </div>
    
    <!-- 评论回复列表 -->
    <div v-if="comment.replies && comment.replies.length > 0" class="comment-replies">
      <div 
        v-for="reply in displayReplies" 
        :key="reply.id" 
        class="reply-item"
      >
        <el-avatar :size="24" :src="reply.userAvatar" class="user-avatar"></el-avatar>
        
        <div class="reply-content">
          <div class="reply-header">
            <span class="username">{{ reply.username }}</span>
            <span v-if="reply.replyTo" class="reply-to">
              回复 <span class="reply-username">@{{ reply.replyTo }}</span>
            </span>
          </div>
          
          <div class="reply-text">
            {{ reply.content }}
          </div>
          
          <div class="reply-footer">
            <span class="comment-time">{{ formatTime(reply.createTime) }}</span>
            <span class="comment-action" @click="() => handleReplyToReply(reply)">回复</span>
          </div>
        </div>
        
        <div class="comment-like reply-like">
          <i 
            class="fas fa-heart" 
            :class="{ 'is-liked': reply.isLiked }" 
            @click="() => handleReplyLike(reply)"
          ></i>
          <span v-if="reply.likeCount > 0">{{ reply.likeCount }}</span>
        </div>
      </div>
      
      <!-- 展开/收起回复 -->
      <div v-if="comment.replies.length > 2" class="toggle-replies">
        <span v-if="!showAllReplies" @click="showAllReplies = true">
          展开{{ comment.replies.length - 2 }}条回复 <i class="fas fa-chevron-down"></i>
        </span>
        <span v-else @click="showAllReplies = false">
          收起回复 <i class="fas fa-chevron-up"></i>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

// 配置dayjs
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  postId: {
    type: [Number, String],
    required: true
  }
});

const emit = defineEmits(['reply', 'like', 'delete']);

// 显示所有回复的状态
const showAllReplies = ref(false);

// 显示删除按钮（仅当评论属于当前用户时）
const showDelete = computed(() => {
  // 模拟当前用户ID为10001
  const currentUserId = 10001;
  return props.comment.userId === currentUserId;
});

// 控制显示的回复数量
const displayReplies = computed(() => {
  if (!props.comment.replies) return [];
  
  return showAllReplies.value
    ? props.comment.replies
    : props.comment.replies.slice(0, 2);
});

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  return dayjs(time).fromNow();
};

// 回复评论
const handleReply = () => {
  emit('reply', props.comment);
};

// 回复子回复
const handleReplyToReply = (reply) => {
  emit('reply', { ...reply, parentId: props.comment.id });
};

// 点赞评论
const handleLike = () => {
  emit('like', props.comment.id);
};

// 点赞回复
const handleReplyLike = (reply) => {
  emit('like', reply.id);
};

// 删除评论
const handleDelete = () => {
  ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    emit('delete', props.comment.id);
  }).catch(() => {
    // 取消删除
  });
};
</script>

<style scoped>
.xhs-comment-item {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.xhs-comment-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.comment-main {
  display: flex;
  align-items: flex-start;
}

.user-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  margin-bottom: 4px;
}

.username {
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.reply-to {
  margin-left: 4px;
  font-size: 14px;
  color: #666;
}

.reply-username {
  color: #1677ff;
}

.comment-text {
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  margin-bottom: 4px;
  color: #333;
}

.comment-footer {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.comment-time {
  margin-right: 12px;
}

.comment-action {
  margin-right: 12px;
  cursor: pointer;
}

.comment-action:hover {
  color: #1677ff;
}

.comment-action.delete:hover {
  color: #f56c6c;
}

.comment-like {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
  font-size: 14px;
  margin-left: 8px;
  cursor: pointer;
}

.comment-like i {
  font-size: 16px;
  transition: transform 0.2s;
}

.comment-like i:hover {
  transform: scale(1.2);
}

.comment-like i.is-liked {
  color: #f56c6c;
}

.comment-replies {
  margin-left: 44px;
  margin-top: 8px;
}

.reply-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 0;
  border-bottom: none;
}

.reply-content {
  flex: 1;
  min-width: 0;
}

.reply-header {
  margin-bottom: 2px;
}

.reply-text {
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
  margin-bottom: 2px;
}

.reply-footer {
  font-size: 12px;
  color: #999;
}

.reply-like {
  font-size: 12px;
}

.reply-like i {
  font-size: 14px;
}

.toggle-replies {
  font-size: 12px;
  color: #1677ff;
  cursor: pointer;
  margin-top: 8px;
  display: flex;
  align-items: center;
}

.toggle-replies i {
  margin-left: 4px;
  font-size: 10px;
}

.toggle-replies:hover {
  opacity: 0.8;
}
</style>
