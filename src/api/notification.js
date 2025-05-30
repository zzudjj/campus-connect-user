/**
 * 通知相关API
 * 基于API文档第11节通知模块实现
 */

import axios from 'axios';

// 基础请求地址
const baseURL = 'http://localhost:8080/notification';

/**
 * 获取通知列表
 * @param {Number} page 页码
 * @param {Number} size 每页条数
 * @returns {Promise} 返回通知列表
 */
export const getNotificationList = async (page = 1, size = 10) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('用户未登录，无法获取通知列表');
      return {
        code: 401,
        message: '用户未登录',
        data: []
      };
    }
    
    const response = await axios.get(`${baseURL}/list`, {
      params: { page, size },
      headers: { token }
    });
    
    return response.data;
  } catch (error) {
    console.error('获取通知列表失败:', error);
    return {
      code: 500,
      message: '获取通知列表失败，请检查网络连接',
      data: []
    };
  }
};

/**
 * 获取未读通知数量
 * @returns {Promise} 返回未读通知数量
 */
export const getUnreadCount = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('用户未登录，无法获取未读通知数量');
      return {
        code: 401,
        message: '用户未登录',
        data: 0
      };
    }
    
    const response = await axios.get(`${baseURL}/unreadCount`, {
      headers: { token }
    });
    
    return response.data;
  } catch (error) {
    console.error('获取未读通知数量失败:', error);
    return {
      code: 500,
      message: '获取未读通知数量失败',
      data: 0
    };
  }
};

/**
 * 获取未读通知列表
 * @returns {Promise} 返回未读通知列表
 */
export const getUnreadNotifications = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('用户未登录，无法获取未读通知列表');
      return {
        code: 401,
        message: '用户未登录',
        data: []
      };
    }
    
    const response = await axios.get(`${baseURL}/unread`, {
      headers: { token }
    });
    
    return response.data;
  } catch (error) {
    console.error('获取未读通知列表失败:', error);
    return {
      code: 500,
      message: '获取未读通知列表失败',
      data: []
    };
  }
};

/**
 * 标记单个通知为已读
 * @param {Number} notificationId 通知ID
 * @returns {Promise} 返回标记结果
 */
export const markAsRead = async (notificationId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('用户未登录，无法标记通知为已读');
      return {
        code: 401,
        message: '用户未登录',
        data: null
      };
    }
    
    if (!notificationId) {
      console.error('通知ID不能为空');
      return {
        code: 400,
        message: '通知ID不能为空',
        data: null
      };
    }
    
    const response = await axios.post(`${baseURL}/read/${notificationId}`, {}, {
      headers: { token }
    });
    
    return response.data;
  } catch (error) {
    console.error('标记通知为已读失败:', error);
    return {
      code: 500,
      message: '标记通知为已读失败',
      data: null
    };
  }
};

/**
 * 标记所有通知为已读
 * @returns {Promise} 返回标记结果，包含标记为已读的通知数量
 */
export const markAllAsRead = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('用户未登录，无法标记所有通知为已读');
      return {
        code: 401,
        message: '用户未登录',
        data: { count: 0 }
      };
    }
    
    const response = await axios.post(`${baseURL}/readAll`, {}, {
      headers: { token }
    });
    
    return response.data;
  } catch (error) {
    console.error('标记所有通知为已读失败:', error);
    return {
      code: 500,
      message: '标记所有通知为已读失败',
      data: { count: 0 }
    };
  }
};
