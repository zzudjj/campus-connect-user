<template>
  <div class="auth-modal-overlay" v-if="dialogVisible" @click.self="handleClose">
    <div class="modal-container">
      <!-- 关闭按钮 -->
      <el-icon class="close-icon" @click="handleClose"><Close /></el-icon>
      
      <!-- Logo和标题 -->
      <div class="modal-header">
        <div class="hexagon-logo">
          <svg width="60" height="60" viewBox="0 0 60 60">
            <polygon 
              points="30,4 56,18 56,42 30,56 4,42 4,18" 
              stroke="#1675e6" 
              stroke-width="2" 
              fill="transparent"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <h1 class="logo-text">Campus Connect</h1>
      </div>

      <div class="forms-container">
      <!-- 登录/注册/找回密码标签切换 -->
      <div class="auth-tabs" v-if="currentMode === 'login' || currentMode === 'register'">
        <span 
          :class="{'active-tab': currentMode === 'login'}"
          @click="switchMode('login')"
        >
          邮箱登录
        </span>
        <span 
          :class="{'active-tab': currentMode === 'register'}"
          @click="switchMode('register')"
        >
          注册账号
        </span>
      </div>
      
      <!-- 找回密码标题 -->
      <div class="auth-tabs" v-if="currentMode === 'forgot'">
        <span class="active-tab">找回密码</span>
      </div>
      
      <transition name="form-fade" mode="out-in">
        <!-- 邮箱登录表单 -->
        <div v-if="currentMode === 'login'" class="auth-form">
          <el-form :model="loginForm" ref="loginFormRef" :rules="loginRules" size="large" label-width="0">
            <!-- 邮箱 -->
            <el-form-item prop="email" class="input-item">
              <el-input 
                v-model="loginForm.email" 
                placeholder="请输入邮箱"
                clearable
                prefix-icon="Message"
              />
            </el-form-item>
            
            <!-- 密码 -->
            <el-form-item prop="passwordHash" class="input-item">
              <el-input 
                v-model="loginForm.passwordHash" 
                type="password" 
                placeholder="请输入密码"
                show-password
                prefix-icon="Lock"
              />
            </el-form-item>
            
            <!-- 图形验证码 -->
            <el-form-item prop="captcha" class="input-item">
              <div class="captcha-container">
                <el-input 
                  v-model="loginForm.captcha" 
                  placeholder="请输入验证码"
                  prefix-icon="Key"
                />
                <img 
                  :src="captchaImage" 
                  class="captcha-img" 
                  alt="验证码" 
                  @click="refreshCaptcha"
                  title="点击刷新验证码"
                />
              </div>
            </el-form-item>
            
            <div class="form-options">
              <el-checkbox v-model="rememberMe">记住我</el-checkbox>
              <a class="forget-link" @click.prevent="switchMode('forgot')">忘记密码？</a>
            </div>
            
            <el-button type="primary" class="submit-btn" @click="handleLogin" :loading="loading">
              登录
            </el-button>
            
            
          </el-form>
        </div>
        
        <!-- 注册表单 -->
        <div v-else-if="currentMode === 'register'" class="auth-form">
          <el-form :model="registerForm" ref="registerFormRef" :rules="registerRules" size="large" label-width="0">
            <!-- 邮箱 -->
            <el-form-item prop="email" class="input-item">
              <el-input 
                v-model="registerForm.email" 
                placeholder="请输入邮箱"
                clearable
                prefix-icon="Message"
              />
            </el-form-item>
            
            <!-- 昵称 -->
            <el-form-item prop="nickname" class="input-item">
              <el-input 
                v-model="registerForm.nickname" 
                placeholder="请输入昵称"
                clearable
                prefix-icon="User"
              />
            </el-form-item>
            
            <!-- 密码 -->
            <el-form-item prop="passwordHash" class="input-item">
              <el-input 
                v-model="registerForm.passwordHash" 
                type="password" 
                placeholder="请输入密码"
                show-password
                prefix-icon="Lock"
              />
            </el-form-item>
            
            <!-- 邮箱验证码 -->
            <el-form-item prop="emailCode" class="input-item">
              <div class="code-container">
                <el-input 
                  v-model="registerForm.emailCode" 
                  placeholder="请输入邮箱验证码"
                  prefix-icon="Key"
                />
                <el-button 
                  class="code-btn" 
                  type="primary" 
                  :disabled="codeSending || codeCountdown > 0"
                  @click="sendEmailCode"
                >
                  {{ codeCountdown > 0 ? `${codeCountdown}s后重发` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
            
            <el-button type="primary" class="submit-btn" @click="handleRegister" :loading="loading">
              注册
            </el-button>
            

          </el-form>
        </div>

        <!-- 忘记密码表单 -->
        <div v-else-if="currentMode === 'forgot'" class="auth-form forgot-form">
          <el-form :model="forgotForm" ref="forgotFormRef" :rules="forgotRules" size="large" label-width="0" @submit.prevent>
            <!-- 邮箱 -->
            <el-form-item prop="email" class="input-item">
              <el-input 
                v-model="forgotForm.email" 
                placeholder="请输入注册时的邮箱"
                clearable
                prefix-icon="Message"
              />
            </el-form-item>
            
            <!-- 重置码 -->
            <el-form-item prop="resetCode" class="input-item">
              <div class="code-container">
                <el-input 
                  v-model="forgotForm.resetCode" 
                  placeholder="请输入重置码"
                  prefix-icon="Key"
                />
                <el-button 
                  type="primary" 
                  class="code-btn"
                  :disabled="codeSending || codeCountdown > 0"
                  @click="sendResetCode"
                >
                  {{ codeCountdown > 0 ? `${codeCountdown}s后重发` : '获取重置码' }}
                </el-button>
              </div>
            </el-form-item>
            
            <!-- 新密码 -->
            <el-form-item prop="newPassword" class="input-item">
              <el-input 
                v-model="forgotForm.newPassword" 
                type="password" 
                placeholder="请输入新密码"
                show-password
                prefix-icon="Lock"
              />
            </el-form-item>
            
            <el-button type="primary" class="submit-btn" @click="handleResetPassword" :loading="loading">
              重置密码
            </el-button>
            
            <!-- 返回登录按钮 -->
            <div class="bottom-back-link">
              <button type="button" class="custom-back-btn" @click.prevent="switchMode('login')">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" fill="#1675e6"/>
                </svg>
                <span>返回登录</span>
              </button>
            </div>
          </el-form>
        </div>
      </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../../stores/user';
import { requestPasswordResetCode, verifyResetCode, resetPassword } from '../../api/auth';
import { generateCaptcha, verifyCaptcha } from '../../api/auth';
import { login } from '../../api/user';
import { sendEmailCode as sendEmailCodeAPI } from '../../api/register';
import axios from 'axios';
import { User, Lock, Message, Picture, Key, Close, ArrowLeft } from '@element-plus/icons-vue';

// 定义props和emits
const props = defineProps({
  isVisible: Boolean,
  initialMode: {
    type: String,
    default: 'login'
  }
});

const emit = defineEmits(['close', 'login-success', 'register-success']);
const userStore = useUserStore();

// 对话框可见性状态
const dialogVisible = ref(props.isVisible);

// 监听dialogVisible变化，在关闭时触发关闭事件
watch(dialogVisible, (newVal) => {
  if (!newVal) {
    emit('close');
  } else if (newVal && currentMode.value === 'login') {
    // 打开登录页面时自动获取验证码
    refreshCaptcha();
  }
});

// 监听props的变化
watch(() => props.isVisible, (newVal) => {
  dialogVisible.value = newVal;
  if (newVal) {
    document.body.style.overflow = 'hidden';
    // 每次打开模态框时刷新验证码
    if (currentMode.value === 'login') {
      refreshCaptcha();
    }
  } else {
    document.body.style.overflow = '';
  }
});

// 在组件挂载时初始化验证码
onMounted(() => {
  if (currentMode.value === 'login') {
    refreshCaptcha();
  }
});

// 当前模式：login, register, forgot
const currentMode = ref(props.initialMode);

// 记住我选项
const rememberMe = ref(false);

// 加载状态
const loading = ref(false);

// 表单引用
const loginFormRef = ref(null);
const registerFormRef = ref(null);
const forgotFormRef = ref(null);

// 验证码状态
const captchaId = ref('');
const captchaImage = ref('');
const codeCountdown = ref(0);
const codeSending = ref(false);
const countdownTimer = ref(null);

// 登录表单
const loginForm = reactive({
  email: '',
  passwordHash: '',
  captcha: '',
});

// 注册表单
const registerForm = reactive({
  email: '',
  nickname: '',
  passwordHash: '',
  emailCode: '',
});

// 忘记密码表单
const forgotForm = reactive({
  email: '',
  resetCode: '',
  newPassword: '',
  step: 1  // 添加step字段，用于跟踪密码重置过程的阶段
});

// 验证规则
const loginRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  passwordHash: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '验证码长度为4-6位', trigger: 'blur' }
  ]
};

const registerRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在2-20个字符之间', trigger: 'blur' }
  ],
  passwordHash: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  emailCode: [
    { required: true, message: '请输入邮箱验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '验证码长度为4-6位', trigger: 'blur' }
  ]
};

const forgotRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  resetCode: [
    { required: true, message: '请输入重置码', trigger: 'blur' },
    { min: 6, max: 6, message: '重置码长度为6位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ]
};

// 刷新图片验证码
const refreshCaptcha = async () => {
  try {
    console.log('刷新图片验证码');
    
    // 调用验证码生成API
    const response = await generateCaptcha();
    
    if (response.code === 200) {
      captchaId.value = response.data.captchaId;
      captchaImage.value = response.data.captchaImage;
      console.log('验证码加载成功');
    } else {
      ElMessage.error(response.message || '获取验证码失败');
    }
  } catch (error) {
    console.error('获取验证码错误:', error);
    ElMessage.error('获取验证码失败，请稍后重试');
  }
};

// 发送邮箱验证码
const sendEmailCode = async () => {
  console.log('当前邮箱值:', registerForm.email);
  
  if (!registerForm.email) {
    ElMessage.warning('请输入邮箱');
    return;
  }

  // 验证邮箱格式
  const emailPattern = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!emailPattern.test(registerForm.email)) {
    ElMessage.warning('请输入正确的邮箱格式');
    return;
  }

  // 避免重复发送
  if (codeSending.value || codeCountdown.value > 0) {
    return;
  }

  codeSending.value = true;
  
  try {
    console.log('准备发送验证码，邮箱:', registerForm.email);
    
    // 使用更新后的API函数发送JSON格式的数据
    const response = await sendEmailCodeAPI({ email: registerForm.email.trim() });
    console.log('验证码发送响应:', response);
    
    if (response.code === 200) {
      ElMessage.success(response.message || '验证码已发送到邮箱，有效期5分钟，请及时查收');
      codeCountdown.value = 60;
      const timer = setInterval(() => {
        codeCountdown.value--;
        if (codeCountdown.value <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    } else {
      ElMessage.error(response.message || '发送验证码失败');
    }
  } catch (error) {
    console.error('发送验证码失败:', error);
    ElMessage.error('发送验证码失败，请稍后重试');
  } finally {
    codeSending.value = false;
  }
};

// 发送密码重置验证码
const sendResetCode = async () => {
  if (!forgotForm.email) {
    ElMessage.warning('请输入邮箱');
    return;
  }

  // 验证邮箱格式
  const emailPattern = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!emailPattern.test(forgotForm.email)) {
    ElMessage.warning('请输入正确的邮箱格式');
    return;
  }

  // 避免重复发送
  if (codeSending.value || codeCountdown.value > 0) {
    return;
  }

  codeSending.value = true;
  
  try {
    const response = await requestPasswordResetCode({ email: forgotForm.email });
    
    if (response.code === 200) {
      ElMessage.success(response.message || '重置码已发送到邮箱，有效期5分钟，请及时查收');
      codeCountdown.value = 60;
      const timer = setInterval(() => {
        codeCountdown.value--;
        if (codeCountdown.value <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    } else {
      ElMessage.error(response.message || '发送重置码失败');
    }
    
    codeSending.value = false;
  } catch (error) {
    console.error('发送重置码失败:', error);
    ElMessage.error('发送重置码失败，请稍后重试');
    codeSending.value = false;
  }
};

// 处理忘记密码
const handleForgot = async () => {
  if (!forgotFormRef.value) return;
  
  await forgotFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      
      try {
        // 先验证重置码是否正确
        const verifyResponse = await verifyResetCode({
          email: forgotForm.email,
          code: forgotForm.resetCode
        });
        
        if (verifyResponse.code !== 200) {
          ElMessage.error(verifyResponse.data.message || '重置码验证失败');
          loading.value = false;
          return;
        }
        
        // 提交密码重置请求
        const resetResponse = await resetPassword({
          email: forgotForm.email,
          code: forgotForm.resetCode,
          newPassword: forgotForm.newPassword
        });
        
        if (resetResponse.code === 200) {
          ElMessage.success('密码重置成功，请使用新密码登录');
          switchMode('login');
        } else {
          ElMessage.error(resetResponse.message || '密码重置失败');
        }
        
        loading.value = false;
      } catch (error) {
        console.error('密码重置失败:', error);
        ElMessage.error('密码重置失败，请稍后重试');
        loading.value = false;
      }
    }
  });
};

// 关闭模态框
const handleClose = () => {
  dialogVisible.value = false;
};

// 密码重置函数
const handleResetPassword = async () => {
  if (!forgotFormRef.value) return;
  
  await forgotFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      
      try {
        // 直接提交密码重置请求，不需要先验证重置码
        // 服务端会在resetPassword方法中验证重置码
        const resetData = {
          email: forgotForm.email,
          code: forgotForm.resetCode,
          newPassword: forgotForm.newPassword
        };
        
        const response = await resetPassword(resetData);
        
        if (response.code === 200) {
          ElMessage.success(response.data || '密码重置成功，请使用新密码登录');
          switchMode('login');
        } else {
          ElMessage.error(response.message || '密码重置失败，请确认验证码是否正确');
        }
      } catch (error) {
        console.error('重置密码失败:', error);
        ElMessage.error('重置密码失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    }
  });
};

// 切换模式（登录/注册/忘记密码）
const switchMode = (mode) => {
  console.log('切换到模式:', mode);
  currentMode.value = mode;
  
  // 切换到登录模式时，刷新验证码
  if (mode === 'login') {
    refreshCaptcha();
  }
  
  // 重置表单
  if (mode === 'login' && loginFormRef.value) {
    loginFormRef.value.resetFields();
  } else if (mode === 'register' && registerFormRef.value) {
    registerFormRef.value.resetFields();
  } else if (mode === 'forgot' && forgotFormRef.value) {
    forgotFormRef.value.resetFields();
    // 重置忘记密码表单的阶段
    forgotForm.step = 1;
  }
};





// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      
      try {
        // 先验证图片验证码
        const captchaResponse = await verifyCaptcha({
          captchaId: captchaId.value,
          code: loginForm.captcha
        }).catch(error => {
          console.error('验证码验证错误:', error);
          return { code: 400, message: '验证码验证失败' };
        });
        
        if (captchaResponse.code !== 200) {
          ElMessage.error(captchaResponse.message || '验证码错误');
          refreshCaptcha(); // 刷新验证码
          return;
        }
        
        // 直接使用store的login方法处理登录
        const loginSuccess = await userStore.login({
          email: loginForm.email,
          passwordHash: loginForm.passwordHash
        });
        
        if (loginSuccess) {
          ElMessage.success('登录成功');
          emit('login-success');
          handleClose();
        } else {
          // 登录失败的情况下刷新验证码
          refreshCaptcha();
        }
      } catch (error) {
        console.error('登录失败:', error);
        ElMessage.error('登录失败，请检查邮箱和密码');
        refreshCaptcha(); // 刷新验证码
      } finally {
        loading.value = false;
      }
    }
  });
};

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return;
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        // 验证图片验证码（如果使用了图片验证码）
        if (registerForm.captcha) {
          const captchaResponse = await verifyCaptcha({
            captchaId: captchaId.value,
            code: registerForm.captcha
          }).catch(error => {
            console.error('验证码验证错误:', error);
            return { code: 400, message: '验证码验证失败' };
          });
          
          if (captchaResponse.code !== 200) {
            ElMessage.error(captchaResponse.message || '验证码错误');
            refreshCaptcha();
            return;
          }
        }
        
        // 直接调用注册接口，验证码在注册时一起验证
        // 按照API文档，需要发送user和request两个对象
        const result = await userStore.register(
          {
            email: registerForm.email,
            nickname: registerForm.nickname,
            passwordHash: registerForm.passwordHash
          },
          registerForm.emailCode // 传递验证码作为第二个参数
        );
        
        if (result) {
          ElMessage.success('注册成功，请登录');
          switchMode('login');
          emit('register-success');
        }
      } catch (error) {
        console.error('注册失败', error);
        ElMessage.error(error.response?.data?.message || '注册失败，请检查注册信息');
        refreshCaptcha(); // 刷新验证码
      } finally {
        loading.value = false;
      }
    }
  });
};

// 处理忘记密码
const handleForgotPassword = async () => {
  if (!forgotFormRef.value) return;
  
  await forgotFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        // 仅检查邮箱是否有效，不发送验证码
        // 验证码发送通过sendResetCode函数实现
        forgotForm.step = 2; // 进入输入验证码的步骤
        ElMessage.success('请点击发送验证码按钮获取重置码');
      } catch (error) {
        console.error('处理忘记密码失败', error);
        ElMessage.error('处理失败，请稍后再试');
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
/* 覆盖层样式 */
.auth-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* 超高的z-index值确保覆盖所有内容 */
  box-sizing: border-box;
  padding: 20px;
  /* 为确保全屏覆盖使用绝对定位 */
  position: absolute;
  inset: 0; /* 等同于top: 0; right: 0; bottom: 0; left: 0; */
}

/* 主容器样式 */
.modal-container {
  background-color: #f8faff;
  position: relative;
  padding: 30px;
  border-radius: 12px;
  width: 450px;
  height: 560px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 103, 201, 0.15);
  overflow: hidden;
}

/* 模态框标题 */
.modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
}

/* 六边形Logo */
.hexagon-logo {
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hexagon-logo svg {
  filter: drop-shadow(0 0 2px rgba(22, 117, 230, 0.2));
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: #1675e6;
  letter-spacing: 0.5px;
  margin: 0;
}

.modal-title {
  font-size: 16px;
  font-weight: 500;
  color: #555;
  margin: 0 0 10px 0;
  text-align: center;
}

.modal-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.form-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin: 15px 0;
  text-align: center;
}

/* 关闭按钮 */
.close-icon {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 16px;
  cursor: pointer;
  color: #999;
  transition: all 0.3s ease;
  z-index: 10;
}

.close-icon:hover {
  color: #666;
}

/* 表单容器 */
.form-container {
  margin-top: 20px;
}

/* 表单主体 */
.auth-form {
  padding: 0 15px;
}

/* 输入框组样式 */
.input-item {
  margin-bottom: 16px;
}

/* 返回按钮 */
.bottom-back-link {
  margin-top: 15px;
  text-align: left;
}

.custom-back-btn {
  display: flex;
  align-items: center;
  background: transparent;
  border: none;
  color: #1675e6;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.custom-back-btn:hover {
  background-color: rgba(22, 117, 230, 0.1);
}

.custom-back-btn svg {
  margin-right: 4px;
}

.custom-back-btn span {
  font-weight: 500;
}

/* 手机号输入框 */
.phone-input-container {
  display: flex;
  align-items: center;
  border: 1px solid #E0E7FF;
  border-radius: 8px;
  overflow: hidden;
}

.country-code {
  padding: 0 12px;
  font-size: 14px;
  color: #34495E;
  background: #F8FAFF;
  height: 44px;
  line-height: 44px;
  border-right: 1px solid #E0E7FF;
}

.phone-input {
  flex: 1;
}

.phone-input :deep(.el-input__wrapper) {
  box-shadow: none !important;
  padding-left: 12px;
}

/* 验证码相关样式 */
.captcha-container,
.code-container {
  display: flex;
  gap: 10px;
}

.captcha-img {
  height: 44px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #e0ecff;
  background-color: #f5f9ff;
  transition: all 0.2s ease;
  padding: 2px 10px;
  color: #1675e6;
}

.captcha-img:hover {
  border-color: #1675e6;
}

.code-btn {
  padding: 0 15px;
  white-space: nowrap;
  font-size: 13px;
  flex-shrink: 0;
  background-color: #1675e6;
  border-color: #1675e6;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.code-btn:not(:disabled):hover {
  background-color: #4e9aff;
  border-color: #4e9aff;
}

/* 其他登录方式 */
.other-login-methods {
  margin-top: 20px;
  text-align: center;
}

.divider {
  color: #999;
  font-size: 12px;
  position: relative;
  margin: 15px 0;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 30%;
  height: 1px;
  background-color: #eee;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.login-icons {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 15px;
}

.login-icon {
  font-size: 24px;
  color: #999;
  cursor: pointer;
  transition: all 0.2s ease;
}

.login-icon:hover {
  color: #FF4040;
}

/* 登录/注册标签切换 */
.auth-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #e0ecff;
  justify-content: center;
}

.auth-tabs span {
  padding: 10px 0;
  margin: 0 20px;
  font-size: 16px;
  color: #8aa8d2;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  font-weight: 400;
}

.auth-tabs span:hover {
  color: #4e9aff;
}

.auth-tabs .active-tab {
  color: #1675e6;
  font-weight: 500;
}

/* 忘记密码页面样式 */
.forgot-form {
  position: relative;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.forgot-form .el-form {
  flex: 1;
}

.auth-tabs .active-tab::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #1675e6;
}

/* 注册标签 */
.register-tabs {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #E0E7FF;
  padding: 14px 20px;
  background: #F8FAFF;
  border-radius: 8px 8px 0 0;
}

.register-tabs span {
  font-size: 15px;
  color: #7F8C8D;
  cursor: pointer;
  transition: color 0.3s;
}

.register-tabs .active-type {
  color: #3498DB;
  font-weight: 500;
}

/* 忘记密码页面标题 */
.forgot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #E0E7FF;
  background: #F8FAFF;
  border-radius: 8px 8px 0 0;
}

.forgot-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #34495E;
}

.back-to-login {
  color: #3498DB;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.back-to-login:hover {
  color: #2980B9;
  text-decoration: underline;
}

/* 按钮样式 */
.submit-btn {
  width: 100%;
  height: 44px;
  border-radius: 22px;
  font-size: 16px;
  margin-top: 20px;
  background-color: #1675e6;
  border: none;
  transition: all 0.2s ease;
  font-weight: 500;
  box-shadow: 0 5px 15px rgba(22, 117, 230, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:hover {
  background-color: #4e9aff;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(22, 117, 230, 0.4);
}

/* 表单选项区域 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
}

.forget-link {
  font-size: 13px;
  color: #8aa8d2;
  cursor: pointer;
  transition: color 0.2s;
}

.forget-link:hover {
  color: #1675e6;
}

/* 协议同意文本 */
.policy-agreement {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #8aa8d2;
}

.policy-link {
  color: #1675e6;
  text-decoration: none;
  transition: color 0.2s;
}

.policy-link:hover {
  color: #4e9aff;
  text-decoration: underline;
}

/* 表单过渡动画 */
.form-fade-enter-active,
.form-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.form-fade-enter-from,
.form-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 验证码提示文本 */
.code-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.2;
}

/* 表单元素样式覆盖 */
:deep(.el-input__wrapper) {
  border-radius: 8px;
  padding: 1px 12px;
  height: 44px;
  box-shadow: 0 0 0 1px #E0E7FF inset !important;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper):hover {
  box-shadow: 0 0 0 1px #3498DB inset !important;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #3498DB inset, 0 0 10px rgba(52, 152, 219, 0.1) !important;
}

:deep(.el-input__inner) {
  height: 42px;
  color: #34495E;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #3498DB;
  border-color: #3498DB;
}

:deep(.el-form-item__error) {
  color: #ff4c4c;
}

/* 自定义滚动条 */
.scrollable-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 5px;
  margin-right: -5px;
}

.scrollable-form::-webkit-scrollbar {
  width: 4px;
}

.scrollable-form::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}
</style>
