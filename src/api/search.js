/**
 * 搜索相关API
 */
import axios from 'axios';
import { getPostsByIds } from './post';

// 基础请求地址
const baseURL = 'http://localhost:8080';

/**
 * 模糊搜索动态
 * @param {String} keyword 搜索关键词，用于模糊匹配作者昵称、动态标题或内容
 * @param {Number} page 页码（从1开始），默认为1
 * @param {Number} size 每页数量，默认为10
 * @returns {Promise} 返回搜索结果和分页信息
 */
export const searchPosts = async (keyword, page = 1, size = 10) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { token } : {};
    
    const response = await axios.get(`${baseURL}/post/search`, {
      params: {
        keyword,
        page,
        size
      },
      headers
    });
    
    console.log('搜索动态响应:', response.data);
    
    if (response.data.code === 200 && response.data.data && response.data.data.posts) {
      // 获取动态ID列表
      const postIds = response.data.data.posts.map(post => post.postId);
      
      // 如果没有结果，直接返回
      if (postIds.length === 0) {
        return {
          code: 200,
          message: 'success',
          data: {
            posts: [],
            totalCount: response.data.data.totalCount || 0,
            currentPage: response.data.data.currentPage || page,
            totalPages: response.data.data.totalPages || 0,
            pageSize: response.data.data.pageSize || size
          }
        };
      }
      
      // 使用getPostsByIds获取完整的动态信息，包括媒体和用户详情
      const detailsResponse = await getPostsByIds(postIds);
      
      if (detailsResponse.code === 200 && detailsResponse.data) {
        return {
          code: 200,
          message: 'success',
          data: {
            posts: detailsResponse.data,
            totalCount: response.data.data.totalCount || 0,
            currentPage: response.data.data.currentPage || page,
            totalPages: response.data.data.totalPages || 0,
            pageSize: response.data.data.pageSize || size
          }
        };
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('搜索动态失败:', error);
    return {
      code: 500,
      message: '搜索动态失败: ' + (error.message || '服务器内部错误'),
      data: {
        posts: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        pageSize: size
      }
    };
  }
};
