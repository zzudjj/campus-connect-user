/**
 * 标签相关API
 */
import axios from 'axios';

// 基础请求地址
const baseURL = 'http://localhost:8080';

/**
 * 获取所有标签
 * @returns {Promise} 返回标签列表
 */
export const getAllTags = async () => {
  try {
    const response = await axios.get(`${baseURL}/tag/all`);
    return response.data;
  } catch (error) {
    console.error('获取标签列表失败:', error);
    throw error;
  }
};

/**
 * 添加标签到动态
 * @param {Number} postId 动态ID
 * @param {Array<Number>} tagIds 标签ID列表
 * @returns {Promise} 返回关联结果
 */
export const addTagsToPost = async (postId, tagIds) => {
  try {
    // API要求的格式是URL参数，而不是JSON
    const queryString = `tagIds=${tagIds.join(',')}&postId=${postId}`;
    
    const response = await axios.post(`${baseURL}/tag/addTagToPost?${queryString}`, null, {
      headers: {
        token: localStorage.getItem('token')
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('添加标签到动态失败:', error);
    throw error;
  }
};
