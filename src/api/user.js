/**
 * 用户相关API
 */

import axios from 'axios';

// 基础请求地址
const baseURL = 'http://localhost:8080/user';

/**
 * 用户登录
 * @param {Object} data 包含email和passwordHash
 * @returns {Promise} 返回登录结果
 */
export const login = (data) => {
  // data: { email, passwordHash }
  return axios.post(`${baseURL}/login`, data)
    .then(res => res.data)
};

/**
 * 用户注册
 * @param {Object} data 包含email、nickname、passwordHash等
 * @returns {Promise} 返回注册结果
 */
export const register = (data) => {
  // data: { email, nickname, passwordHash, avatarUrl?, department?, school?, beforeCardUrl?, afterCardUrl? }
  return axios.post(`${baseURL}/register`, data)
    .then(res => res.data)
};

/**
 * 获取用户信息（登录后）
 * @returns {Promise}
 */
export const getUserProfile = (token) => {
  return axios.get(`${baseURL}/profile`, {
    headers: { token }
  }).then(res => res.data)
};

/**
 * 更新用户信息
 * @param {Object} data
 * @param {String} token
 * @returns {Promise}
 */
export const updateUser = (data, token) => {
  return axios.post(`${baseURL}/update`, data, {
    headers: { token }
  }).then(res => res.data)
};

/**
 * 获取用户公开资料
 * @param {Number} userId 用户ID
 * @returns {Promise} 返回用户公开资料
 */
export const getUserPublicProfile = async (userId) => {
  try {
    // 根据API文档，正确的URL路径是 /user/publicProfile，userIdu53c2数是必需的
    console.log(`正在获取用户 ${userId} 的公开资料...`);
    const response = await axios.get(`http://localhost:8080/user/publicProfile`, {
      params: { userId }
    });
    
    if (response.data && response.data.code === 200) {
      console.log(`成功获取用户 ${userId} 的公开资料:`, response.data.data);
      return response.data;
    } else {
      console.warn(`获取用户 ${userId} 的公开资料响应异常:`, response.data);
      // 返回一个空对象，避免整个动态列表加载失败
      return { code: 200, message: 'empty', data: {} };
    }
  } catch (error) {
    console.error(`获取用户 ${userId} 的公开资料失败:`, error);
    // 出错时返回空对象，避免整个动态列表加载失败
    return { code: 200, message: 'empty', data: {} };
  }
}

/**
 * 根据昵称模糊搜索用户
 * @param {string} nickname - 要搜索的用户昵称关键词
 * @param {number} page - 页码，默认为1
 * @param {number} size - 每页数量，默认为10
 * @returns {Promise} 返回匹配的用户列表和分页信息
 */
export const searchUsersByNickname = async (nickname, page = 1, size = 10) => {
  try {
    console.log(`搜索用户昵称: ${nickname}, 页码: ${page}, 每页数量: ${size}`);
    const response = await axios.get(`http://localhost:8080/user/search/nickname`, {
      params: {
        nickname,
        page,
        size
      },
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    
    if (response.data && response.data.code === 200) {
      console.log('搜索用户成功:', response.data.data);
      
      // 调整返回结果以适应我们的组件需求
      const data = response.data.data || {};
      
      // 检查返回数据的结构，适配不同的命名约定
      const result = {
        code: response.data.code,
        message: response.data.message,
        data: {
          total: data.total || data.totalCount || 0,
          list: data.list || data.users || [],
          pageNum: data.pageNum || data.currentPage || page,
          pageSize: data.pageSize || size,
          pages: data.pages || data.totalPages || 1
        }
      };
      
      console.log('处理后的搜索结果:', result);
      return result;
    } else {
      console.warn('搜索用户响应异常:', response.data);
      return { code: 500, message: response.data.message || '搜索用户失败', data: { total: 0, list: [], pageNum: page, pageSize: size, pages: 1 } };
    }
  } catch (error) {
    console.error('搜索用户异常:', error);
    return { code: 500, message: '搜索用户失败: ' + (error.message || '网络错误'), data: { total: 0, list: [], pageNum: page, pageSize: size, pages: 1 } };
  }
};

/**
 * 获取非好友用户列表
 * @param {number} page - 页码，默认为1
 * @param {number} size - 每页数量，默认为10
 * @returns {Promise} 返回非好友用户列表和分页信息
 */
export const getNonFriendUsers = async (page = 1, size = 10) => {
  try {
    console.log(`获取非好友用户列表: 页码=${page}, 每页=${size}`);
    const response = await axios.get(`http://localhost:8080/user/non-friends`, {
      params: {
        page,
        size
      },
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    
    if (response.data && response.data.code === 200) {
      console.log('获取非好友用户成功:', response.data);
      return response.data;
    } else {
      console.warn('获取非好友用户响应异常:', response.data);
      return { code: response.data.code || 500, message: response.data.message || '获取非好友用户失败', data: { list: [], total: 0, pageNum: page, pageSize: size, pages: 1 } };
    }
  } catch (error) {
    console.error('获取非好友用户异常:', error);
    return { code: 500, message: '获取非好友用户失败: ' + (error.message || '网络错误'), data: { list: [], total: 0, pageNum: page, pageSize: size, pages: 1 } };
  }
};

/**
 * 获取所有用户简要信息
 * @returns {Promise} 返回所有用户的简要信息列表
 */
export const getAllUsers = async () => {
  try {
    console.log('获取所有用户简要信息...');
    const response = await axios.get('http://localhost:8080/user/allUsersInfo', {
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    
    if (response.data && response.data.code === 200) {
      console.log('成功获取所有用户简要信息:', response.data.data.length, '个用户');
      return response.data;
    } else {
      console.warn('获取所有用户简要信息响应异常:', response.data);
      return { code: 500, message: response.data.message || '获取用户列表失败', data: [] };
    }
  } catch (error) {
    console.error('获取所有用户简要信息失败:', error);
    return { code: 500, message: '获取用户列表失败，请检查网络连接', data: [] };
  }
}

/**
 * 上传校园卡认证信息
 * @param {Object} data 包含校园卡照片URL (beforeCardUrl和afterCardUrl)
 * @returns {Promise} 返回认证结果
 */
export const uploadStudentCard = async (data) => {
  try {
    const token = localStorage.getItem('token');
    console.log('提交校园卡认证信息:', data);
    
    const response = await axios.post(`${baseURL}/uploadCard`, data, {
      headers: {
        'Content-Type': 'application/json',
        'token': token
      }
    });
    
    if (response.data && response.data.code === 200) {
      console.log('校园卡认证信息提交成功:', response.data);
      return response.data;
    } else {
      console.warn('校园卡认证信息提交失败:', response.data);
      return response.data || { code: 500, message: '校园卡认证提交失败', data: null };
    }
  } catch (error) {
    console.error('校园卡认证信息提交失败:', error);
    return { 
      code: 500, 
      message: '校园卡认证提交失败，请检查网络连接', 
      data: null 
    };
  }
}

/**
 * 用户登出
 * @returns {Promise} 返回登出结果
 */
export const logout = async () => {
  try {
    // 清除本地存储的token
    localStorage.removeItem('token');
    
    // 动态导入ChatSocketService，避免循环依赖
    try {
      // 关闭WebSocket连接 - 现在一个服务同时处理聊天和通知
      const { closeWebSocket } = await import('../services/ChatSocketService');
      if (typeof closeWebSocket === 'function') {
        closeWebSocket();
        console.log('已关闭WebSocket连接');
      }
    } catch (error) {
      console.warn('关闭WebSocket连接失败:', error);
    }
    
    return {
      code: 200,
      message: '登出成功',
      data: null
    };
  } catch (error) {
    console.error('用户登出失败:', error);
    return {
      code: 500,
      message: '登出失败',
      data: null
    };
  }
}
