/**
 * 举报模块API
 */
import axios from 'axios';

// 基础URL
const baseURL = 'http://localhost:8080';

/**
 * 提交举报
 * @param {Number} targetId - 被举报目标ID
 * @param {Number} targetType - 目标类型(0:用户,1:动态,2:评论)
 * @param {String} reason - 举报原因
 * @returns {Promise} 返回举报结果，包含举报ID
 */
export const submitReport = async (targetId, targetType, reason) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('用户未登录，无法提交举报');
    }
    
    // 确保参数类型符合API要求
    const validatedTargetId = parseInt(targetId);
    const validatedTargetType = parseInt(targetType);
    
    if (isNaN(validatedTargetId)) {
      throw new Error('无效的目标ID');
    }
    
    if (![0, 1, 2].includes(validatedTargetType)) {
      throw new Error('无效的目标类型');
    }
    
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      throw new Error('举报原因不能为空');
    }
    
    const response = await axios.post(`${baseURL}/report/submit`, null, {
      params: {
        targetId: validatedTargetId,
        targetType: validatedTargetType,
        reason: reason.trim()
      },
      headers: {
        'token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('提交举报失败:', error);
    throw error;
  }
};
