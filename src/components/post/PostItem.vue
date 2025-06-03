<template>
  <el-card class="post-item" shadow="hover">
    <!-- 三点菜单 - 放在卡片内部右上角 -->
    <div class="post-menu">
      <el-dropdown trigger="click" @command="handleMoreAction">
        <i class="fas fa-ellipsis-h"></i>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="report">举报</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <!-- 用户信息区 -->
    <div class="post-header">
      <el-avatar :src="post.userAvatar" :size="44" />
      <div class="user-info">
        <div class="username">
          {{ post.username }}
          <!-- 用户认证标志 -->
          <span v-if="post.authStatus == 2" class="auth-badge" title="认证中">
            <i class="fas fa-circle" style="color: #4CAF50;"></i>
          </span>
          <!-- 用户认证中标志 -->
          <span v-else-if="post.authStatus == 1" class="auth-badge" title="已认证">
            <i class="fas fa-check-circle" style="color: #FFC107;"></i>
          </span>
          <!-- 未认证标志 -->
          <span v-else class="auth-badge" title="未认证">
            <i class="fas fa-question-circle" style="color: #9E9E9E;"></i>
          </span>
        </div>
        <div class="post-time">{{ formatTime(post.createTime) }}</div>
      </div>
    </div>
    <!-- 内容区 -->
    <div class="post-content">
      <span v-if="!showFullContent">{{ shortContent }}<span v-if="isLongContent" class="expand-btn" @click="showFullContent = true">...展开</span></span>
      <span v-else>{{ post.content }}<span v-if="isLongContent" class="expand-btn" @click="showFullContent = false"> 收起</span></span>
    </div>
    <!-- 媒体展示区（图片/视频） -->
    <div v-if="post.media && post.media.length" class="post-media">
      <div class="media-grid" :class="'media-grid-' + Math.min(post.media.length, 9)">
        <div 
          v-for="(item, idx) in post.media" 
          :key="idx"
          class="media-wrapper"
        >
          <!-- 图片媒体 -->
          <el-image
            v-if="item.type === 0"
            :src="item.url"
            fit="cover"
            class="image-cell"
            :preview-src-list="imageUrlList"
            :initial-index="getImageIndex(idx)"
            :preview-teleported="true"
            preview-class="custom-image-preview"
            loading="eager"
          />
          
          <!-- 视频媒体 -->
          <div v-else-if="item.type === 1" class="video-container">
            <div class="video-thumbnail" @click="playVideo(item.url)">
              <img :src="item.thumbnailUrl || 'https://picsum.photos/id/36/400/300'" alt="视频缩略图" />
              <div class="play-icon-backdrop"></div>
              <div class="play-icon">
                <i class="fas fa-play"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 操作区 -->
    <div class="post-actions">
      <div class="action-item">
        <el-button
          class="action-btn"
          :type="post.isLiked ? 'danger' : 'default'"
          size="small"
          text
          @click="$emit('like', post.id)"
        >
          <i class="fas fa-heart"></i>
        </el-button>
        <span class="count-text">{{ post.likeCount }}</span>
      </div>
      
      <div class="action-item">
        <el-button
          class="action-btn"
          type="default"
          size="small"
          text
          @click="$emit('comment', post)"
        >
          <i class="fas fa-comment-dots"></i>
        </el-button>
        <span class="count-text">{{ post.commentCount }}</span>
      </div>
      
      <!-- 关注按钮已移除 -->
    </div>
  </el-card>
  
  <!-- 举报弹窗 -->
  <el-dialog
    v-model="showReportDialog"
    title="举报内容"
    width="30%"
    destroy-on-close
    append-to-body
  >
    <div class="report-dialog">
      <p class="report-title">请选择举报原因</p>
      <el-radio-group v-model="reportReason">
        <el-radio label="垃圾广告">垃圾广告</el-radio>
        <el-radio label="色情内容">色情内容</el-radio>
        <el-radio label="违法有害信息">违法有害信息</el-radio>
        <el-radio label="骗局信息">骗局信息</el-radio>
        <el-radio label="骚扰行为">骚扰行为</el-radio>
        <el-radio label="其他">其他</el-radio>
      </el-radio-group>
      
      <el-input
        v-if="reportReason === '其他'"
        v-model="customReason"
        type="textarea"
        :rows="3"
        placeholder="请详细描述举报原因"
        maxlength="200"
        show-word-limit
      />
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showReportDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReport" :disabled="!reportReason">
          提交举报
        </el-button>
      </span>
    </template>
  </el-dialog>
  
<!-- 视频预览组件，使用teleport确保不影响页面布局 -->
<teleport to="body">
  <div v-if="showVideoViewer" class="video-viewer-container">
    <div class="video-viewer-wrapper">
      <div class="video-viewer-mask"></div>
      
      <!-- 关闭按钮 -->
      <span class="video-viewer-btn video-viewer-close" @click="closeVideoViewer">
        <i class="video-icon-close">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"></path>
          </svg>
        </i>
      </span>
      
      <!-- 工具栏 -->
      <div class="video-viewer-btn-group">
        <!-- 全屏按钮 -->
        <span class="video-viewer-btn" @click="toggleFullscreen">
          <i class="video-icon-fullscreen">
            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="m160 96.064 192 .192a32 32 0 0 1 0 64l-192-.192V352a32 32 0 0 1-64 0V96h64v.064zm0 831.872V672a32 32 0 1 1 64 0v255.936l192-.192a32 32 0 1 1 0 64l-192 .192A32 32 0 0 1 96 960V672a32 32 0 0 1 32-32h32v288.064zm639.936-768h-255.94a32 32 0 0 1 0-64h255.94A31.935 31.935 0 0 1 832 128v255.936a32 32 0 0 1-64 0V128h32.064zM831.872 864V608a32 32 0 1 1 64 0v256h-32.064v-255.93zM256.064 288v-.064h-.064a32 32 0 0 1 0-64h.064V288z"></path>
            </svg>
          </i>
        </span>
      </div>
      
      <!-- 视频容器 -->
      <div class="video-viewer-canvas" @click.self="closeVideoViewer">
        <video 
          v-if="currentVideo" 
          ref="videoPlayer"
          controls 
          autoplay 
          class="video-viewer-img"
          :src="currentVideo"
          @click.stop
        ></video>
      </div>
    </div>
  </div>
</teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { submitReport as apiSubmitReport } from '@/api/report';

const props = defineProps({ post: { type: Object, required: true } });
const emit = defineEmits(['like', 'comment', 'follow']);
const showFullContent = ref(false);
const maxContentLen = 80;
const shortContent = computed(() => props.post.content.length > maxContentLen ? props.post.content.slice(0, maxContentLen) : props.post.content);
const isLongContent = computed(() => props.post.content.length > maxContentLen);

// 举报相关状态
const showReportDialog = ref(false);
const reportReason = ref('');
const customReason = ref('');
const reportType = ref(1); // 目标类型：1为动态

// 处理菜单选项
const handleMoreAction = (command) => {
  if (command === 'report') {
    showReportDialog.value = true;
    reportReason.value = ''; // 重置举报原因
    customReason.value = ''; // 重置自定义原因
  }
};

// 提交举报
const submitReport = async () => {
  try {
    // 确定最终的举报原因
    const reason = reportReason.value === '其他' ? customReason.value : reportReason.value;
    
    if (reportReason.value === '其他' && !customReason.value.trim()) {
      ElMessage.warning('请输入举报原因');
      return;
    }
    
    // 确保targetId是整数
    const targetId = parseInt(props.post.id);
    if (isNaN(targetId)) {
      ElMessage.error('目标ID无效');
      return;
    }
    
    const response = await apiSubmitReport(targetId, reportType.value, reason);
    
    if (response.code === 200) {
      ElMessage.success('举报成功，我们会尽快处理');
      showReportDialog.value = false;
    } else {
      ElMessage.error(response.message || '举报失败，请稍后再试');
    }
  } catch (error) {
    console.error('提交举报错误:', error);
    if (error.response && error.response.data && error.response.data.message) {
      ElMessage.error(error.response.data.message);
    } else {
      ElMessage.error('网络错误，请稍后再试');
    }
  }
};

// 视频相关
const showVideoViewer = ref(false);
const currentVideo = ref('');
const videoPlayer = ref(null);


// 获取所有图片URL列表（用于预览）
const imageUrlList = computed(() => {
  if (!props.post.media) return [];
  return props.post.media
    .filter(item => item.type === 0) // 只筛选图片类型
    .map(item => item.url);
});

// 获取图片在imageUrlList中的索引
function getImageIndex(currentIndex) {
  if (!props.post.media) return 0;
  // 计算当前媒体之前有多少张图片
  let imageCount = 0;
  for (let i = 0; i < currentIndex; i++) {
    if (props.post.media[i].type === 0) {
      imageCount++;
    }
  }
  return imageCount;
}

// 播放视频
function playVideo(videoUrl) {
  if (!videoUrl) {
    ElMessage.error('视频链接无效');
    return;
  }
  
  currentVideo.value = videoUrl;
  showVideoViewer.value = true;
  
  // 添加ESC键关闭视频预览
  const handleEsc = (e) => {
    if (e.key === 'Escape' && showVideoViewer.value) {
      closeVideoViewer();
    }
  };
  
  nextTick(() => {
    window.addEventListener('keydown', handleEsc);
  });
  
  // 视频完成播放后自动关闭
  if (videoPlayer.value) {
    videoPlayer.value.addEventListener('ended', closeVideoViewer);
  }
}

// 关闭视频预览
function closeVideoViewer() {
  if (videoPlayer.value) {
    videoPlayer.value.pause();
    videoPlayer.value.removeEventListener('ended', closeVideoViewer);
  }
  
  showVideoViewer.value = false;
  currentVideo.value = '';
  
  // 移除键盘事件监听
  window.removeEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVideoViewer();
  });
  
  // 如果在全屏模式下关闭，退出全屏
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(err => {
      console.error('Error exiting fullscreen:', err);
    });
  }
}

// 切换全屏模式
function toggleFullscreen() {
  if (!videoPlayer.value) return;
  
  try {
    if (document.fullscreenElement) {
      // 如果已经是全屏，退出全屏
      document.exitFullscreen();
    } else {
      // 进入全屏模式
      const canvas = document.querySelector('.el-image-viewer__canvas');
      if (canvas) {
        canvas.requestFullscreen();
      }
    }
  } catch (err) {
    console.error('Error toggling fullscreen:', err);
  }
}

function formatTime(time) {
  const d = new Date(time);
  return d.toLocaleString().replace(/:\d{2}$/, '');
}
</script>

<style scoped>
.post-item {
  border-radius: 16px;
  margin-bottom: 24px;
  transition: box-shadow 0.2s;
  min-width: 0;
  box-shadow: 0 3px 12px 0 rgba(0,0,0,0.06);
  padding: 0;
  width: 100%;
  position: relative;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 16px 16px 0;
}
.el-avatar {
  margin-right: 12px;
  border: 1.5px solid #f2f3f5;
}
.user-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.username {
  font-size: 17px;
  font-weight: 600;
  color: #222;
  display: flex;
  align-items: center;
}

.auth-badge {
  display: inline-flex;
  margin-left: 5px;
  color: #1677ff;
  font-size: 14px;
}
.post-time {
  font-size: 13px;
  color: #aaa;
  margin-top: 2px;
}
.post-content {
  font-size: 16px;
  color: #222;
  margin-bottom: 14px;
  line-height: 1.7;
  word-break: break-all;
  padding: 0 16px;
}
.expand-btn {
  color: #1677ff;
  cursor: pointer;
  font-size: 15px;
  margin-left: 2px;
}
.post-media {
  margin-bottom: 16px;
  padding: 0 20px;
}
.media-grid {
  display: grid;
  gap: 8px;
  margin-top: 12px;
  width: 100%;
}

/* 简化媒体布局 */
.media-grid-1 {
  grid-template-columns: 1fr;
  max-width: 280px;
}

.media-grid-2, .media-grid-4 {
  grid-template-columns: repeat(2, 1fr);
  max-width: 360px;
}

.media-grid-3, .media-grid-5, .media-grid-6, .media-grid-7, .media-grid-8, .media-grid-9 {
  grid-template-columns: repeat(3, 1fr);
  max-width: 400px;
}

.media-wrapper {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 8px;
  background-color: #f5f5f5;
}

/* 视频相关样式 */
.video-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.video-thumbnail {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-icon-backdrop {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(3px);
  transition: all 0.3s ease;
  z-index: 1;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 2;
}

.play-icon i {
  color: white;
  font-size: 20px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
}

.video-thumbnail:hover .play-icon-backdrop {
  background-color: rgba(22, 119, 255, 0.3);
  transform: translate(-50%, -50%) scale(1.1);
}

.video-thumbnail:hover .play-icon i {
  color: #fff;
  transform: scale(1.2);
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
}

.image-cell {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}
.image-cell:hover {
  box-shadow: 0 2px 8px rgba(22,119,255,0.13);
}
.post-actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 20px;
  margin-top: 14px;
  font-size: 15px;
  color: #666;
  padding: 0 20px 16px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 3px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 6px;
  padding: 4px;
  min-width: 32px;
  height: 32px;
}

.action-btn i {
  font-size: 18px;
}

.count-text {
  font-size: 15px;
  color: #666;
  font-weight: 500;
  min-width: 20px;
}

.follow-btn .action-btn {
  display: inline-flex;
  padding: 4px 10px;
}

.follow-btn .action-btn i {
  margin-right: 4px;
}
.action-btn:hover {
  color: #1677ff;
  background: #f4f8ff;
}

.debug-info {
  font-size: 10px;
  color: #999;
  margin-left: 5px;
  background: #f5f5f5;
  padding: 0 4px;
  border-radius: 2px;
  display: none; /* 默认隐藏调试信息 */
}

/* 三点菜单样式 */
.post-menu {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.post-menu:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.post-menu i {
  font-size: 16px;
  color: #606266;
}

/* 视频预览器样式 - 完全自定义以避免影响页面其他元素 */
.video-viewer-container {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2000;
  height: 100%;
  overflow: hidden;
}

.video-viewer-wrapper {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
}

.video-viewer-mask {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 1;
  background: rgba(0, 0, 0, 0.7);
}

.video-viewer-btn {
  position: absolute;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  opacity: 0.8;
  box-sizing: border-box;
  user-select: none;
  cursor: pointer;
  width: 44px;
  height: 44px;
  font-size: 24px;
  color: #fff;
  background-color: rgb(0, 0, 0, 0.5);
  border: 2px solid transparent;
}

.video-viewer-btn:hover {
  opacity: 1;
}

.video-viewer-close {
  top: 40px;
  right: 40px;
  width: 40px;
  height: 40px;
  font-size: 40px;
  border-color: transparent;
  background: transparent;
}

.video-viewer-btn i {
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.video-viewer-btn svg {
  display: inline-block;
  width: 1em;
  height: 1em;
  fill: currentColor;
  vertical-align: middle;
}

.video-viewer-btn-group {
  position: absolute;
  right: 30px;
  bottom: 30px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.video-viewer-canvas {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.video-viewer-img {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
  display: block;
  margin: 0 auto;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}
</style>
