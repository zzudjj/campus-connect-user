<template>
  <div class="edit-profile-page">
    <div class="edit-container">
      <el-card class="edit-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <h2>编辑个人资料</h2>
          </div>
        </template>
        
        <el-form :model="userForm" :rules="rules" ref="formRef" label-width="100px" class="edit-form">
          <el-form-item label="头像" prop="avatarUrl">
            <div class="avatar-upload">
              <el-avatar :size="80" :src="userForm.avatarUrl || '/default-avatar.png'" class="avatar-preview" />
              <el-upload
                class="avatar-uploader"
                action="/upload"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
              >
                <el-button type="primary" size="small">更换头像</el-button>
              </el-upload>
            </div>
          </el-form-item>
          
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="userForm.nickname" placeholder="输入昵称" />
          </el-form-item>
          
          <el-form-item label="邮箱">
            <el-input v-model="userForm.email" disabled />
            <small>邮箱不可修改</small>
          </el-form-item>
          
          <el-form-item label="学校" prop="school">
            <el-input v-model="userForm.school" placeholder="输入学校名称" />
          </el-form-item>
          
          <el-form-item label="院系" prop="department">
            <el-input v-model="userForm.department" placeholder="输入院系名称" />
          </el-form-item>
          
          <template v-if="userForm.authStatus !== 1">
            <el-form-item label="认证状态">
              <el-tag v-if="userForm.authStatus === 2" type="warning">认证中</el-tag>
              <el-tag v-else type="info">未认证</el-tag>
              <div v-if="userForm.authStatus === 0" class="verification-info">
                <p>认证校园身份可以获得更多权限</p>
                <router-link to="/verification">
                  <el-button type="primary" size="small">前往认证</el-button>
                </router-link>
              </div>
            </el-form-item>
          </template>
          
          <el-form-item>
            <el-button type="primary" @click="submitForm">保存修改</el-button>
            <el-button @click="goBack">返回</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getUserProfile, updateUser } from '@/api/user';

const router = useRouter();
const formRef = ref(null);
const loading = ref(false);

// 用户表单数据
const userForm = reactive({
  userId: '',
  nickname: '',
  email: '',
  avatarUrl: '',
  school: '',
  department: '',
  authStatus: 0,
});

// 表单验证规则
const rules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度应为2-20个字符', trigger: 'blur' }
  ]
};

// 获取用户信息
const fetchUserProfile = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      ElMessage.error('未登录，请先登录');
      router.push('/login');
      return;
    }
    
    const res = await getUserProfile(token);
    if (res.code === 200 && res.data) {
      // 填充表单数据
      Object.assign(userForm, {
        userId: res.data.userId,
        nickname: res.data.nickname,
        email: res.data.email,
        avatarUrl: res.data.avatarUrl,
        school: res.data.school,
        department: res.data.department,
        authStatus: res.data.authStatus
      });
    } else {
      ElMessage.error(res.message || '获取个人信息失败');
      router.push('/profile');
    }
  } catch (error) {
    console.error('获取个人信息失败:', error);
    ElMessage.error('获取个人信息失败，请重试');
    router.push('/profile');
  } finally {
    loading.value = false;
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      return false;
    }
    
    loading.value = true;
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        userId: userForm.userId,
        nickname: userForm.nickname,
        avatarUrl: userForm.avatarUrl,
        school: userForm.school,
        department: userForm.department,
      };
      
      const res = await updateUser(updateData, token);
      if (res.code === 200) {
        ElMessage.success('资料更新成功');
        // 更新成功后返回个人资料页
        router.push('/user');
      } else {
        ElMessage.error(res.message || '资料更新失败');
      }
    } catch (error) {
      console.error('更新个人资料失败:', error);
      ElMessage.error('更新个人资料失败，请重试');
    } finally {
      loading.value = false;
    }
  });
};

// 头像上传成功后的处理
const handleAvatarSuccess = (res) => {
  // 这里需要根据实际上传API的返回格式调整
  if (res.code === 200 && res.data) {
    userForm.avatarUrl = res.data.url;
    ElMessage.success('头像上传成功');
  } else {
    ElMessage.error(res.message || '头像上传失败');
  }
};

// 头像上传前的验证
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;
  
  if (!isImage) {
    ElMessage.error('头像必须是图片格式!');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!');
    return false;
  }
  return true;
};

// 返回上一页
const goBack = () => {
  router.push('/user');
};

// 页面加载时获取用户信息
onMounted(() => {
  fetchUserProfile();
});
</script>

<style scoped>
.edit-profile-page {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 15px;
}

.edit-card {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-form {
  margin-top: 20px;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.avatar-preview {
  margin-bottom: 10px;
}

.verification-info {
  margin-top: 10px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .edit-profile-page {
    margin: 10px auto;
  }
  
  .el-form-item {
    margin-bottom: 15px;
  }
}
</style>
