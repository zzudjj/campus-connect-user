import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';

// 基础URL
const BASE_URL = 'http://localhost:8080';

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(localStorage.getItem('token') || '');
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'));
  const isLoggedIn = ref(!!token.value);

  // 设置请求拦截器
  axios.interceptors.request.use(
    config => {
      if (token.value) {
        config.headers.token = token.value;
      }
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );

  // 登录方法
  const login = async (loginData) => {
    try {
      const response = await axios.post(`${BASE_URL}/user/login`, loginData);
      
      if (response.data.code === 200) {
        const { token: userToken, user } = response.data.data;
        
        // 保存到状态和本地存储
        token.value = userToken;
        userInfo.value = user;
        isLoggedIn.value = true;
        
        localStorage.setItem('token', userToken);
        localStorage.setItem('userInfo', JSON.stringify(user));
        
        return true;
      } else {
        ElMessage.error(response.data.message || '登录失败');
        return false;
      }
    } catch (error) {
      console.error('登录错误', error);
      ElMessage.error(error.response?.data?.message || '登录失败，请检查网络连接');
      return false;
    }
  };

  // 注册方法
  const register = async (userData, emailCode = null) => {
    try {
      // 按照最新API文档格式构建请求数据
      let requestData = {};
      
      // 如果包含验证码，则按新格式构建
      if (emailCode) {
        requestData = {
          user: {
            email: userData.email,
            nickname: userData.nickname,
            passwordHash: userData.passwordHash
          },
          request: {
            email: userData.email,
            code: emailCode
          }
        };
      } else {
        // 兼容旧格式，直接使用userData
        requestData = userData;
      }

      const response = await axios.post(`${BASE_URL}/user/register`, requestData);
      
      if (response.data.code === 200) {
        // 不在这里显示成功消息，由组件负责显示
        return true;
      } else {
        ElMessage.error(response.data.message || '注册失败');
        return false;
      }
    } catch (error) {
      console.error('注册错误', error);
      ElMessage.error(error.response?.data?.message || '注册失败，请检查网络连接');
      return false;
    }
  };

  // 登出方法
  const logout = () => {
    // 清除状态和本地存储
    token.value = '';
    userInfo.value = {};
    isLoggedIn.value = false;
    
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    
    // 关闭WebSocket连接
    try {
      // 动态导入ChatSocketService，避免循环依赖
      import('../services/ChatSocketService').then(module => {
        const chatSocketService = module.default;
        if (chatSocketService) {
          console.log('用户登出，关闭WebSocket连接');
          chatSocketService.disconnect();
        }
      });
    } catch (error) {
      console.error('关闭WebSocket连接失败', error);
    }
    
    ElMessage.success('已成功退出登录');
  };

  // 获取用户个人资料
  const getUserProfile = async () => {
    if (!token.value) return null;
    
    try {
      const response = await axios.get(`${BASE_URL}/user/profile`);
      
      if (response.data.code === 200) {
        // 更新用户信息
        userInfo.value = response.data.data;
        localStorage.setItem('userInfo', JSON.stringify(response.data.data));
        return response.data.data;
      }
    } catch (error) {
      console.error('获取用户资料错误', error);
      if (error.response?.status === 401) {
        // token过期，清除登录状态
        logout();
      }
      return null;
    }
  };

  // 更新用户信息
  const updateUserInfo = async (userData) => {
    try {
      const response = await axios.post(`${BASE_URL}/user/update`, userData);
      
      if (response.data.code === 200) {
        // 更新本地用户信息
        await getUserProfile();
        ElMessage.success('个人资料更新成功');
        return true;
      } else {
        ElMessage.error(response.data.message || '更新失败');
        return false;
      }
    } catch (error) {
      console.error('更新用户资料错误', error);
      ElMessage.error(error.response?.data?.message || '更新失败，请检查网络连接');
      return false;
    }
  };

  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    register,
    logout,
    getUserProfile,
    updateUserInfo
  };
});
