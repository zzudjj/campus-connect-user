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
 * 获取用户信息
 * @param {Number} userId 用户ID
 * @returns {Promise} 返回用户信息
 */
export const getUserInfo = (userId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        data: {
          userId: userId,
          username: '用户' + userId,
          avatar: 'https://via.placeholder.com/150',
          followCount: 120,
          fansCount: 60,
          likeCount: 300
        },
        message: '获取成功'
      })
    }, 500)
  })
}

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
