<!-- 发布动态页面组件 -->
<template>
  <div class="post-container">
    <!-- 顶部导航栏 -->
    <el-page-header @back="goBack" content="发布动态" class="navbar">
      <template #extra>
        <el-button type="primary" :disabled="!canPublish" :loading="publishing" @click="handlePublish">发布</el-button>
      </template>
    </el-page-header>
    
    <!-- 内容编辑区 -->
    <div class="post-editor">
      <el-form>
        <el-form-item>
          <el-input
            v-model="postTitle"
            placeholder="标题(必填)"
            maxlength="50"
            show-word-limit
            class="title-input"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="postContent"
            type="textarea"
            :rows="6"
            maxlength="2000"
            show-word-limit
            placeholder="分享你的校园生活..."
            class="content-input"
          />
        </el-form-item>
        <el-form-item>
          <el-upload
            class="image-uploader"
            action=""
            :auto-upload="false"
            list-type="picture-card"
            :limit="9"
            :on-change="handleFileChange"
            :on-remove="removeImage"
            :file-list="imageList"
            :show-file-list="true"
            :before-upload="() => false"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">最多上传9张图片</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 底部工具栏 -->
    <div class="toolbar">
      <el-tooltip content="添加位置" placement="top">
        <el-button circle plain><el-icon><Location /></el-icon></el-button>
      </el-tooltip>
      <el-tooltip content="添加话题" placement="top">
        <el-button circle plain><el-icon><CollectionTag /></el-icon></el-button>
      </el-tooltip>
      <el-tooltip content="@好友" placement="top">
        <el-button circle plain><el-icon><User /></el-icon></el-button>
      </el-tooltip>
      <el-tooltip content="添加音乐" placement="top">
        <el-button circle plain><el-icon><Headset /></el-icon></el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { createPost } from '../api/post';
import { ElMessage } from 'element-plus';
import { Plus, Location, CollectionTag, User, Headset } from '@element-plus/icons-vue';

const router = useRouter();
const postTitle = ref('');
const postContent = ref('');
const imageList = ref([]);
const publishing = ref(false);

const canPublish = computed(() => {
  return postTitle.value.trim().length > 0 && (postContent.value.trim().length > 0 || imageList.value.length > 0);
});

const goBack = () => {
  router.go(-1);
};

const handleFileChange = (file, fileList) => {
  imageList.value = fileList;
};

const removeImage = (file, fileList) => {
  imageList.value = fileList;
};

const handlePublish = async () => {
  if (!canPublish.value) return;
  publishing.value = true;
  try {
    // 实际项目应先上传图片，简化处理
    const res = await createPost({
      title: postTitle.value,
      content: postContent.value,
      visibility: 0, // 默认公开
      images: imageList.value.map(f => f.url || f.response?.url || '')
    });
    ElMessage.success('发布成功');
    router.push('/home');
  } catch (error) {
    console.error('发布失败:', error);
    ElMessage.error('发布失败，请稍后再试');
  } finally {
    publishing.value = false;
  }
};
</script>

<style scoped>
.post-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

/* 顶部导航栏 */
.navbar {
  border-bottom: 1px solid var(--el-border-color-light);
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  border-radius: 0 0 12px 12px;
}

/* 内容编辑区 */
.post-editor {
  flex: 1;
  padding: 24px 18px 0 18px;
  overflow-y: auto;
}

.title-input {
  margin-bottom: 12px;
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}

.content-input {
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}

/* 图片上传区 */
.image-uploader {
  margin-top: 12px;
}

/* 底部工具栏 */
.toolbar {
  display: flex;
  gap: 18px;
  padding: 16px 24px;
  border-top: 1px solid var(--el-border-color-light);
  background: #fff;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.03);
}
</style>
