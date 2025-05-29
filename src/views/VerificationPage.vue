<template>
  <div class="page-wrapper">
    <div class="verification-fullpage">
      <div class="verification-container">
        <div class="verification-header">
          <div class="back-button" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回主页</span>
          </div>
          <h2>校园卡认证</h2>
        </div>

        <div class="verification-content">
          <el-card class="verification-card">
        <div class="card-header">
          <div class="step-icon">
            <el-icon><InfoFilled /></el-icon>
          </div>
          <div class="step-info">
            <h3>认证说明</h3>
            <p>校园卡认证可以提高您的账号可信度，获得更多校园功能的使用权限。</p>
          </div>
        </div>

        <el-steps :active="currentStep" finish-status="success" simple>
          <el-step title="上传校园卡照片" />
          <el-step title="提交审核" />
        </el-steps>

        <!-- 步骤1：上传校园卡照片 -->
        <div v-if="currentStep === 0" class="step-content">
          <div class="card-title">请上传校园卡正反面照片</div>
          
          <!-- 正面照片上传 -->
          <div class="upload-section">
            <div class="upload-label">校园卡正面照片<span class="required">*</span></div>
            <div v-if="!frontCardImageUrl" class="upload-area">
              <el-upload
                class="card-uploader"
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleFrontCardImageChange"
              >
                <div class="upload-placeholder">
                  <el-icon class="upload-icon"><Plus /></el-icon>
                  <div class="upload-text">点击上传校园卡正面照片</div>
                  <div class="upload-hint">请上传清晰的校园卡正面照片，保证姓名、学号等信息清晰可见</div>
                </div>
              </el-upload>
            </div>
            <div v-else class="preview-area">
              <img :src="frontCardImageUrl" class="preview-image" />
              <div class="preview-actions">
                <el-button type="primary" @click="reuploadFrontImage">重新上传</el-button>
              </div>
            </div>
          </div>
          
          <!-- 反面照片上传 -->
          <div class="upload-section">
            <div class="upload-label">校园卡反面照片<span class="required">*</span></div>
            <div v-if="!backCardImageUrl" class="upload-area">
              <el-upload
                class="card-uploader"
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleBackCardImageChange"
              >
                <div class="upload-placeholder">
                  <el-icon class="upload-icon"><Plus /></el-icon>
                  <div class="upload-text">点击上传校园卡反面照片</div>
                  <div class="upload-hint">请上传清晰的校园卡反面照片</div>
                </div>
              </el-upload>
            </div>
            <div v-else class="preview-area">
              <img :src="backCardImageUrl" class="preview-image" />
              <div class="preview-actions">
                <el-button type="primary" @click="reuploadBackImage">重新上传</el-button>
              </div>
            </div>
          </div>

          <div class="step-actions">
            <el-button type="primary" @click="nextStep" :disabled="!frontCardImageUrl || !backCardImageUrl">下一步</el-button>
          </div>
        </div>

        <!-- 步骤2：提交审核 -->
        <div v-if="currentStep === 1" class="step-content">
          <div class="review-section">
            <h3>认证信息确认</h3>
            <div class="review-item">
              <div class="review-label">校园卡正面照片：</div>
              <div class="review-content">
                <img :src="frontCardImageUrl" class="review-image" />
              </div>
            </div>
            <div class="review-item">
              <div class="review-label">校园卡反面照片：</div>
              <div class="review-content">
                <img :src="backCardImageUrl" class="review-image" />
              </div>
            </div>
          </div>

          <div class="privacy-agreement">
            <el-checkbox v-model="privacyAgreed">我同意提交以上信息用于校园卡认证，并保证信息真实有效。</el-checkbox>
          </div>

          <div class="step-actions">
            <el-button @click="prevStep">上一步</el-button>
            <el-button type="primary" @click="submitVerification" :disabled="!privacyAgreed" :loading="submitting">
              提交认证
            </el-button>
          </div>
        </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, InfoFilled, Plus } from '@element-plus/icons-vue';
import { uploadFile } from '../api/upload';
import { uploadStudentCard } from '../api/user';

const router = useRouter();
const currentStep = ref(0);
const frontCardImageUrl = ref('');
const backCardImageUrl = ref('');
const frontCardImageFile = ref(null);
const backCardImageFile = ref(null);
const privacyAgreed = ref(false);
const submitting = ref(false);

// 返回上一页
const goBack = () => {
  router.go(-1);
};

// 处理校园卡正面图片上传
const handleFrontCardImageChange = (file) => {
  // 图片类型检查
  const isImage = file.raw.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('请上传图片文件');
    return;
  }

  // 图片大小检查 (限制为5MB)
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB');
    return;
  }

  // 将图片文件转换为Base64用于预览
  const reader = new FileReader();
  reader.onload = (e) => {
    frontCardImageUrl.value = e.target.result;
  };
  reader.readAsDataURL(file.raw);
  
  // 保存图片文件用于后续上传
  frontCardImageFile.value = file.raw;
};

// 处理校园卡反面图片上传
const handleBackCardImageChange = (file) => {
  // 图片类型检查
  const isImage = file.raw.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('请上传图片文件');
    return;
  }

  // 图片大小检查 (限制为5MB)
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB');
    return;
  }

  // 将图片文件转换为Base64用于预览
  const reader = new FileReader();
  reader.onload = (e) => {
    backCardImageUrl.value = e.target.result;
  };
  reader.readAsDataURL(file.raw);
  
  // 保存图片文件用于后续上传
  backCardImageFile.value = file.raw;
};

// 重新上传正面图片
const reuploadFrontImage = () => {
  frontCardImageUrl.value = '';
  frontCardImageFile.value = null;
};

// 重新上传反面图片
const reuploadBackImage = () => {
  backCardImageUrl.value = '';
  backCardImageFile.value = null;
};

// 上一步
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

// 下一步
const nextStep = () => {
  currentStep.value++;
};

// 提交校园卡认证
const submitVerification = async () => {
  if (!privacyAgreed.value) {
    ElMessage.warning('请先同意信息使用协议');
    return;
  }

  submitting.value = true;

  try {
    // 步骤1：上传正面图片获取URL
    const frontUploadResponse = await uploadFile(frontCardImageFile.value);

    if (frontUploadResponse.code !== 200) {
      throw new Error('正面图片上传失败: ' + frontUploadResponse.message);
    }

    const frontImageUrl = frontUploadResponse.data;

    // 步骤2：上传反面图片获取URL
    const backUploadResponse = await uploadFile(backCardImageFile.value);

    if (backUploadResponse.code !== 200) {
      throw new Error('反面图片上传失败: ' + backUploadResponse.message);
    }

    const backImageUrl = backUploadResponse.data;

    // 提交校园卡认证信息
    const verificationData = {
      beforeCardUrl: frontImageUrl,
      afterCardUrl: backImageUrl
    };

    const verificationResponse = await uploadStudentCard(verificationData);

    if (verificationResponse.code === 200) {
      ElMessageBox.alert(
        '您的校园卡认证信息已提交成功！工作人员将在1-3个工作日内完成审核。',
        '认证信息已提交',
        {
          confirmButtonText: '确定',
          callback: () => {
            router.push('/user');
          }
        }
      );
    } else {
      throw new Error('认证信息提交失败: ' + verificationResponse.message);
    }
  } catch (error) {
    console.error('认证提交过程出错:', error);
    ElMessage.error(error.message || '提交认证信息时发生错误，请稍后重试');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.page-wrapper {
  height: 100vh;
  width: 100%;
  overflow-y: auto; /* 主页面滚动条 */
  background-color: #f5f7fa;
}

.verification-fullpage {
  min-height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 20px 0 100px 0; /* 底部增加空间确保提交按钮可见 */
  margin: 0;
  box-sizing: border-box;
}

.verification-container {
  padding: 20px;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}

.verification-header {
  display: flex;
  align-items: center;
  margin-bottom: 40px;
  position: relative;
}

.back-button {
  position: absolute;
  left: 0;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #409EFF;
  font-size: 14px;
}

.back-button .el-icon {
  margin-right: 4px;
}

.verification-header h2 {
  margin: 0 auto;
  font-size: 20px;
  color: #303133;
  font-weight: 600;
}

.verification-content {
  padding: 15px;
  margin-top: 20px;
}

.verification-card {
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  height: auto;
}

.card-header {
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.step-icon {
  margin-right: 10px;
  color: #409eff;
}

.step-content {
  margin-top: 20px;
}

.step-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
}

.step-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.step-content {
  margin-top: 30px;
}

.upload-section, .preview-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.upload-area {
  width: 100%;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 15px;
}

.upload-area:hover {
  border-color: #409eff;
}

.upload-icon {
  font-size: 36px;
  color: #c0c4cc;
  margin-bottom: 10px;
}

.upload-text {
  color: #606266;
  margin-bottom: 10px;
}

.upload-tip {
  color: #909399;
  font-size: 12px;
}

.preview-container {
  margin: 15px 0;
  display: flex;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 200px; /* 减小图片预览高度 */
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.step-actions {
  margin-top: 20px;
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.review-section {
  background-color: #F8F9FB;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.review-section h3 {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.review-item {
  display: flex;
  margin-bottom: 12px;
}

.review-label {
  min-width: 110px;
  font-weight: 500;
  color: #606266;
}

.review-content {
  flex: 1;
}

.review-image {
  max-width: 100%;
  max-height: 150px;
  border-radius: 4px;
}

.privacy-agreement {
  margin: 10px 0;
  color: #606266;
  font-size: 13px;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .verification-container {
    padding: 15px;
  }

  .review-item {
    flex-direction: column;
  }

  .review-label {
    width: 100%;
    margin-bottom: 4px;
  }

  .step-actions {
    flex-direction: column;
    gap: 10px;
  }

  .step-actions .el-button {
    width: 100%;
  }
}
</style>
