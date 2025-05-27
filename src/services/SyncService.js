import { ref, reactive } from 'vue';
import axios from 'axios';
import { batchGetCommentCount, getCommentCount } from '../api/comment';

// 基础请求地址
const baseURL = 'http://localhost:8080';

// 创建单例模式的数据同步服务
class SyncService {
  constructor() {
    if (SyncService.instance) {
      return SyncService.instance;
    }
    
    // 存储需要实时同步的帖子ID列表
    this.postIdsToSync = reactive(new Set());
    
    // 存储最新的帖子数据
    this.postsCache = reactive({});
    
    // 轮询间隔（毫秒）
    this.pollingInterval = 180000; // 3分钟
    
    // 当前活跃帖子ID（刚刚评论过的帖子）
    this.activePostIds = new Set();
    
    // 轮询定时器
    this.pollingTimer = null;
    
    // 是否正在同步
    this.isSyncing = ref(false);
    
    // 注册更新回调函数
    this.updateCallbacks = new Map();
    
    SyncService.instance = this;
  }
  
  // 开始轮询同步
  startPolling() {
    if (this.pollingTimer) {
      return;
    }
    
    // 立即执行一次同步
    this.syncPosts();
    
    // 设置定时器定期同步
    this.pollingTimer = setInterval(() => {
      this.syncPosts();
    }, this.pollingInterval);
    
    console.log('数据同步服务已启动，轮询间隔:', this.pollingInterval, 'ms');
  }
  
  // 停止轮询
  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
      console.log('数据同步服务已停止');
    }
  }
  
  // 添加要同步的帖子ID
  addPostToSync(postId, isActive = false) {
    if (!postId) return;
    
    const id = postId.toString();
    this.postIdsToSync.add(id);
    
    // 如果是活跃帖子（刚刚评论过的），添加到活跃列表
    if (isActive) {
      this.activePostIds.add(id);
      
      // 5分钟后自动从活跃列表移除
      setTimeout(() => {
        this.activePostIds.delete(id);
        console.log(`帖子 ${id} 已从活跃列表移除`);
      }, 300000); // 5分钟
    }
    
    // 如果轮询尚未开始，则开始轮询
    if (!this.pollingTimer) {
      this.startPolling();
    }
    
    console.log(`已添加帖子 ${id} 到同步列表${isActive ? '，并标记为活跃帖子' : ''}`);
  }
  
  // 移除同步的帖子ID
  removePostFromSync(postId) {
    if (!postId) return;
    
    const id = postId.toString();
    this.postIdsToSync.delete(id);
    
    // 如果没有需要同步的帖子，停止轮询
    if (this.postIdsToSync.size === 0) {
      this.stopPolling();
    }
    
    console.log(`已从同步列表移除帖子 ${id}`);
  }
  
  // 注册更新回调
  registerUpdateCallback(postId, callback) {
    if (!postId || typeof callback !== 'function') return;
    
    const id = postId.toString();
    this.updateCallbacks.set(id, callback);
    
    console.log(`已为帖子 ${id} 注册更新回调`);
  }
  
  // 取消注册更新回调
  unregisterUpdateCallback(postId) {
    if (!postId) return;
    
    const id = postId.toString();
    this.updateCallbacks.delete(id);
    
    console.log(`已为帖子 ${id} 取消注册更新回调`);
  }
  
  // 同步帖子数据
  async syncPosts() {
    if (this.isSyncing.value || this.postIdsToSync.size === 0) {
      return;
    }
    
    this.isSyncing.value = true;
    
    try {
      // 只同步活跃帖子，如果没有活跃帖子，则同步所有帖子
      let postIdsToProcess;
      
      if (this.activePostIds.size > 0) {
        // 如果有活跃帖子，只处理活跃帖子
        postIdsToProcess = Array.from(this.activePostIds);
        console.log('只同步活跃帖子:', postIdsToProcess);
      } else {
        // 如果没有活跃帖子，处理所有需要同步的帖子
        postIdsToProcess = Array.from(this.postIdsToSync);
        console.log('定期同步所有帖子:', postIdsToProcess);
      }
      
      if (postIdsToProcess.length === 0) {
        this.isSyncing.value = false;
        return;
      }
      
      // 使用新的批量获取评论数量API
      const commentCountResponse = await batchGetCommentCount(postIdsToProcess, 1); // 1表示动态类型
      
      if (commentCountResponse.code === 200 && commentCountResponse.data) {
        const commentCountData = commentCountResponse.data;
        
        // 遍历每个帖子ID，检查评论数量是否有变化
        for (const postId of postIdsToProcess) {
          const id = postId.toString();
          
          // 获取当前评论数量
          const currentCommentCount = commentCountData[id] || 0;
          
          // 如果缓存中没有该帖子信息，从API获取
          if (!this.postsCache[id]) {
            // 如果还没有帖子数据，尝试获取帖子详情
            await this.getPostLatestData(id);
            continue;
          }
          
          // 检查评论数是否有变化
          const oldPost = this.postsCache[id];
          const hasCommentCountChanged = oldPost.commentCount !== currentCommentCount;
          
          if (hasCommentCountChanged) {
            // 更新缓存中的评论数量
            this.postsCache[id] = {
              ...oldPost,
              commentCount: currentCommentCount
            };
            
            // 如果评论数有变化，触发回调
            if (this.updateCallbacks.has(id)) {
              const callback = this.updateCallbacks.get(id);
              callback(this.postsCache[id]);
              console.log(`帖子 ${id} 的评论数量已更新为 ${currentCommentCount}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('同步帖子数据失败:', error);
    } finally {
      this.isSyncing.value = false;
    }
  }
  
  // 立即获取帖子最新数据
  async getPostLatestData(postId) {
    if (!postId) return null;
    
    const id = postId.toString();
    
    try {
      // 获取帖子详情
      const response = await axios.get(`${baseURL}/post/detail`, {
        params: {
          postId: id
        },
        headers: {
          ...(localStorage.getItem('token') ? {
            token: localStorage.getItem('token')
          } : {})
        }
      });
      
      // 获取评论数量
      const commentCountResponse = await getCommentCount(id, 1); // 1表示动态类型
      
      if (response.data.code === 200 && response.data.data) {
        const post = response.data.data;
        
        // 如果评论数量获取成功，更新帖子的评论数量
        if (commentCountResponse.code === 200 && commentCountResponse.data) {
          post.commentCount = commentCountResponse.data.count || 0;
        }
        
        // 更新缓存
        this.postsCache[id] = post;
        
        return post;
      }
    } catch (error) {
      console.error(`获取帖子 ${id} 最新数据失败:`, error);
    }
    
    return null;
  }
}

// 导出单例实例
export const syncService = new SyncService();
