<!-- 发布动态弹窗组件 -->
<template>
  <div class="modal-mask" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <div class="modal-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </div>
        <h3>发布动态</h3>
        <button 
          class="btn-publish" 
          :class="{ 'active': canPublish }"
          :disabled="!canPublish"
          @click="publishPost"
        >
          发布
        </button>
      </div>
      
      <div class="modal-body">
        <!-- 用户信息 -->
        <div class="user-info">
          <img :src="userAvatar" alt="avatar" class="avatar" />
          <span class="username">{{ username }}</span>
        </div>
        
        <!-- 内容输入框 -->
        <div class="content-input">
          <textarea 
            v-model="postContent" 
            placeholder="分享你的校园生活..." 
            maxlength="2000"
          ></textarea>
          <div class="word-count">{{ postContent.length }}/2000</div>
        </div>
        
        <!-- 标签选择区 -->
        <div class="tag-selection">
          <div class="section-title">选择标签 <span class="required">*</span> <span class="tag-hint">(最少1个，最多8个)</span></div>
          <div class="tags-container" v-if="!tagsLoading">
            <div 
              v-for="tag in availableTags" 
              :key="tag.tagId" 
              class="tag-item" 
              :class="{ 'selected': isTagSelected(tag.tagId) }"
              @click="toggleTag(tag)"
            >
              {{ tag.name }}
            </div>
            <div v-if="availableTags.length === 0" class="no-tags">暂无可用标签</div>
          </div>
          <div class="tags-loading" v-else>正在加载标签...</div>
          <div class="selected-tags" v-if="selectedTags.length > 0">
            <div class="section-subtitle">已选择 ({{ selectedTags.length }}/8):</div>
            <div class="selected-tags-list">
              <div 
                v-for="tag in selectedTagObjects" 
                :key="tag.tagId" 
                class="selected-tag"
              >
                {{ tag.name }}
                <span class="remove-tag" @click.stop="removeTag(tag.tagId)">×</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 图片预览区 -->
        <div class="media-preview" v-if="images.length > 0">
          <div class="section-title">图片</div>
          <div class="preview-grid" :class="{ 'single': images.length === 1 }">
            <div 
              v-for="(img, index) in images" 
              :key="index" 
              class="preview-item"
            >
              <img :src="img.url" alt="preview" />
              <div class="remove-btn" @click="removeImage(index)">
                <i class="fas fa-times"></i>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 视频预览区 -->
        <div class="media-preview" v-if="videos.length > 0">
          <div class="section-title">视频</div>
          <div class="video-preview">
            <div 
              v-for="(video, index) in videos" 
              :key="index" 
              class="preview-item video-item"
            >
              <video controls>
                <source :src="video.url" :type="video.file.type">
                您的浏览器不支持视频标签。
              </video>
              <div class="remove-btn" @click="removeVideo(index)">
                <i class="fas fa-times"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 底部工具栏 -->
      <div class="modal-footer">
        <div class="tools">
          <div class="tool-item" @click="triggerImageUpload" :class="{ 'disabled': hasVideo }" :title="hasVideo ? '已有视频，不能再上传图片' : '上传图片（最多9张）'">
            <i class="far fa-image"></i>
            <input 
              type="file" 
              ref="imageInput" 
              multiple 
              accept="image/*" 
              style="display: none;"
              @change="handleImageChange" 
            />
          </div>
          <div class="tool-item" @click="triggerVideoUpload" :class="{ 'disabled': hasImages }" :title="hasImages ? '已有图片，不能再上传视频' : '上传视频（最多1个）'">
            <i class="fas fa-video"></i>
            <input 
              type="file" 
              ref="videoInput" 
              accept="video/*" 
              style="display: none;"
              @change="handleVideoChange" 
            />
          </div>
          <div class="tool-item emoji-button" @click="handleEmojiClick">
            <i class="fas fa-smile"></i>
            <!-- 表情面板 -->
            <div v-if="showEmojiPanel" class="emoji-panel" ref="emojiPanelRef">
              <div class="emoji-grid">
                <div 
                  v-for="(emoji, index) in emojis" 
                  :key="index"
                  class="emoji-item"
                  @click.stop="insertEmoji(emoji)"
                >
                  {{ emoji }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="visibility" @click="toggleVisibilityDropdown">
          <span>{{ visibilityOptions[selectedVisibility] }}</span>
          <i class="fas fa-chevron-down"></i>
          <div v-if="showVisibilityDropdown" class="visibility-dropdown">
            <div 
              v-for="(name, index) in visibilityOptions" 
              :key="index"
              class="visibility-option"
              :class="{ 'selected': selectedVisibility === index }"
              @click.stop="selectVisibility(index)"
            >
              {{ name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { createPost, uploadPostMedia } from '../../api/post';
import { getAllTags, addTagsToPost } from '../../api/tag';
import { ElMessage, ElLoading } from 'element-plus';

const emit = defineEmits(['close', 'success']);

// 从用户存储中获取用户信息
import { useUserStore } from '../../stores/user';
const userStore = useUserStore();

// 用户信息
const userAvatar = computed(() => userStore.userInfo?.avatarUrl || '');
const username = computed(() => userStore.userInfo?.nickname || '用户');

// 发布内容
const postContent = ref('');
const images = ref([]);
const videos = ref([]);
const imageInput = ref(null);
const videoInput = ref(null);

// 加载状态
const loading = ref(false);

// 可见性设置
const visibilityOptions = ['公开', '朋友可见'];
const selectedVisibility = ref(0); // 默认公开
const showVisibilityDropdown = ref(false);

// 计算属性
const hasImages = computed(() => images.value.length > 0);
const hasVideo = computed(() => videos.value.length > 0);

// 是否可以发布 - 需要至少有内容/媒体文件，并且至少选择一个标签
const canPublish = computed(() => {
  const hasContent = postContent.value.trim().length > 0;
  const hasMedia = hasImages.value || hasVideo.value;
  const hasSelectedTags = selectedTags.value.length > 0;
  
  return (hasContent || hasMedia) && hasSelectedTags;
});

// 标签相关变量
const availableTags = ref([]);
const selectedTags = ref([]);
const tagsLoading = ref(false);

// 计算属性 - 获取已选标签的完整对象
const selectedTagObjects = computed(() => {
  return selectedTags.value.map(tagId => {
    return availableTags.value.find(tag => tag.tagId === tagId);
  }).filter(tag => tag !== undefined);
});

// 加载标签
const loadTags = async () => {
  tagsLoading.value = true;
  try {
    const response = await getAllTags();
    if (response.code === 200) {
      availableTags.value = response.data;
    } else {
      ElMessage.error('加载标签失败');
    }
  } catch (error) {
    console.error('加载标签失败:', error);
    ElMessage.error('加载标签失败');
  } finally {
    tagsLoading.value = false;
  }
};

// 检查标签是否已选择
const isTagSelected = (tagId) => {
  return selectedTags.value.includes(tagId);
};

// 切换标签选择状态
const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag.tagId);
  if (index === -1) {
    // 限制最多选择8个标签
    if (selectedTags.value.length >= 8) {
      ElMessage.warning('最多只能选择8个标签');
      return;
    }
    selectedTags.value.push(tag.tagId);
  } else {
    selectedTags.value.splice(index, 1);
  }
};

// 移除选中的标签
const removeTag = (tagId) => {
  const index = selectedTags.value.indexOf(tagId);
  if (index !== -1) {
    selectedTags.value.splice(index, 1);
  }
};

// 选择图片
const triggerImageUpload = () => {
  if (hasVideo.value) {
    ElMessage.warning('已有视频，不能再上传图片');
    return;
  }
  imageInput.value.click();
};

// 处理图片选择
const handleImageChange = (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  // 限制最多9张图片
  const remainSlots = 9 - images.value.length;
  if (remainSlots <= 0) {
    ElMessage.warning('最多上传9张图片');
    return;
  }
  
  const filesToProcess = Array.from(files).slice(0, remainSlots);
  
  filesToProcess.forEach(file => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.warning('只能上传图片文件');
      return;
    }
    
    // 创建本地预览URL
    const url = URL.createObjectURL(file);
    images.value.push({
      file,
      url
    });
  });
  
  // 重置文件输入以便再次选择相同文件
  event.target.value = '';
};

// 选择视频
const triggerVideoUpload = () => {
  if (hasImages.value) {
    ElMessage.warning('已有图片，不能再上传视频');
    return;
  }
  videoInput.value.click();
};

// 常用表情集合
const emojis = [
  '😀', '😁', '😂', '😃', '😄', '😅', '😆',
  '😉', '😊', '😋', '😎', '😍', '😘', '😗',
  '😙', '😚', '🙂', '🥰', '😇', '🙃', '😏',
  '😌', '😒', '😜', '😝', '😞', '😔', '😢',
  '😣', '😤', '😥', '😨', '😪', '😭', '😱',
  '😳', '😵', '😶', '😕', '😟', '😫', '😬'
];

// 表情面板显示状态
const showEmojiPanel = ref(false);
const emojiPanelRef = ref(null);

// 处理表情按钮点击
const handleEmojiClick = () => {
  showEmojiPanel.value = !showEmojiPanel.value;
};

// 插入表情
const insertEmoji = (emoji) => {
  postContent.value += emoji;
  showEmojiPanel.value = false;
};

// 点击外部关闭表情面板
const closeEmojiPanel = (event) => {
  if (showEmojiPanel.value && emojiPanelRef.value && !emojiPanelRef.value.contains(event.target)) {
    const emojiButton = document.querySelector('.tool-item.emoji-button');
    if (emojiButton && !emojiButton.contains(event.target)) {
      showEmojiPanel.value = false;
    }
  }
};

// 处理视频选择
const handleVideoChange = (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  // 只允许上传1个视频
  if (videos.value.length >= 1) {
    ElMessage.warning('只能上传一个视频');
    return;
  }
  
  const file = files[0];
  
  // 检查文件类型
  if (!file.type.startsWith('video/')) {
    ElMessage.warning('只能上传视频文件');
    return;
  }
  
  // 创建本地预览URL
  const url = URL.createObjectURL(file);
  videos.value.push({
    file,
    url
  });
  
  // 重置文件输入以便再次选择相同文件
  event.target.value = '';
};

// 移除图片
const removeImage = (index) => {
  // 释放预览URL以避免内存泄漏
  URL.revokeObjectURL(images.value[index].url);
  // 从数组中移除
  images.value.splice(index, 1);
};

// 移除视频
const removeVideo = (index) => {
  // 释放预览URL以避免内存泄漏
  URL.revokeObjectURL(videos.value[index].url);
  // 从数组中移除
  videos.value.splice(index, 1);
};

// 切换可见性下拉菜单的显示状态
const toggleVisibilityDropdown = () => {
  showVisibilityDropdown.value = !showVisibilityDropdown.value;
  // 不需要手动调整下拉菜单位置，使用CSS定位
};

// 选择可见性级别
const selectVisibility = (index) => {
  selectedVisibility.value = index;
  showVisibilityDropdown.value = false;
};

// 发布动态
const publishPost = async () => {
  if (!canPublish.value) return;
  
  // 检查是否至少选择了一个标签
  if (selectedTags.value.length === 0) {
    ElMessage.warning('请至少选择一个标签');
    return;
  }
  
  // 收集发布数据
  const content = postContent.value;
  const visibility = selectedVisibility.value;
  const imagesList = [...images.value];
  const videosList = [...videos.value];
  const tagsList = [...selectedTags.value];
  
  // 先关闭弹窗，提升用户体验
  emit('close');
  
  // 显示上传进度提示
  const loadingMessage = ElMessage({
    type: 'info',
    message: '正在提交您的动态...',
    duration: 0,
    showClose: true
  });
  
  try {
    // 步骤1：创建动态
    const createResponse = await createPost({
      content: content,
      visibility: visibility
    });
    
    if (createResponse.code !== 200) {
      loadingMessage.close();
      ElMessage.error(createResponse.message || '发布失败');
      return;
    }
    
    const postId = createResponse.data;
    
    // 步骤2：上传媒体文件
    const mediaUploadTasks = [];
    
    // 上传图片
    for (const img of imagesList) {
      mediaUploadTasks.push(
        uploadPostMedia(img.file, postId, 0) // 0表示图片
      );
    }
    
    // 上传视频
    for (const video of videosList) {
      mediaUploadTasks.push(
        uploadPostMedia(video.file, postId, 1) // 1表示视频
      );
    }
    
    // 如果有媒体文件需要上传，等待所有上传任务完成
    if (mediaUploadTasks.length > 0) {
      await Promise.all(mediaUploadTasks);
    }
    
    // 步骤3：添加标签
    await addTagsToPost(postId, tagsList);
    
    // 全部成功，关闭进度提示并显示成功消息
    loadingMessage.close();
    ElMessage.success('动态发布成功');
    emit('success');
    
  } catch (error) {
    console.error('发布失败:', error);
    loadingMessage.close();
    ElMessage.error(error.message || '发布失败，请稍后再试');
  }
};

// 组件挂载时加载标签并添加点击事件
onMounted(() => {
  // 加载标签数据
  loadTags();
  
  // 添加全局点击事件处理器，关闭各种下拉菜单
  const handleClickOutside = (event) => {
    // 处理可见性下拉菜单
    if (showVisibilityDropdown.value) {
      const visibilityElement = document.querySelector('.visibility');
      if (visibilityElement && !visibilityElement.contains(event.target)) {
        showVisibilityDropdown.value = false;
      }
    }
    
    // 处理表情面板
    closeEmojiPanel(event);
  };
  
  document.addEventListener('click', handleClickOutside);
  
  // 组件卸载时移除事件监听器
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
});

// 关闭弹窗
const closeModal = () => {
  if (canPublish.value) {
    if (confirm('内容尚未发布，确定要离开吗？')) {
      emit('close');
    }
  } else {
    emit('close');
  }
};
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease;
}

.modal-container {
  position: relative;
  width: 580px;
  max-height: 90vh;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.modal-close {
  margin-right: auto;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
}

.modal-close:hover {
  color: #333;
}

.modal-header h3 {
  flex: 1;
  font-size: 18px;
  font-weight: 500;
  text-align: center;
}

.btn-publish {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  background-color: #ddd;
  color: #999;
  cursor: not-allowed;
  transition: all 0.2s ease;
}

.btn-publish.active {
  background-color: #1890ff;
  color: white;
  cursor: pointer;
}

.btn-publish.active:hover {
  background-color: #40a9ff;
}

.modal-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

.username {
  font-weight: 500;
}

/* 内容输入框 */
.content-input {
  position: relative;
  margin-bottom: 16px;
}

.content-input textarea {
  width: 100%;
  min-height: 120px;
  border: none;
  resize: none;
  font-size: 16px;
  line-height: 1.5;
  padding: 0;
}

.content-input textarea:focus {
  outline: none;
}

.word-count {
  position: absolute;
  bottom: 4px;
  right: 4px;
  font-size: 12px;
  color: #999;
}

/* 标题样式 */
.section-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
}

.section-subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.required {
  color: #f56c6c;
  margin-left: 4px;
}

.tag-hint {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
  font-weight: normal;
}

/* 标签区域 */
.tag-selection {
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  background-color: #f9fafb;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.tag-item {
  display: inline-flex;
  padding: 6px 12px;
  background-color: #f0f2f5;
  border-radius: 16px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-item:hover {
  background-color: #e4e7ed;
}

.tag-item.selected {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.selected-tags {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #ebeef5;
}

.selected-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background-color: #e6f7ff;
  border-radius: 16px;
  font-size: 14px;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.remove-tag {
  margin-left: 6px;
  font-size: 16px;
  cursor: pointer;
}

.tags-loading {
  padding: 20px 0;
  text-align: center;
  color: #909399;
}

.no-tags {
  padding: 20px 0;
  text-align: center;
  color: #909399;
}

/* 媒体预览区 */
.media-preview {
  margin-bottom: 20px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 8px;
}

.preview-grid.single {
  grid-template-columns: repeat(1, 1fr);
}

.preview-item {
  position: relative;
  padding-bottom: 100%;
}

.preview-item img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.video-preview {
  margin-top: 8px;
}

.video-item {
  padding-bottom: 56.25%; /* 16:9 比例 */
}

.video-item video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  background-color: #000;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

/* 底部工具栏 */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.tools {
  display: flex;
  gap: 16px;
}

.tool-item {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #1890ff;
}

.tool-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-item.disabled:hover {
  background-color: transparent;
  color: #666;
}

.visibility {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  cursor: pointer;
  position: relative;
}

.visibility-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  min-width: 120px;
  overflow: visible;
  transform: translateY(0);
}

.visibility-option {
  padding: 10px 16px;
  font-size: 14px;
  transition: all 0.2s;
  cursor: pointer;
}

.visibility-option:hover {
  background-color: #f5f7fa;
}

.visibility-option.selected {
  background-color: #e6f7ff;
  color: #1890ff;
}

/* 表情面板样式 */
.emoji-button {
  position: relative;
}

.emoji-panel {
  position: absolute;
  bottom: 45px;
  left: 0;
  width: 280px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 10px;
  z-index: 10000;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.emoji-item {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  height: 36px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.emoji-item:hover {
  background-color: #f0f2f5;
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
