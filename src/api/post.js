/**
 * 动态相关API
 */
import axios from 'axios';

// 基础请求地址
const baseURL = 'http://localhost:8080'

/**
 * 获取动态列表
 * @param {Object} params 查询参数，包括页码、每页条数等
 * @returns {Promise} 返回动态列表数据
 */
export const getPostList = async (params) => {
  try {
    // 调用API获取动态列表
    const response = await axios.get(`${baseURL}/post/all`, {
      params: {
        start: params?.start || 0,
        PostNum: params?.pageSize || 15
      },
      headers: {
        // 如果有令牌，则添加到请求头中
        ...(localStorage.getItem('token') ? {
          token: localStorage.getItem('token')
        } : {})
      }
    });
    
    if (response.data.code === 200) {
      // 获取到原始动态列表
      const rawPosts = response.data.data;
      
      // 添加调试日志
      console.log('获取到原始动态列表:', rawPosts);
      
      // 对每个动态进行处理，并获取其相关的媒体文件和用户信息
      const postsPromises = rawPosts.map(async (post) => {
        try {
          console.log(`处理动态 ID ${post.postId}...`);
          
          // 安全地获取媒体文件和用户信息
          let mediaResponse = { code: 200, data: [] };
          let userResponse = { code: 200, data: {} };
          
          try {
            // 尝试获取媒体文件
            mediaResponse = await getPostMedia(post.postId);
          } catch (mediaError) {
            console.error(`获取动态 ${post.postId} 的媒体文件失败:`, mediaError);
          }
          
          try {
            // 尝试获取用户信息
            const userApi = await import('../api/user');
            userResponse = await userApi.getUserPublicProfile(post.userId);
          } catch (userError) {
            console.error(`获取用户 ${post.userId} 的信息失败:`, userError);
          }
          
          // 获取媒体文件，并按照sortOrder排序
          const mediaFiles = mediaResponse.code === 200 ? mediaResponse.data : [];
          console.log(`动态 ${post.postId} 的原始媒体文件:`, mediaFiles);
          
          // 按sortOrder排序
          mediaFiles.sort((a, b) => a.sortOrder - b.sortOrder);
          
          // 处理媒体文件，区分图片和视频
          const processedMedia = mediaFiles.map(media => {
            // 添加对媒体类型的处理
            let mediaUrl = media.mediaUrl;
            let thumbnailUrl = null;
            
            // 媒体URL无效时的处理
            if (!mediaUrl || mediaUrl.includes('example-cos.com')) {
              // 图片使用随机占位图
              if (media.mediaType === 0) {
                mediaUrl = `https://picsum.photos/id/${(post.postId * 10 + media.sortOrder) % 100}/400/300`;
              } 
              // 视频使用默认占位图
              else if (media.mediaType === 1) {
                mediaUrl = 'https://example-video-url.mp4'; // 默认值，实际应该不会被使用
              }
            }
            
            // 处理视频缩略图
            if (media.mediaType === 1) {
              thumbnailUrl = media.backgroundUrl || 'https://picsum.photos/id/36/400/300';
            }
            
            return {
              url: mediaUrl,
              type: media.mediaType, // 0为图片，1为视频
              thumbnailUrl: thumbnailUrl,
              sortOrder: media.sortOrder
            };
          });
          
          console.log(`动态 ${post.postId} 的处理后媒体:`, processedMedia);
          
          // 获取用户信息
          const userData = userResponse.code === 200 ? userResponse.data : {};
          
          // 确保即使用户信息缺失，也能显示动态
          console.log(`动态 ${post.postId} 处理完成，用户信息:`, userData);
          
          // 构建完整的动态信息
          return {
            id: post.postId,
            userId: post.userId,
            username: userData.nickname || `用户${post.userId}`, // 如果昵称缺失，使用默认值
            userAvatar: userData.avatarUrl || 'https://via.placeholder.com/50', // 如果头像缺失，使用默认头像
            authStatus: userData.authStatus || 0,
            content: post.content,
            media: processedMedia, // 使用新的处理过的媒体数据
            createTime: post.createdAt,
            likeCount: post.likeNum || 0,
            commentCount: post.commentNum || 0,
            viewNum: post.viewNum || 0,
            isLiked: false,
            isFollowed: false
          };
        } catch (postError) {
          console.error(`处理动态 ${post.postId} 时发生错误:`, postError);
          // 即使单个动态处理失败，仍然返回一个基本对象
          return {
            id: post.postId,
            userId: post.userId,
            username: `用户${post.userId}`,
            userAvatar: 'https://via.placeholder.com/50',
            authStatus: 0,
            content: post.content,
            images: [],
            createTime: post.createdAt,
            likeCount: post.likeNum || 0,
            commentCount: post.commentNum || 0,
            viewNum: post.viewNum || 0,
            isLiked: false,
            isFollowed: false
          };
        }
      });
      
      // 等待所有动态的详细信息获取完成
      const posts = await Promise.all(postsPromises);
      
      return {
        code: 200,
        data: {
          list: posts,
          total: posts.length,
          page: params?.page || 1,
          pageSize: params?.pageSize || 15
        },
        message: '获取成功'
      };
    } else {
      // 如果API返回错误，则抛出异常
      throw new Error(response.data.message || '获取动态列表失败');
    }
  } catch (error) {
    console.error('获取动态列表失败:', error);
    throw error;
  }
}

/**
 * 发布动态
 * @param {Object} data 动态内容，包括文字、可见性等
 * @returns {Promise} 返回发布结果，包含新创建的动态ID
 */
export const createPost = async (data) => {
  try {
    const response = await axios.post(`${baseURL}/post/create`, data, {
      headers: {
        token: localStorage.getItem('token')
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('发布动态失败:', error);
    throw error;
  }
}

/**
 * 上传动态媒体文件（图片/视频）
 * @param {File} file 要上传的媒体文件
 * @param {Number} postId 关联的动态ID
 * @param {Number} mediaType 媒体类型(0:图片,1:视频)
 * @param {Number} sortOrder 排序顺序，默认为0
 * @returns {Promise} 返回上传结果，包含媒体URL
 */
export const uploadPostMedia = async (file, postId, mediaType, sortOrder = 0) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('postId', postId);
    formData.append('mediaType', mediaType);
    formData.append('sortOrder', sortOrder);
    
    const response = await axios.post(`${baseURL}/post/media/upload`, formData, {
      headers: {
        token: localStorage.getItem('token'),
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('上传媒体文件失败:', error);
    throw error;
  }
}

/**
 * 获取动态媒体文件列表
 * @param {Number} postId 动态ID
 * @returns {Promise} 返回媒体文件列表
 */
export const getPostMedia = async (postId) => {
  try {
    console.log(`正在获取动态 ${postId} 的媒体文件...`);
    
    // 根据API文档，正确的URL路径是 /post/media/getPostMedia
    const response = await axios.get(`${baseURL}/post/media/getPostMedia`, {
      params: { postId }, // postId参数是必需的
      headers: {
        ...(localStorage.getItem('token') ? {
          token: localStorage.getItem('token')
        } : {})
      }
    });
    
    if (response.data && response.data.code === 200) {
      // 打印媒体数据，特别关注backgroundUrl字段
      console.log(`成功获取动态 ${postId} 的媒体文件:`, response.data.data);
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach(media => {
          if (media.mediaType === 1) { // 视频类型
            console.log(`视频缩略图 URL(backgroundUrl):`, media.backgroundUrl);
          }
        });
      }
      return response.data;
    } else {
      console.warn(`获取动态 ${postId} 的媒体文件响应异常:`, response.data);
      return { code: 200, message: 'empty', data: [] };
    }
  } catch (error) {
    console.error(`获取动态 ${postId} 的媒体文件失败:`, error);
    // 出错时返回空数组，避免整个动态列表加载失败
    return { code: 200, message: 'empty', data: [] };
  }
}

/**
 * 获取当前用户动态
 * @returns {Promise} 返回当前用户的所有动态
 */
export const getCurrentUserPosts = async () => {
  try {
    const response = await axios.get(`${baseURL}/post/myPosts`, {
      headers: {
        token: localStorage.getItem('token')
      }
    });
    
    if (response.data.code === 200) {
      // 处理动态数据，增强前端展示
      const posts = response.data.data.map(post => ({
        id: post.postId,
        userId: post.userId,
        content: post.content,
        createTime: post.createdAt,
        updateTime: post.updatedAt,
        visibility: post.visibility,
        likeCount: post.likeNum || 0,
        commentCount: post.commentNum || 0,
        isLiked: false
      }));
      
      return {
        code: 200,
        data: posts,
        message: '获取成功'
      };
    } else {
      throw new Error(response.data.message || '获取当前用户动态失败');
    }
  } catch (error) {
    console.error('获取当前用户动态失败:', error);
    throw error;
  }
};

/**
 * 获取指定用户动态
 * @param {Number} userId 用户ID
 * @returns {Promise} 返回指定用户的所有动态
 */
export const getUserPosts = async (userId) => {
  try {
    if (!userId) {
      throw new Error('用户ID不能为空');
    }
    
    const response = await axios.get(`${baseURL}/post/userPosts`, {
      params: { userId },
      headers: {
        ...(localStorage.getItem('token') ? {
          token: localStorage.getItem('token')
        } : {})
      }
    });
    
    if (response.data.code === 200) {
      // 处理动态数据，增强前端展示
      const posts = response.data.data.map(post => ({
        id: post.postId,
        userId: post.userId,
        content: post.content,
        createTime: post.createdAt,
        updateTime: post.updatedAt,
        visibility: post.visibility,
        likeCount: post.likeNum || 0,
        commentCount: post.commentNum || 0,
        isLiked: false
      }));
      
      return {
        code: 200,
        data: posts,
        message: '获取成功'
      };
    } else {
      throw new Error(response.data.message || '获取用户动态失败');
    }
  } catch (error) {
    console.error(`获取用户 ${userId} 动态失败:`, error);
    throw error;
  }
};

/**
 * 点赞/取消点赞动态
 * @param {Number} postId 动态ID
 * @param {Boolean} isLike 是否点赞
 * @returns {Promise} 返回操作结果
 */
export const likePost = (postId, isLike) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        data: null,
        message: isLike ? '点赞成功' : '取消点赞成功'
      })
    }, 300)
  })
}

/**
 * 获取动态评论
 * @param {Number} postId 动态ID
 * @param {Object} params 查询参数
 * @returns {Promise} 返回评论列表
 */
export const getPostComments = (postId, params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const list = Array(params.pageSize || 10).fill().map((_, index) => ({
        id: index + 1,
        postId,
        userId: Math.floor(Math.random() * 100) + 1,
        username: '用户' + (Math.floor(Math.random() * 100) + 1),
        userAvatar: 'https://via.placeholder.com/40',
        content: '这是一条评论内容' + (index + 1),
        createTime: new Date(Date.now() - index * 1800000).toISOString(),
        likeCount: Math.floor(Math.random() * 50)
      }))
      
      resolve({
        code: 200,
        data: {
          list,
          total: 50,
          page: params.page || 1,
          pageSize: params.pageSize || 10
        },
        message: '获取成功'
      })
    }, 300)
  })
}

/**
 * 获取前五个最热门动态简要信息
 * @returns {Promise} 返回热门动态列表
 */
export const getTopHotBrief = async () => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { 'token': token } : {};
    
    const response = await axios.get(`${baseURL}/post/topHotBrief`, { headers });
    
    if (response.data.code === 200) {
      // 处理数据，确保热度分数只保留一位小数
      const posts = response.data.data.map(post => ({
        ...post,
        hotScore: Number(post.hotScore).toFixed(1)
      }));
      
      return {
        code: 200,
        data: posts,
        message: '获取成功'
      };
    } else {
      throw new Error(response.data.message || '获取热门动态失败');
    }
  } catch (error) {
    console.error('获取热门动态失败:', error);
    throw error;
  }
}

/**
 * 获取热门动态列表
 * @param {Number} start 起始位置，默认为0
 * @param {Number} postNum 获取条数，默认为15
 * @returns {Promise} 返回热门动态ID列表
 */
export const getHotPosts = async (page = 1, postNum = 5) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { 'token': token } : {};
    
    const response = await axios.get(`${baseURL}/post/hot`, {
      params: {
        page,
        size: postNum
      },
      headers
    });
    
    if (response.data.code === 200) {
      return response.data;
    } else {
      throw new Error(response.data.message || '获取热门动态失败');
    }
  } catch (error) {
    console.error('获取热门动态失败:', error);
    throw error;
  }
}

/**
 * 获取朋友动态列表
 * @param {Object} params 查询参数，包括页码、每页条数等
 * @returns {Promise} 返回朋友动态列表和分页信息
 */
export const getFriendPosts = async (params = {}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('未登录状态，无法获取朋友动态');
      return {
        code: 401,
        message: '请先登录',
        data: { list: [], total: 0, page: 1, size: 10, pages: 0 }
      };
    }
    
    const response = await axios.get(`${baseURL}/post/friend`, {
      params: {
        page: params.page || 1,
        size: params.size || 10
      },
      headers: { token }
    });
    
    console.log('获取朋友动态响应:', response.data);
    
    if (response.data.code === 200) {
      return response.data;
    }
    
    return response.data;
  } catch (error) {
    console.error('获取朋友动态失败:', error);
    return {
      code: 500,
      message: '获取朋友动态失败: ' + (error.message || '服务器内部错误'),
      data: { list: [], total: 0, page: 1, size: 10, pages: 0 }
    };
  }
};

/**
 * 获取最新动态列表
 * @param {Number} start 起始位置，默认为0
 * @param {Number} postNum 获取条数，默认为15
 * @returns {Promise} 返回最新动态ID列表
 */
export const getNewPosts = async (page = 0, postNum = 5) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { 'token': token } : {};
    
    const response = await axios.get(`${baseURL}/post/new`, {
      params: {
        page,
        size: postNum
      },
      headers
    });
    
    if (response.data.code === 200) {
      return response.data;
    } else {
      throw new Error(response.data.message || '获取最新动态失败');
    }
  } catch (error) {
    console.error('获取最新动态失败:', error);
    throw error;
  }
}

/**
 * 批量获取动态详情
 * @param {Array<Number>} postIds 动态ID数组
 * @returns {Promise} 返回动态详情列表
 */
export const getPostsByIds = async (postIds) => {
  try {
    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return {
        code: 200,
        data: [],
        message: '无效的动态ID列表'
      };
    }
    
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'token': token } : {})
    };
    
    try {
      // 尝试使用批量API
      const response = await axios.post(`${baseURL}/post/byIds`, postIds, { headers });
      
      if (response.data.code === 200) {
        // 获取到动态ID列表，然后使用原始实现样式获取每个动态的媒体和用户信息
        const rawPosts = response.data.data;
        console.log('原始动态详情:', rawPosts);
        
        // 对每个动态进行处理，补充缺失的媒体和用户信息
        const postsPromises = rawPosts.map(async (post) => {
          try {
            // 安全地获取媒体文件和用户信息
            let mediaResponse = { code: 200, data: [] };
            let userResponse = { code: 200, data: {} };
            
            try {
              // 尝试获取媒体文件
              mediaResponse = await getPostMedia(post.postId || post.id);
              console.log(`获取动态 ${post.postId || post.id} 的媒体成功:`, mediaResponse);
            } catch (mediaError) {
              console.error(`获取动态 ${post.postId || post.id} 的媒体文件失败:`, mediaError);
            }
            
            try {
              // 尝试获取用户信息
              const userApi = await import('../api/user');
              userResponse = await userApi.getUserPublicProfile(post.userId);
              console.log(`获取用户 ${post.userId} 的信息成功:`, userResponse);
            } catch (userError) {
              console.error(`获取用户 ${post.userId} 的信息失败:`, userError);
            }
            
            // 获取媒体文件，并按照sortOrder排序
            const mediaFiles = mediaResponse.code === 200 ? mediaResponse.data : [];
            
            // 按sortOrder排序
            mediaFiles.sort((a, b) => a.sortOrder - b.sortOrder);
            
            // 处理媒体文件，区分图片和视频
            const processedMedia = mediaFiles.map(media => {
              // 添加对媒体类型的处理
              let mediaUrl = media.mediaUrl;
              let thumbnailUrl = null;
              
              // 媒体URL无效时的处理
              if (!mediaUrl || mediaUrl.includes('example-cos.com')) {
                // 图片使用随机占位图
                if (media.mediaType === 0) {
                  mediaUrl = `https://picsum.photos/id/${((post.postId || post.id) * 10 + media.sortOrder) % 100}/400/300`;
                } 
                // 视频使用默认占位图
                else if (media.mediaType === 1) {
                  mediaUrl = 'https://example-video-url.mp4'; // 默认值，实际应该不会被使用
                }
              }
              
              // 处理视频缩略图
              if (media.mediaType === 1) {
                thumbnailUrl = media.backgroundUrl || 'https://picsum.photos/id/36/400/300';
              }
              
              return {
                url: mediaUrl,
                type: media.mediaType, // 0为图片，1为视频
                thumbnailUrl: thumbnailUrl,
                sortOrder: media.sortOrder
              };
            });
            
            // 获取用户信息
            const userData = userResponse.code === 200 ? userResponse.data : {};
            
            // 构建完整的动态信息
            return {
              ...post,
              id: post.postId || post.id,
              postId: post.postId || post.id,
              username: userData.nickname || post.username || '用户',
              userAvatar: userData.avatarUrl || post.userAvatar || 'https://picsum.photos/id/64/100/100',
              authStatus: userData.authStatus || post.authStatus || 0,
              likeCount: post.likeNum || post.likeCount || 0,
              commentCount: post.commentNum || post.commentCount || 0,
              createTime: post.createdAt || post.createTime,
              media: processedMedia
            };
          } catch (error) {
            console.error(`处理动态 ${post.postId || post.id} 时出错:`, error);
            return post; // 出错时返回原始动态
          }
        });
        
        const enhancedPosts = await Promise.all(postsPromises);
        console.log('增强后的动态列表:', enhancedPosts);
        
        return {
          code: 200,
          data: enhancedPosts,
          message: 'success'
        };
      }
    } catch (batchError) {
      console.warn('批量获取动态详情失败，切换到逐个获取模式:', batchError);
      // 如果批量API失败，切换到逐个获取模式
    }
    
    // 批量API失败或不存在，逐个获取动态详情
    console.log('使用逐个获取动态详情');
    const postsPromises = postIds.map(async id => {
      try {
        const response = await axios.get(`${baseURL}/post/${id}`, { headers });
        if (response.data.code === 200) {
          const postData = response.data.data;
          
          // 获取媒体信息
          let media = [];
          try {
            const mediaResponse = await getPostMedia(id);
            if (mediaResponse.code === 200) {
              media = mediaResponse.data.map(item => ({
                url: item.mediaUrl,
                type: item.mediaType,
                thumbnailUrl: item.mediaType === 1 ? (item.backgroundUrl || 'https://picsum.photos/id/36/400/300') : null,
                sortOrder: item.sortOrder
              }));
              media.sort((a, b) => a.sortOrder - b.sortOrder);
            }
          } catch (error) {
            console.error(`获取动态 ${id} 的媒体失败:`, error);
          }
          
          // 获取用户信息
          let username = postData.username || '用户';
          let userAvatar = postData.userAvatar || 'https://picsum.photos/id/64/100/100';
          let authStatus = postData.authStatus || 0;
          
          try {
            const userApi = await import('../api/user');
            const userResponse = await userApi.getUserPublicProfile(postData.userId);
            if (userResponse.code === 200) {
              username = userResponse.data.nickname || username;
              userAvatar = userResponse.data.avatarUrl || userAvatar;
              authStatus = userResponse.data.authStatus || authStatus;
            }
          } catch (error) {
            console.error(`获取用户 ${postData.userId} 信息失败:`, error);
          }
          
          return {
            ...postData,
            id: postData.id || id,
            postId: postData.id || id,
            username: username,
            userAvatar: userAvatar,
            authStatus: authStatus,
            likeCount: postData.likeCount || postData.likeNum || 0,
            commentCount: postData.commentCount || postData.commentNum || 0,
            createTime: postData.createdAt || postData.createTime,
            media: media
          };
        }
        return null;
      } catch (err) {
        console.error(`获取动态 ${id} 失败:`, err);
        return null;
      }
    });
    
    const posts = await Promise.all(postsPromises);
    const validPosts = posts.filter(post => post !== null);
    
    return {
      code: 200,
      data: validPosts,
      message: 'success'
    };
  } catch (error) {
    console.error('批量获取动态详情失败:', error);
    throw error;
  }
}

/**
 * 获取当前用户点赞过的动态
 * @returns {Promise} 返回用户点赞的动态列表
 */
export const getUserLikedPosts = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('用户未登录');
    }
    
    // 调用API获取用户点赞过的动态ID列表
    const response = await axios.get(`${baseURL}/post/liked`, {
      headers: { token }
    });
    
    if (response.data.code === 200) {
      // 如果成功获取到点赞动态列表，处理并返回数据
      const likedPosts = response.data.data;
      return await getPostsByIds(likedPosts.map(post => post.postId || post.id));
    } else {
      throw new Error(response.data.message || '获取点赞动态列表失败');
    }
  } catch (error) {
    console.error('获取用户点赞动态失败:', error);
    throw error;
  }
}
