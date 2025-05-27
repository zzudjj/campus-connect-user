<template>
  <div class="profile-post-item" @click="expandPost">
    <div class="post-content">
      <!-- 动态内容预览 -->
      <div class="post-text">{{ truncatedContent }}</div>
      
      <!-- 媒体预览 (如果有) -->
      <div v-if="post.media && post.media.length" class="post-media-preview">
        <img 
          v-if="post.media[0].type === 0" 
          :src="post.media[0].url" 
          class="preview-image" 
          alt="媒体预览"
        />
        <div v-else-if="post.media[0].type === 1" class="preview-video">
          <img 
            :src="getVideoThumbnail(post.media[0])" 
            alt="视频缩略图" 
          />
          <div class="video-badge">
            <i class="fas fa-play"></i>
          </div>
        </div>
        <div v-if="post.media.length > 1" class="more-media">+{{ post.media.length - 1 }}</div>
      </div>
    </div>
    
    <div class="post-footer">
      <div class="post-time">{{ formatTime(post.createdAt) }}</div>
      <div class="post-stats">
        <span class="stat-item">
          <i class="fas fa-heart" :class="{'text-danger': post.isLiked}"></i> {{ post.likeCount || 0 }}
        </span>
        <span class="stat-item">
          <i class="fas fa-comment-dots"></i> {{ post.commentCount || 0 }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['expand']);

// 截断内容，显示前100个字符
const truncatedContent = computed(() => {
  if (!props.post.content) return '';
  if (props.post.content.length <= 100) return props.post.content;
  return props.post.content.slice(0, 100) + '...';
});

// 格式化时间为相对时间
const formatTime = (time) => {
  if (!time) return '';
  return dayjs(time).fromNow();
};

// 获取视频缩略图
const getVideoThumbnail = (media) => {
  // 输出媒体对象，查看可用属性
  console.log('视频媒体对象:', media);
  
  // 首选backgroundUrl属性（后端缩略图字段）
  if (media.backgroundUrl && media.backgroundUrl !== '') {
    console.log('使用backgroundUrl:', media.backgroundUrl);
    return media.backgroundUrl;
  }
  
  // 此处兼容旧字段名，正常不会使用
  if (media.thumbnailUrl && media.thumbnailUrl !== '') {
    console.log('使用thumbnailUrl:', media.thumbnailUrl);
    return media.thumbnailUrl;
  }
  
  // 如果都没有，使用基于动态ID的随机图片
  const randomId = (props.post.id * 7) % 100; // 使用动态ID生成固定的随机图片
  return `https://picsum.photos/id/${randomId}/400/300`;
};

// 展开动态
const expandPost = () => {
  emit('expand', props.post);
};
</script>

<style scoped>
.profile-post-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.02);
}

.profile-post-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
  border-color: rgba(0, 0, 0, 0.04);
}

.post-content {
  display: flex;
  gap: 16px;
}

.post-text {
  flex: 1;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.post-media-preview {
  width: 80px;
  height: 80px;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.preview-image, .preview-video img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
}

.more-media {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px 0 0 0;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  font-size: 12px;
  color: #999;
}

.post-stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.text-danger {
  color: #f56c6c;
}
</style>
