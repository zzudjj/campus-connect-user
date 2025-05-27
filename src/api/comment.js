/**
 * 评论相关API
 */
import axios from 'axios';

// 基础请求地址
const baseURL = 'http://localhost:8080';

/**
 * 发表评论或回复评论
 * @param {Object} data 评论数据，包括动态ID、评论内容、父评论ID
 * @returns {Promise} 返回评论结果
 */
export const addComment = async (data) => {
  try {
    console.log('发送评论数据:', data); // 日志记录
    
    // 只发送API文档中要求的参数，不要管rootCommentId
    const response = await axios.post(`${baseURL}/comment/add`, null, {
      params: {
        postId: data.postId,
        content: data.content,
        parentCommentId: data.parentCommentId || '-1'  // 默认为-1，表示对动态的直接评论
      },
      headers: {
        token: localStorage.getItem('token')
      }
    });
    
    console.log('评论响应:', response.data); // 日志记录
    return response.data;
  } catch (error) {
    console.error('发表评论失败:', error);
    throw error;
  }
};

/**
 * 获取动态的一级评论列表
 * @param {Number} postId 动态ID
 * @returns {Promise} 返回评论列表
 */
export const getCommentList = async (postId) => {
  try {
    const response = await axios.get(`${baseURL}/comment/list`, {
      params: {
        postId
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('获取评论列表失败:', error);
    throw error;
  }
};

/**
 * 获取评论的直接回复列表（已过时）
 * @param {String} commentId 评论ID
 * @returns {Promise} 返回回复列表
 * @deprecated 请使用 getAllCommentReplies 代替
 */
export const getCommentReplies = async (commentId) => {
  try {
    const response = await axios.get(`${baseURL}/comment/replies`, {
      params: {
        commentId
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('获取回复列表失败:', error);
    throw error;
  }
};

/**
 * 获取根评论下的所有回复（包括直接和间接回复）
 * @param {String} rootCommentId 根评论ID（一级评论ID）
 * @returns {Promise} 返回该根评论下的所有回复
 */
export const getAllCommentReplies = async (rootCommentId) => {
  try {
    const response = await axios.get(`${baseURL}/comment/allReplies`, {
      params: {
        rootCommentId
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('获取评论所有回复失败:', error);
    throw error;
  }
};

/**
 * 删除评论
 * @param {String} commentId 评论ID
 * @returns {Promise} 返回删除结果
 */
export const deleteComment = async (commentId) => {
  try {
    const response = await axios.delete(`${baseURL}/comment/delete`, {
      params: {
        commentId
      },
      headers: {
        token: localStorage.getItem('token')
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('删除评论失败:', error);
    throw error;
  }
};

/**
 * 批量获取用户信息
 * @param {Array} userIds 用户ID数组
 * @returns {Promise} 返回用户信息
 */
export const batchGetUserInfo = async (userIds) => {
  try {
    console.log('批量获取用户信息:', userIds);
    const response = await axios.post(`${baseURL}/user/batchUserInfo`, userIds, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('获取到的用户信息:', response.data);
    return response.data;
  } catch (error) {
    console.error('批量获取用户信息失败:', error);
    throw error;
  }
};

/**
 * 获取评论数量
 * @param {Number|String} targetId 目标实体ID（如动态ID或评论ID）
 * @param {Number} targetType 目标类型：1-动态，2-评论
 * @returns {Promise} 返回评论数量
 */
export const getCommentCount = async (targetId, targetType = 1) => {
  try {
    const response = await axios.get(`${baseURL}/comment/count`, {
      params: {
        targetId,
        targetType
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('获取评论数量失败:', error);
    throw error;
  }
};

/**
 * 批量获取评论数量
 * @param {Array} targetIds 目标实体ID列表
 * @param {Number} targetType 目标类型：1-动态，2-评论
 * @returns {Promise} 返回批量评论数量
 */
export const batchGetCommentCount = async (targetIds, targetType = 1) => {
  try {
    const response = await axios.post(`${baseURL}/comment/batchCount?targetType=${targetType}`, targetIds, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('批量获取评论数量失败:', error);
    throw error;
  }
};
