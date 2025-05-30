# Campus Connect通知系统WebSocket集成指南

## 概述

Campus Connect平台使用WebSocket技术实现实时通知推送，包括评论通知、点赞通知等。本文档将指导前端开发者如何正确集成WebSocket来接收和处理这些通知。

## WebSocket连接

### 建立连接

```javascript
// 获取JWT令牌（从登录后的localStorage或其他存储中）
const token = localStorage.getItem('token');

// 创建WebSocket连接
const ws = new WebSocket(`ws://localhost:8080/ws/chat/${token}`);

// 连接建立时的处理
ws.onopen = function() {
  console.log('WebSocket连接已建立');
};

// 连接关闭时的处理
ws.onclose = function() {
  console.log('WebSocket连接已关闭');
  // 可以在这里实现重连逻辑
};

// 连接错误时的处理
ws.onerror = function(error) {
  console.error('WebSocket连接发生错误:', error);
};
```

### 心跳保活

为确保WebSocket连接不因长时间空闲而断开，应实现心跳机制：

```javascript
// 发送心跳的时间间隔（毫秒）
const HEARTBEAT_INTERVAL = 30000; // 30秒

// 心跳定时器
let heartbeatTimer = null;

// 启动心跳
function startHeartbeat() {
  heartbeatTimer = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'heartbeat' }));
    }
  }, HEARTBEAT_INTERVAL);
}

// 在连接建立后启动心跳
ws.onopen = function() {
  console.log('WebSocket连接已建立');
  startHeartbeat();
};

// 连接关闭时清除心跳定时器
ws.onclose = function() {
  console.log('WebSocket连接已关闭');
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  // 实现重连逻辑...
};
```

## 消息处理

### 接收服务器消息

```javascript
ws.onmessage = function(event) {
  const message = JSON.parse(event.data);
  
  // 根据消息类型进行处理
  switch (message.type) {
    case 'connect':
      // 连接成功消息
      handleConnectMessage(message);
      break;
    case 'unreadNotification':
      // 未读通知列表
      handleUnreadNotifications(message);
      break;
    case 'unread':
      // 未读消息数量
      handleUnreadMessages(message);
      break;
    default:
      console.log('收到未知类型的消息:', message);
  }
};

// 处理连接成功消息
function handleConnectMessage(message) {
  if (message.status === 'success') {
    console.log(`用户 ${message.userId} 连接成功`);
    // 可以在这里更新UI，显示用户已连接状态
  }
}

// 处理未读通知
function handleUnreadNotifications(message) {
  console.log(`收到 ${message.count} 条未读通知`);
  
  // 更新通知图标上的未读数量
  updateNotificationBadge(message.count);
  
  // 更新通知列表
  if (message.notifications && message.notifications.length > 0) {
    updateNotificationList(message.notifications);
  }
}

// 处理未读消息
function handleUnreadMessages(message) {
  console.log(`共有 ${message.total} 条未读消息`);
  
  // 更新消息图标上的未读数量
  updateMessageBadge(message.total);
  
  // 可以根据details更新每个会话的未读数量
  if (message.details) {
    updateConversationUnreadCounts(message.details);
  }
}
```

### 发送通知已读状态

```javascript
// 标记单个通知为已读
function markNotificationAsRead(notificationId) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'readNotification',
      action: 'markOne',
      notificationId: notificationId
    }));
  }
}

// 标记所有通知为已读
function markAllNotificationsAsRead() {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'readNotification',
      action: 'markAll'
    }));
  }
}
```

## 通知类型处理

根据通知类型(type)和关联实体类型(relatedEntityType)显示不同样式的通知，并实现不同的点击行为。

```javascript
// 渲染通知项
function renderNotificationItem(notification) {
  let icon = '';
  let clickAction = '';
  
  // 根据通知类型选择图标和点击行为
  switch (notification.type) {
    case 0: // 系统通知
      icon = 'system-icon';
      clickAction = `handleSystemNotification(${notification.notificationId})`;
      break;
    case 1: // 评论通知
      icon = 'comment-icon';
      clickAction = `navigateToEntity(${notification.relatedEntityId}, ${notification.relatedEntityType})`;
      break;
    case 2: // 点赞通知
      icon = 'like-icon';
      clickAction = `navigateToEntity(${notification.relatedEntityId}, ${notification.relatedEntityType})`;
      break;
  }
  
  // 创建通知项HTML
  return `
    <div class="notification-item ${notification.readStatus === 0 ? 'unread' : ''}" 
         onclick="${clickAction}; markNotificationAsRead(${notification.notificationId})">
      <div class="notification-icon ${icon}"></div>
      <div class="notification-content">
        <div class="notification-sender">
          <img src="${notification.senderAvatar}" alt="${notification.senderName}" />
          <span>${notification.senderName}</span>
        </div>
        <div class="notification-text">${notification.content}</div>
        <div class="notification-time">${formatTime(notification.createdAt)}</div>
      </div>
    </div>
  `;
}

// 导航到相关实体
function navigateToEntity(entityId, entityType) {
  if (entityType === 0) {
    // 导航到动态详情
    window.location.href = `/post/${entityId}`;
  } else if (entityType === 1) {
    // 导航到评论
    // 注意：通常需要先获取评论所在的动态ID，然后导航到动态并滚动到评论位置
    fetchCommentPost(entityId).then(postId => {
      window.location.href = `/post/${postId}?commentId=${entityId}`;
    });
  }
}
```

## 断线重连

WebSocket可能会因为网络问题断开连接，应实现自动重连机制：

```javascript
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000; // 3秒

function connectWebSocket() {
  const token = localStorage.getItem('token');
  ws = new WebSocket(`ws://localhost:8080/ws/chat/${token}`);
  
  ws.onopen = function() {
    console.log('WebSocket连接已建立');
    reconnectAttempts = 0; // 重置重连次数
    startHeartbeat();
  };
  
  ws.onclose = function() {
    console.log('WebSocket连接已关闭');
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    
    // 尝试重连
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`尝试第 ${reconnectAttempts} 次重连...`);
      setTimeout(connectWebSocket, RECONNECT_INTERVAL);
    } else {
      console.error('重连次数已达上限，请用户手动刷新页面');
      // 显示重连失败提示
      showReconnectFailedMessage();
    }
  };
  
  // 设置其他事件处理...
}

// 初始连接
connectWebSocket();
```

## 通知页面实现建议

通知页面应该包含以下内容：

1. 未读/全部通知的切换选项
2. 通知列表，按时间降序排列
3. "全部标记为已读"按钮
4. 每条通知显示发送者、内容、时间，以及指示是否已读的视觉标记
5. 通知项的点击行为（导航到相关内容并标记为已读）

## 样式建议

为了提供良好的用户体验，建议采用以下样式设计：

1. 未读通知使用醒目的背景色或边框
2. 不同类型的通知使用不同的图标
3. 通知弹窗应该简洁但引人注意
4. 通知数量使用小红点或徽章样式展示

## 最佳实践

1. **错误处理**：确保对WebSocket连接和消息处理过程中的错误进行适当处理
2. **状态管理**：将通知状态集成到全局状态管理中（如Redux、Vuex等）
3. **缓存策略**：对通知数据进行本地缓存，减少用户等待时间
4. **节流处理**：对频繁的WebSocket消息进行节流处理，避免过度渲染
5. **移动适配**：确保通知UI在移动设备上也有良好的表现

## 测试建议

1. 测试WebSocket连接在各种网络条件下的表现
2. 测试不同类型通知的显示和交互
3. 测试长时间运行下的内存占用情况
4. 测试多设备同时登录时的通知同步

通过遵循本指南，前端开发者可以高效地集成Campus Connect的WebSocket通知系统，为用户提供流畅的实时通知体验。
