/**
 * 文件上传相关API
 */

import axios from 'axios';

// 基础请求地址
const baseURL = 'http://localhost:8080';

/**
 * 上传文件（图片/视频）
 * @param {File} file 要上传的文件
 * @returns {Promise} 返回上传结果，包含文件URL
 */
export const uploadFile = async (file) => {
  try {
    // 创建一个FormData对象，确保使用'file'作为字段名
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    const response = await axios.post(`${baseURL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('上传文件失败:', error);
    return {
      code: 500,
      message: '文件上传失败，请检查网络连接或文件格式',
      data: null
    };
  }
};
