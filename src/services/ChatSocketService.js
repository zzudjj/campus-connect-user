/**
 * WebSocket聊天服务
 * 管理与聊天服务器的WebSocket连接
 */

class ChatSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.heartbeatInterval = null;
    this.messageHandlers = new Map();
    this.serverUrl = 'ws://localhost:8080/ws/chat';
  }

  /**
   * 初始化WebSocket连接
   */
  init() {
    // 如果已经初始化过，不要重复初始化
    if (this.initialized) return;
    this.initialized = true;
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
        const message = JSON.parse(event.data);
        console.log('%c收到WebSocket消息:', 'color: blue; font-weight: bold;', message);
        
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
    
    // 根据消息类型调用相应的处理器
    if (message && message.type) {
      if (this.messageHandlers.has(message.type)) {
        console.log(`找到已注册的[${message.type}]消息处理器，开始分发...`);
        const handlers = this.messageHandlers.get(message.type);
        
        if (handlers.length === 0) {
          console.warn(`消息类型[${message.type}]存在但没有处理器`);
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
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
  }

  /**
   * 移除消息处理器
   * @param {String} type 消息类型
   * @param {Function} handler 处理函数
   */
  removeMessageHandler(type, handler) {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type);
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
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

// 单例模式，确保整个应用只有一个WebSocket连接
const chatSocketService = new ChatSocketService();
export default chatSocketService;
