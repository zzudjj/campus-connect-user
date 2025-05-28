/**
 * 聊天相关API
 */

import axios from 'axios';

// 基础请求地址
const baseURL = 'http://localhost:8080';

/**
 * 发送消息
 * @param {Number} receiverId 接收者ID
 * @param {String} content 消息内容
 * @param {Number} messageType 消息类型（0:文本,1:图片），默认0
 * @returns {Promise} 返回发送结果
 */
export const sendMessage = async (receiverId, content, messageType = 0) => {
  try {
    const params = new URLSearchParams();
    params.append('receiverId', receiverId);
    params.append('content', content);
    params.append('messageType', messageType);

    const response = await axios.post(`${baseURL}/chat/send`, 
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'token': localStorage.getItem('token')
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('发送消息失败', error);
    throw error;
  }
};

/**
 * 获取与指定用户的聊天历史
 * @param {Number} userId 对方用户ID
 * @returns {Promise} 返回聊天历史
 */
export const getChatHistory = async (userId) => {
  try {
    const response = await axios.get(`${baseURL}/chat/history`, {
      params: { userId },
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取聊天历史失败', error);
    throw error;
  }
};

/**
 * 分页获取与指定用户的聊天历史
 * @param {Number} userId 对方用户ID
 * @param {Number} page 页码，从0开始
 * @param {Number} size 每页大小
 * @returns {Promise} 返回分页聊天历史
 */
export const getChatHistoryPaged = async (userId, page = 0, size = 20) => {
  try {
    const response = await axios.get(`${baseURL}/chat/history/page`, {
      params: { userId, page, size },
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    return response.data;
  } catch (error) {
    console.error('分页获取聊天历史失败', error);
    throw error;
  }
};

/**
 * 获取会话列表
 * @returns {Promise} 返回会话列表
 */
export const getConversations = async () => {
  try {
    const response = await axios.get(`${baseURL}/chat/conversations`, {
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取会话列表失败', error);
    throw error;
  }
};

/**
 * 标记消息为已读
 * @param {Number} messageId 消息ID
 * @returns {Promise} 返回标记结果
 */
export const markMessageRead = async (messageId) => {
  try {
    // 确保 messageId 是数字类型
    const numericMessageId = Number(messageId);
    if (isNaN(numericMessageId)) {
      throw new Error('消息ID必须是数字');
    }
    
    const params = new URLSearchParams();
    params.append('messageId', numericMessageId);

    const response = await axios.post(`${baseURL}/chat/read`, 
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'token': localStorage.getItem('token')
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('标记消息已读失败', error);
    throw error;
  }
};

/**
 * 标记所有消息为已读
 * @param {Number} senderId 发送者ID
 * @returns {Promise} 返回标记结果
 */
export const markAllMessagesRead = async (senderId) => {
  try {
    // 确保 senderId 是数字类型
    const numericSenderId = Number(senderId);
    if (isNaN(numericSenderId)) {
      throw new Error('发送者ID必须是数字');
    }
    
    const params = new URLSearchParams();
    params.append('senderId', numericSenderId);

    const response = await axios.post(`${baseURL}/chat/read/all`, 
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'token': localStorage.getItem('token')
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('标记所有消息已读失败', error);
    throw error;
  }
};

/**
 * 获取未读消息数量
 * @returns {Promise} 返回未读消息数量
 */
export const getUnreadMessageCount = async () => {
  try {
    const response = await axios.get(`${baseURL}/chat/unread/count`, {
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取未读消息数量失败', error);
    throw error;
  }
};

/**
 * 获取未读消息详情
 * @returns {Promise} 返回按发送者分组的未读消息详情
 */
export const getUnreadMessageDetails = async () => {
  try {
    const response = await axios.get(`${baseURL}/chat/unread/details`, {
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取未读消息详情失败', error);
    throw error;
  }
};

/**
 * 删除消息
 * @param {Number} messageId 消息ID
 * @returns {Promise} 返回删除结果
 */
export const deleteMessage = async (messageId) => {
  try {
    // 确保 messageId 是数字类型
    const numericMessageId = Number(messageId);
    if (isNaN(numericMessageId)) {
      throw new Error('消息ID必须是数字');
    }
    
    // 直接将参数加入URL中
    const response = await axios.delete(`${baseURL}/chat/message?messageId=${numericMessageId}`, {
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    return response.data;
  } catch (error) {
    console.error('删除消息失败', error);
    throw error;
  }
};

/**
 * 检查用户在线状态
 * @param {Number} userId 用户ID
 * @returns {Promise} 返回用户在线状态
 */
export const checkUserOnlineStatus = async (userId) => {
  try {
    // 确保 userId 是数字类型
    const numericUserId = Number(userId);
    if (isNaN(numericUserId)) {
      throw new Error('用户ID必须是数字');
    }
    
    // 采用不同的参数传递方式
    // 1. 将userId作为URL参数直接建造
    // 2. 同时在params中也指定参数
    // 3. 确保使用原始的数字而不是字符串表示
    const response = await axios({
      method: 'get',
      url: `${baseURL}/chat/online`,
      params: {
        userId: numericUserId  // 直接使用数字而非字符串
      },
      headers: {
        'token': localStorage.getItem('token'),
        'Accept': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('检查用户在线状态失败', error);
    throw error;
  }
};
