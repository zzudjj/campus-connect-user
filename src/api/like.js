/**
 * 点赞模块API
 */
import axios from 'axios';

// 基础URL
const baseURL = 'http://localhost:8080';

/**
 * 添加点赞
 * @param {String|Number} targetId 目标ID
 * @param {Number} targetType 目标类型(0:动态,1:评论)
 * @returns {Promise} 返回点赞状态和点赞数
 */
export const addLike = async (targetId, targetType) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${baseURL}/like/add`, null, {
      params: {
        targetId,
        targetType
      },
      headers: {
        'token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('添加点赞失败:', error);
    throw error;
  }
};

/**
 * 取消点赞
 * @param {String|Number} targetId 目标ID
 * @param {Number} targetType 目标类型(0:动态,1:评论)
 * @returns {Promise} 返回点赞状态和点赞数
 */
export const removeLike = async (targetId, targetType) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${baseURL}/like/remove`, {
      params: {
        targetId,
        targetType
      },
      headers: {
        'token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('取消点赞失败:', error);
    throw error;
  }
};

/**
 * 切换点赞状态
 * @param {String|Number} targetId 目标ID
 * @param {Number} targetType 目标类型(0:动态,1:评论)
 * @returns {Promise} 返回点赞状态和点赞数
 */
export const toggleLike = async (targetId, targetType) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${baseURL}/like/toggle`, null, {
      params: {
        targetId,
        targetType
      },
      headers: {
        'token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('切换点赞状态失败:', error);
    throw error;
  }
};

/**
 * 获取点赞状态
 * @param {String|Number} targetId 目标ID
 * @param {Number} targetType 目标类型(0:动态,1:评论)
 * @returns {Promise} 返回点赞状态和点赞数
 */
export const getLikeStatus = async (targetId, targetType) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${baseURL}/like/status`, {
      params: {
        targetId,
        targetType
      },
      headers: {
        'token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('获取点赞状态失败:', error);
    throw error;
  }
};

/**
 * 获取点赞数
 * @param {String|Number} targetId 目标ID
 * @param {Number} targetType 目标类型(0:动态,1:评论)
 * @returns {Promise} 返回点赞数
 */
export const getLikeCount = async (targetId, targetType) => {
  try {
    const response = await axios.get(`${baseURL}/like/count`, {
      params: {
        targetId,
        targetType
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('获取点赞数失败:', error);
    throw error;
  }
};

/**
 * 获取用户点赞列表
 * @returns {Promise} 返回用户点赞列表
 */
export const getUserLikes = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${baseURL}/like/user`, {
      headers: {
        'token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('获取用户点赞列表失败:', error);
    throw error;
  }
};
