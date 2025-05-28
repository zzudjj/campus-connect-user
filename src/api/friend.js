import axios from 'axios';

// 设置基础URL
const baseURL = 'http://localhost:8080';

/**
 * 获取好友列表
 * @returns {Promise} 返回好友列表
 */
export const getFriendsList = async () => {
  try {
    const response = await axios.get(`${baseURL}/friend/list`, {
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取好友列表失败', error);
    throw error;
  }
};

/**
 * 删除好友
 * @param {Number} friendId 要删除的好友ID
 * @returns {Promise} 删除结果
 */
export const deleteFriend = async (friendId) => {
  try {
    const response = await axios.post(`${baseURL}/friend/delete`, 
      `friendId=${friendId}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'token': localStorage.getItem('token')
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('删除好友失败', error);
    throw error;
  }
};

/**
 * 获取收到的好友请求
 * @returns {Promise} 返回收到的好友请求列表
 */
export const getReceivedRequests = async () => {
  try {
    const response = await axios.get(`${baseURL}/friend/request/received`, {
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取收到的好友请求失败', error);
    throw error;
  }
};

/**
 * 获取发送的好友请求
 * @returns {Promise} 返回发送的好友请求列表
 */
export const getSentRequests = async () => {
  try {
    const response = await axios.get(`${baseURL}/friend/request/sent`, {
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取发送的好友请求失败', error);
    throw error;
  }
};

/**
 * 获取待处理的好友请求数量
 * @returns {Promise} 返回待处理的好友请求数量
 */
export const getPendingRequestCount = async () => {
  try {
    const response = await axios.get(`${baseURL}/friend/request/pending/count`, {
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取待处理好友请求数量失败', error);
    throw error;
  }
};

/**
 * 接受好友请求
 * @param {Number} requestId 好友请求ID
 * @returns {Promise} 接受结果
 */
export const acceptFriendRequest = async (requestId) => {
  try {
    const response = await axios.post(`${baseURL}/friend/request/accept`, 
      `requestId=${requestId}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'token': localStorage.getItem('token')
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('接受好友请求失败', error);
    throw error;
  }
};

/**
 * 拒绝好友请求
 * @param {Number} requestId 好友请求ID
 * @returns {Promise} 拒绝结果
 */
export const rejectFriendRequest = async (requestId) => {
  try {
    const response = await axios.post(`${baseURL}/friend/request/reject`, 
      `requestId=${requestId}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'token': localStorage.getItem('token')
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('拒绝好友请求失败', error);
    throw error;
  }
};

/**
 * 检查好友关系
 * @param {Number} userId 要检查的用户ID
 * @returns {Promise} 好友关系状态
 */
export const checkFriendStatus = async (userId) => {
  try {
    const response = await axios.get(`${baseURL}/friend/check`, {
      params: { userId },
      headers: {
        'token': localStorage.getItem('token')
      }
    });
    return response.data;
  } catch (error) {
    console.error('检查好友关系失败', error);
    throw error;
  }
};

/**
 * 发送好友请求
 * @param {Number} userId 接收请求的用户ID
 * @param {String} message 验证消息
 * @returns {Promise} 发送结果
 */
export const sendFriendRequest = async (userId, message) => {
  try {
    // 使用URLSearchParams代替FormData，因为服务器需要application/x-www-form-urlencoded格式
    const params = new URLSearchParams();
    // 使用正确的参数名：recipientId
    params.append('recipientId', userId);
    if (message) {
      params.append('message', message);
    }
    
    const response = await axios.post(`${baseURL}/friend/request/send`, 
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
    console.error('发送好友请求失败', error);
    throw error;
  }
};
