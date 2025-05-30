/**
 * WebSocket服务
 * 管理与服务器的WebSocket连接，处理聊天和通知消息
 */

// 创建响应式通知状态对象
import { reactive } from 'vue';

// 存储通知相关状态
export const notificationState = reactive({
  unreadCount: 0,
  notifications: [],
  connected: false,
  loading: false,
  lastUpdate: new Date().getTime() // 添加时间戳字段，用于触发Vue组件重新渲染
});

/**
 * ChatSocketService单例类
 * 确保整个应用只有一个实例
 */
class ChatSocketService {
  // 实例对象
  static instance = null;

  /**
   * 获取单例
   * @returns {ChatSocketService}
   */
  static getInstance() {
    if (!ChatSocketService.instance) {
      console.log('创建新的ChatSocketService实例');
      ChatSocketService.instance = new ChatSocketService();
    } else {
      console.log('返回现有ChatSocketService实例');
    }
    return ChatSocketService.instance;
  }
  
  constructor() {
    // 防止直接创建新实例
    if (ChatSocketService.instance) {
      console.warn('警告: 请使用ChatSocketService.getInstance()获取实例');
      return ChatSocketService.instance;
    }

    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.heartbeatInterval = null;
    // 公共属性，便于调试和访问
    this.messageHandlers = new Map();
    this.serverUrl = 'ws://localhost:8080/ws/chat';
    this._instanceId = 'singleton-' + Math.random().toString(36).substring(2, 9);
    
    // 聊天相关状态
    this.unreadMessages = {}; // 存储每个聊天的未读消息计数
    this.conversations = []; // 存储聊天列表
    this.currentChatId = null; // 当前选中的聊天ID
  }

  /**
   * 初始化WebSocket连接
   * @param {Object} options 初始化选项
   * @param {boolean} options.forceInit 是否强制初始化，即使已经初始化过
   * @param {boolean} options.resetHandlers 是否重置所有处理器
   */
  init(options = {}) {
    const { forceInit = false, resetHandlers = false } = options;
    
    // 如果已经初始化过，并且不强制初始化，则直接返回
    if (this.initialized && !forceInit) {
      console.log('WebSocket服务已初始化，不重复初始化');
      return;
    }
    
    // 如果需要重置处理器
    if (resetHandlers) {
      console.log('重置所有消息处理器');
      this.messageHandlers.clear();
    }
    
    this.initialized = true;
    console.log('WebSocket服务已初始化');
    this.connect();
  }

  /**
   * 建立WebSocket连接
   */
  connect() {
    // 防止重复连接
    if (this.socket) {
      // 检查连接状态
      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        console.log('WebSocket连接已存在或正在连接中, readyState:', this.socket.readyState);
        return;
      } else {
        // 如果连接已关闭或出错，先清理旧连接
        console.log('旧连接已关闭或出错，清理并重新连接, readyState:', this.socket.readyState);
        this.socket.close();
        this.socket = null;
      }
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('未找到token，无法建立WebSocket连接');
      return;
    }

    try {
      console.log('尝试建立WebSocket连接...', this.serverUrl);
      this.socket = new WebSocket(`${this.serverUrl}/${token}`);
      console.log('WebSocket实例已创建，设置事件处理器');
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * 设置WebSocket事件处理器
   */
  setupEventHandlers() {
    if (!this.socket) {
      console.error('无法设置事件处理器：WebSocket实例不存在');
      return;
    }

    // 连接建立事件
    this.socket.onopen = (event) => {
      console.log('%cWebSocket连接已成功建立!', 'color: green; font-weight: bold;');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.notifyConnectionStatus(true);
      
      // 尝试发送测试消息确认连接正常
      setTimeout(() => {
        this.sendMessage({ type: 'ping', timestamp: Date.now() });
      }, 1000);
    };

    // 接收消息事件
    this.socket.onmessage = (event) => {
      try {
        // 打印原始数据
        console.log('%c原始WebSocket数据:', 'color: purple; font-weight: bold;', event.data);
        
        const message = JSON.parse(event.data);
        console.log('%c解析后的WebSocket消息:', 'color: blue; font-weight: bold;', message);
        console.log('消息类型:', message.type);
        console.log('消息字段:', Object.keys(message));
        
        // 防止空消息或无类型消息
        if (!message || !message.type) {
          console.warn('收到无效消息，已忽略:', message);
          return;
        }
        
        // 处理消息
        this.handleMessage(message);
      } catch (error) {
        console.error('解析WebSocket消息失败:', error, '原始数据:', event.data);
      }
    };

    // 连接关闭事件
    this.socket.onclose = (event) => {
      console.log('%cWebSocket连接已关闭', 'color: orange; font-weight: bold;', '代码:', event.code, '原因:', event.reason || '未知原因');
      this.isConnected = false;
      this.stopHeartbeat();
      this.notifyConnectionStatus(false);
      
      // 如果不是主动关闭，则尝试重连
      if (event.code !== 1000) {
        console.log('连接非正常关闭，将尝试重连');
        this.scheduleReconnect();
      } else {
        console.log('连接正常关闭，不进行重连');
      }
    };

    // 错误处理
    this.socket.onerror = (error) => {
      console.error('%cWebSocket错误', 'color: red; font-weight: bold;', error);
      // 触发错误事件处理
      this.notifyConnectionStatus(false, error);
    };
    
    console.log('WebSocket事件处理器设置完成');
  }

  /**
   * 处理接收到的消息
   * @param {Object} message 接收到的消息
   */
  handleMessage(message) {
    // 打印所有注册的消息处理器，帮助调试
    console.log('当前注册的消息处理器:', [...this.messageHandlers.keys()]);
    
    // 特殊处理某些系统消息
    if (message.type === 'ping' || message.type === 'pong' || message.type === 'heartbeat') {
      console.log(`收到系统消息: ${message.type}`);
      return;
    }
    
    // 特殊处理通知相关的消息类型
    // 先处理内部逻辑，后面还会传递给注册的处理器
    if (message.type === 'notification') {
      console.log('收到通知消息，先进行内部处理...', message);
      this.handleNotificationMessage(message);
      console.log('内部处理完成，将继续传递给已注册的外部处理器...');
      // 不再返回，允许消息继续传递给其他处理器
    }
    
    if (message.type === 'unreadNotification') {
      console.log('收到未读通知消息，先进行内部处理...', message);
      this.handleUnreadNotificationMessage(message);
      console.log('内部处理完成，将继续传递给已注册的外部处理器...');
      // 不再返回，允许消息继续传递给其他处理器
    }
    
    // 处理连接成功消息
    if (message.type === 'connect') {
      if (message.status === 'success') {
        console.log(`用户 ${message.userId} 连接成功`);
        // 更新通知状态
        notificationState.connected = true;
      }
    }
    
    // 检查是否是新格式的chat消息（内容在data属性中）
    if (message.type === 'chat' && message.data) {
      console.log('检测到新API格式的chat消息，内容在data属性中', message);
    }
    
    // 根据消息类型调用相应的处理器
    if (message && message.type) {
      console.log(`检查是否有[${message.type}]类型的处理器... 实例 ID: ${this._instanceId || '未知'}`);
      console.log('当前所有消息类型:', [...this.messageHandlers.keys()]);
      
      if (this.messageHandlers.has(message.type)) {
        console.log(`找到已注册的[${message.type}]消息处理器，开始分发...`);
        const handlers = this.messageHandlers.get(message.type);
        
        console.log(`[${message.type}]处理器列表长度: ${handlers.length}, 类型:`, 
          handlers.map(h => typeof h));
        
        if (handlers.length === 0) {
          console.warn(`消息类型[${message.type}]存在但没有处理器`);
          // 打印实例的其他信息，帮助调试
          console.log('实例详情:', {
            id: this._instanceId,
            connected: this.isConnected,
            initialized: this.initialized
          });
        }
        
        // 将消息分发给所有处理器
        handlers.forEach((handler, index) => {
          try {
            console.log(`执行[${message.type}]消息处理器 #${index + 1}`);
            handler(message);
          } catch (error) {
            console.error(`处理[${message.type}]类型消息时出错:`, error);
          }
        });
      } else {
        console.warn(`收到未注册处理器的消息类型: ${message.type}`, message);
        
        // 特殊情况：如果是聊天消息但没有处理器，尝试冲洗消息列表
        if (message.type === 'chat') {
          console.log('收到聊天消息但没有处理器，尝试特殊处理...');
          
          // 创建一个事件并分发，帮助解决内容不同步问题
          this.dispatchGlobalEvent('ws-chat-message', message);
        }
      }
    } else {
      console.error('收到无效消息，缺少类型字段:', message);
    }
  }
  
  /**
   * 处理单个新通知消息
   * @param {Object} message 单个通知消息
   */
  handleNotificationMessage(message) {
    if (!message.notification) return;
    
    // 处理并标准化通知
    const processedNotification = this.processNotification(message.notification);
    
    // 检查该通知是否已存在
    const existingIndex = notificationState.notifications.findIndex(n => 
      n.notificationId === processedNotification.notificationId
    );
    
    if (existingIndex >= 0) {
      // 如果已存在，则替换
      notificationState.notifications.splice(existingIndex, 1, processedNotification);
      console.log('更新现有通知:', processedNotification);
    } else {
      // 如果不存在，则添加到列表顶部
      notificationState.notifications.unshift(processedNotification);
      notificationState.unreadCount += 1; // 增加未读数量
      console.log('添加新通知:', processedNotification);
    }
    
    // 分发通知消息事件
    this.dispatchGlobalEvent('ws-notification-message', message);
    
    // 触发通知状态更新
    this.triggerNotificationRefresh();
  }
  
  /**
   * 处理未读通知消息
   * @param {Object} message 未读通知消息
   */
  handleUnreadNotificationMessage(message) {
    // 更新未读数量
    notificationState.unreadCount = message.count || 0;
    
    if (message.notifications && message.notifications.length > 0) {
      // 检查重复通知
      const existingIds = new Set(notificationState.notifications.map(n => n.notificationId));
      const newNotifications = message.notifications.filter(n => !existingIds.has(n.notificationId));
      
      if (newNotifications.length === 0) {
        console.log('没有新通知需要添加');
        return;
      }
      
      console.log(`发现 ${newNotifications.length} 条新通知`);
      
      // 处理并标准化新通知
      const processedNotifications = newNotifications.map(n => this.processNotification(n));
      
      // 添加到通知列表并触发更新
      this.addNotificationsToState(processedNotifications);
    }
    
    // 分发未读通知消息事件
    this.dispatchGlobalEvent('ws-unreadNotification-message', message);
    
    // 触发通知状态更新
    this.triggerNotificationRefresh();
  }
  
  /**
   * 处理通知对象，标准化字段
   * @param {Object} notification 原始通知对象
   * @returns {Object} 处理后的通知对象
   */
  processNotification(notification) {
    if (!notification) return null;
    
    // 标准化通知类型
    const type = this.validateNotificationType(notification.type);
    
    return {
      ...notification,
      type,
      readStatus: notification.readStatus || 0,
      createdAt: notification.createdAt || new Date().toISOString()
    };
  }
  
  /**
   * 将多个通知添加到状态中
   * @param {Array} notifications 要添加的通知数组
   */
  addNotificationsToState(notifications) {
    if (!notifications || notifications.length === 0) return;
    
    // 根据创建时间排序，最新的在前
    const sortedNotifications = [...notifications].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // 先取出当前列表中所有通知的ID
    const existingIds = new Set(notificationState.notifications.map(n => n.notificationId));
    
    // 只添加不重复的通知
    const newNotifications = sortedNotifications.filter(n => !existingIds.has(n.notificationId));
    
    if (newNotifications.length === 0) return;
    
    // 添加到现有通知列表的开头
    notificationState.notifications.unshift(...newNotifications);
    
    // 触发通知更新
    this.triggerNotificationRefresh();
  }
  
  /**
   * 触发通知刷新
   * 强制Vue重新计算依赖于通知状态的计算属性
   */
  triggerNotificationRefresh() {
    notificationState.lastUpdate = new Date().getTime();
  }
  
  /**
   * 验证通知类型值
   * @param {Number|String} type 通知类型值
   * @returns {Number} 规范化的通知类型值(0:系统通知, 1:评论通知, 2:点赞通知)
   */
  validateNotificationType(type) {
    // 首先转换为数字
    const numType = Number(type);
    
    // 检查是否是有效的类型值
    if (isNaN(numType) || numType < 0 || numType > 2) {
      console.warn(`无效的通知类型值: ${type}, 将使用默认值 0 (系统通知)`);
      return 0; // 默认为系统通知
    }
    
    return numType;
  }
  
  /**
   * 分发全局自定义事件，帮助解决组件间通信问题
   * @param {String} eventName 事件名称
   * @param {Object} data 事件数据
   */
  dispatchGlobalEvent(eventName, data) {
    try {
      console.log(`分发全局事件: ${eventName}`, data);
      const event = new CustomEvent(eventName, { detail: data });
      window.dispatchEvent(event);
    } catch (error) {
      console.error(`分发全局事件[${eventName}]失败:`, error);
    }
  }

  /**
   * 发送消息
   * @param {Object} message 要发送的消息对象
   * @returns {Boolean} 是否成功发送
   */
  sendMessage(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket未连接，无法发送消息');
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('发送WebSocket消息失败:', error);
      return false;
    }
  }

  /**
   * 发送聊天消息
   * @param {Number} receiverId 接收者ID
   * @param {String} content 消息内容
   * @param {Number} messageType 消息类型（0:文本,1:图片）
   * @returns {Boolean} 是否成功发送
   */
  sendChatMessage(receiverId, content, messageType = 0) {
    return this.sendMessage({
      type: 'chat',
      receiverId: receiverId,
      content: content,
      messageType: messageType
    });
  }

  /**
   * 标记消息为已读
   * @param {Number} senderId 发送者ID
   * @returns {Boolean} 是否成功发送
   */
  markAsRead(senderId) {
    return this.sendMessage({
      type: 'read',
      senderId: senderId
    });
  }
  
  /**
   * 标记单个通知为已读
   * @param {Number} notificationId 通知ID
   * @returns {Boolean} 是否成功发送
   */
  markNotificationAsReadWS(notificationId) {
    // 发送消息到服务器
    const success = this.sendMessage({
      type: 'readNotification',
      action: 'markOne',
      notificationId
    });
    
    // 更新本地状态
    if (success) {
      const notification = notificationState.notifications.find(n => n.notificationId === notificationId);
      if (notification) {
        notification.readStatus = 1;
        // 更新未读数量
        notificationState.unreadCount = Math.max(0, notificationState.unreadCount - 1);
        // 触发刷新
        this.triggerNotificationRefresh();
      }
    }
    
    return success;
  }
  
  /**
   * 标记所有通知为已读
   * @returns {Boolean} 是否成功发送
   */
  markAllNotificationsAsReadWS() {
    // 发送消息到服务器
    const success = this.sendMessage({
      type: 'readNotification',
      action: 'markAll'
    });
    
    // 更新本地状态
    if (success) {
      // 将所有通知标记为已读
      notificationState.notifications.forEach(notification => {
        notification.readStatus = 1;
      });
      notificationState.unreadCount = 0;
      
      // 触发刷新
      this.triggerNotificationRefresh();
    }
    
    return success;
  }
  
  /**
   * 处理通知点击
   * @param {Object} notification 通知对象
   */
  handleNotificationClick(notification) {
    // 标记为已读
    this.markNotificationAsReadWS(notification.notificationId);
    
    // 根据通知类型和关联实体类型导航到相应页面
    this.navigateToEntity(notification.relatedEntityId, notification.relatedEntityType);
  }
  
  /**
   * 导航到相关实体
   * @param {Number} entityId 实体ID
   * @param {Number} entityType 实体类型(0:动态, 1:评论, 2:点赞, 3:用户)
   */
  navigateToEntity(entityId, entityType) {
    if (!entityId) return;
    
    switch (entityType) {
      case 0: // 动态
        window.location.href = `/#/post/${entityId}`;
        break;
      case 1: // 评论
        // 理想情况是先获取评论所在的动态ID，然后跳转到对应动态并滚动到评论位置
        // 简化处理：假设直接有评论对应的动态ID可用
        window.location.href = `/#/post/${entityId}`;
        break;
      case 2: // 点赞
        // 导航到被点赞的动态
        window.location.href = `/#/post/${entityId}`;
        break;
      case 3: // 用户
        // 导航到用户个人资料页
        window.location.href = `/#/profile/${entityId}`;
        break;
      default:
        console.warn(`未知的实体类型: ${entityType}`);
        // 默认导航到首页
        window.location.href = '/#/';
    }
  }
  
  /**
   * 格式化通知时间
   * @param {String} createdAt 创建时间
   * @returns {String} 格式化后的时间
   */
  formatNotificationTime(createdAt) {
    if (!createdAt) return '';
    
    const date = new Date(createdAt);
    const now = new Date();
    const diff = now - date;
    
    // 一分钟内
    if (diff < 60 * 1000) {
      return '刚刚';
    }
    
    // 一小时内
    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`;
    }
    
    // 一天内
    if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
    }
    
    // 超过一天
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  /**
   * 开始心跳
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: 'heartbeat' });
      }
    }, 30000); // 每30秒发送一次心跳
  }

  /**
   * 停止心跳
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 安排重连
   */
  scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`将在${delay}ms后尝试重连，这是第${this.reconnectAttempts + 1}次尝试`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else {
      console.error(`已达到最大重连次数(${this.maxReconnectAttempts})，停止重连`);
    }
  }

  /**
   * 通知连接状态变化
   * @param {Boolean} isConnected 是否已连接
   */
  notifyConnectionStatus(isConnected) {
    if (this.messageHandlers.has('connection')) {
      const handlers = this.messageHandlers.get('connection');
      handlers.forEach(handler => handler({ type: 'connection', connected: isConnected }));
    }
  }

  /**
   * 添加消息处理器
   * @param {String} type 消息类型
   * @param {Function} handler 处理函数
   */
  addMessageHandler(type, handler) {
    console.log(`正在注册[${type}]消息处理器... 实例 ID: ${this._instanceId || '未知'}`);
    
    if (!handler || typeof handler !== 'function') {
      console.error(`注册失败: [${type}]处理器不是函数:`, handler);
      return;
    }
    
    if (!this.messageHandlers.has(type)) {
      console.log(`创建新的[${type}]处理器映射`);
      this.messageHandlers.set(type, []);
    }
    
    // 检查是否已存在相同的处理器
    const handlers = this.messageHandlers.get(type);
    const handlerExists = handlers.some(h => h === handler);
    
    if (handlerExists) {
      console.warn(`处理器已存在，不重复添加[${type}]`);
      return;
    }
    
    handlers.push(handler);
    console.log(`[${type}]处理器注册成功！当前共有 ${handlers.length} 个处理器`);
    
    // 为消息处理器添加标识，帮助调试
    if (!this._instanceId) {
      this._instanceId = Math.random().toString(36).substring(2, 9);
      console.log(`为当前ChatSocketService实例创建唯一ID: ${this._instanceId}`);
    }
  }

  /**
   * 移除消息处理器
   * @param {String} type 消息类型
   * @param {Function} handler 处理函数
   */
  removeMessageHandler(type, handler) {
    console.log(`尝试移除[${type}]消息处理器... 实例 ID: ${this._instanceId || '未知'}`);
    
    if (!handler || typeof handler !== 'function') {
      console.error(`移除失败: [${type}]处理器不是函数:`, handler);
      return;
    }
    
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type);
      const index = handlers.indexOf(handler);
      
      if (index !== -1) {
        handlers.splice(index, 1);
        console.log(`成功移除[${type}]处理器，还剩 ${handlers.length} 个处理器`);
      } else {
        console.warn(`找不到要移除的[${type}]处理器`);
      }
    } else {
      console.warn(`消息类型[${type}]没有注册过处理器，无法移除`);
    }
  }

  /**
   * 关闭连接
   */
  disconnect() {
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    // 重置所有状态标志，允许用户重新登录后重新初始化
    this.isConnected = false;
    this.initialized = false;
    this.reconnectAttempts = 0;
    
    console.log('WebSocket连接已断开，所有状态已重置');
  }
}

// 创建单例并导出
// 全局只有一个实例
const chatSocketService = ChatSocketService.getInstance();

// 在全局范围打印实例 ID
console.log(`初始化全局ChatSocketService实例, ID: ${chatSocketService._instanceId}`);

// 为了兼容NotificationService.js的导出方式，导出以下函数
export const initWebSocket = () => chatSocketService.init();
export const closeWebSocket = () => chatSocketService.disconnect();
export const markNotificationAsReadWS = (notificationId) => chatSocketService.markNotificationAsReadWS(notificationId);
export const markAllNotificationsAsReadWS = () => chatSocketService.markAllNotificationsAsReadWS();
export const handleNotificationClick = (notification) => chatSocketService.handleNotificationClick(notification);
export const formatNotificationTime = (createdAt) => chatSocketService.formatNotificationTime(createdAt);

// 默认导出单例实例
export default chatSocketService;
