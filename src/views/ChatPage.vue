<template>
  <div>
    <!-- 顶部导航栏 -->
    <HeaderBar />

    <!-- 聊天容器 -->
    <div class="chat-container">
      <!-- 左侧列表区域 -->
    <div class="sidebar-list">
      <div class="list-header">
        <el-tabs v-model="activeTab" class="sidebar-tabs">
          <el-tab-pane label="会话" name="conversations"></el-tab-pane>
          <el-tab-pane label="好友" name="friends"></el-tab-pane>
        </el-tabs>
        <el-tooltip :content="activeTab === 'conversations' ? '刷新会话列表' : '刷新好友列表'" placement="bottom" effect="light">
          <el-button
            type="primary"
            :icon="Refresh"
            circle
            @click="activeTab === 'conversations' ? fetchConversations() : fetchFriendsList()"
            size="small"
            class="refresh-btn"
          />
        </el-tooltip>
      </div>
      <!-- 加载中显示 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner">
          <div class="spinner-circle"></div>
        </div>
        <div class="loading-text">加载中...</div>
      </div>

      <!-- 会话列表 -->
      <template v-else-if="activeTab === 'conversations'">
        <el-empty v-if="conversations.length === 0" description="暂无会话" />
        <div v-else class="list-items conversation-items">
          <div
            v-for="conversation in conversations"
            :key="conversation.messageId"
            class="list-item conversation-item"
            :class="{ 'active': activeConversation && isSameConversation(activeConversation, conversation) }"
            @click="selectConversation(conversation)"
          >
            <!-- 始终显示对话好友的头像和昵称，而不是当前用户自己的 -->
            <el-avatar :src="getConversationAvatar(conversation)" />
            <div class="item-info conversation-info">
              <div class="name-time">
                <span class="name">{{ getConversationNickname(conversation) }}</span>
                <span class="time">{{ formatTime(conversation.createdAt) }}</span>
              </div>
              <div class="preview">
                <span class="preview-text" :class="{ 'unread': conversation.readStatus === 0 }">
                  {{ conversation.content }}
                </span>
                <el-badge v-if="conversation.readStatus === 0" is-dot class="unread-badge" />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 好友列表 -->
      <template v-else>
        <el-empty v-if="friendsList.length === 0" description="暂无好友" />
        <div v-else class="list-items friend-items">
          <div
            v-for="friend in friendsList"
            :key="friend.userId"
            class="list-item friend-item"
            @click="startChatWithFriend(friend)"
          >
            <el-avatar :src="friend.avatarUrl || '/default-avatar.png'" />
            <div class="item-info friend-info">
              <div class="name-status">
                <span class="name">{{ friend.nickname || `用户${friend.userId}` }}</span>
                <span class="online-status" :class="{ 'online': friend.online }">
                  {{ friend.online ? '在线' : '离线' }}
                </span>
              </div>
              <div class="friend-action">
                <el-button type="primary" size="small" text @click.stop="startChatWithFriend(friend)">
                  发起聊天
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-area">
      <template v-if="activeConversation">
        <div class="chat-header">
          <h3 :class="['chat-title', getCurrentFriendOnlineStatus()]">{{ getChatTitle() }}</h3>
        </div>

        <div class="message-list" ref="messageListRef">
          <div v-if="loadingHistory" class="loading-container">
            <div class="loading-spinner">
              <div class="spinner-circle"></div>
            </div>
            <div class="loading-text">加载聊天记录...</div>
          </div>
          <el-empty v-else-if="messages.length === 0" description="暂无消息记录" />
          <div v-else class="message-container">
            <div
              v-for="message in messages"
              :key="message.messageId"
              class="message-item"
              :class="{ 'self': message.isFromCurrentUser }"
            >
              <el-avatar
                :src="message.isFromCurrentUser ? currentUserAvatar : message.senderAvatarUrl || '/default-avatar.png'"
                class="message-avatar"
              />
              <div class="message-content">
                <div class="message-bubble">
                  <template v-if="message.messageType === 0">
                    {{ message.content }}
                  </template>
                  <img
                    v-else-if="message.messageType === 1"
                    :src="message.content"
                    alt="图片消息"
                    class="message-image"
                    @click="previewImage(message.content)"
                  />
                </div>
                <div class="message-time">{{ formatTime(message.createdAt) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="message-input">
          <div class="input-toolbar">
            <el-button class="toolbar-btn" @click="handleImageUpload">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </el-button>
            <el-button class="toolbar-btn" @click="toggleEmojiPicker">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                <circle cx="9" cy="9" r="1" fill="currentColor"/>
                <circle cx="15" cy="9" r="1" fill="currentColor"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </el-button>
            <input
              type="file"
              ref="fileInputRef"
              style="display: none"
              accept="image/*"
              @change="uploadImage"
            />
          </div>

          <!-- 表情选择器 -->
          <div v-if="showEmojiPicker" class="emoji-picker">
            <div class="emoji-header">
              <span>选择表情</span>
              <el-button text @click="showEmojiPicker = false">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </el-button>
            </div>
            <div class="emoji-grid">
              <span
                v-for="emoji in emojiList"
                :key="emoji"
                class="emoji-item"
                @click="insertEmoji(emoji)"
              >
                {{ emoji }}
              </span>
            </div>
          </div>

          <div class="input-area">
            <div class="input-container">
              <el-input
                v-model="messageContent"
                type="textarea"
                :rows="3"
                placeholder="输入消息..."
                resize="none"
                @keydown.enter.prevent="sendMessageToUser"
                class="message-textarea"
              />
            </div>
            <el-button
              type="primary"
              @click="sendMessageToUser"
              :disabled="!messageContent.trim()"
              class="send-btn"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
              <span>发送</span>
            </el-button>
          </div>
        </div>
      </template>

      <div v-else class="no-conversation">
        <div class="no-conversation-content">
          <div class="chat-icon">
            <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M8 12h.01"/>
              <path d="M12 12h.01"/>
              <path d="M16 12h.01"/>
              <path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <h3>选择一个会话开始聊天</h3>
          <p class="sub-text">或在好友列表中选择好友开始新的对话</p>
        </div>
      </div>
    </div>
    </div>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="showImageViewer"
      :url-list="[previewImageUrl]"
      @close="showImageViewer = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch, onActivated } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import HeaderBar from '../components/layout/HeaderBar.vue';
import { getConversations, getChatHistory, sendMessage, markMessageRead, markAllMessagesRead, checkUserOnlineStatus } from '../api/chat';
import { getFriendsList } from '../api/friend';
import { getUserPublicProfile } from '../api/user';
import { Refresh } from '@element-plus/icons-vue';
import chatSocketService from '../services/ChatSocketService';

// 静默检查新消息，不打断用户浏览
const checkNewMessagesQuietly = async () => {
  if (!activeConversation.value) return;

  try {
    // 保存当前滚动位置
    const scrollContainer = messageListRef.value;
    const currentScrollPos = scrollContainer ? scrollContainer.scrollTop : 0;
    const isAtBottom = scrollContainer ?
      (scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 50) : false;

    // 获取对方的用户ID
    const userId = activeConversation.value.isFromCurrentUser ?
      activeConversation.value.receiverId : activeConversation.value.senderId;

    // 静默获取最新消息
    const res = await getChatHistory(userId);

    if (res.code === 200) {
      // 检查是否有新消息
      if (res.data && res.data.length > messages.value.length) {
        console.log('发现新消息，静默更新...');

        // 仅在有新消息时更新消息列表
        messages.value = res.data;

        // 如果用户已经滚动到底部，继续滚动到底部
        // 如果用户正在查看历史消息，保持滚动位置
        await nextTick();
        if (isAtBottom) {
          // 用户在底部，自动滚动到最新消息
          scrollToBottom();
        } else {
          // 用户正在浏览历史消息，恢复位置
          if (scrollContainer) {
            scrollContainer.scrollTop = currentScrollPos;
          }
        }
      }
    }

    // 静默更新会话列表
    fetchConversations(true); // 使用静默模式，避免显示加载状态
  } catch (error) {
    console.error('静默检查新消息失败', error);
  }
};

// 状态
const loading = ref(false);
const loadingHistory = ref(false);
const sending = ref(false);
const loadingFriends = ref(false);
const activeTab = ref('friends'); // 默认显示好友列表，用于调试
const conversations = ref([]);
const friendsList = ref([]);
const messages = ref([]);
const activeConversation = ref(null);
const messageContent = ref('');
const fileInputRef = ref(null);
const messageListRef = ref(null);
const showImageViewer = ref(false);
const previewImageUrl = ref('');
const showEmojiPicker = ref(false);
// 存储定时器引用，便于组件卸载时清理
const timerRefs = ref([]);

// 表情列表
const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾',
  '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿',
  '😾', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞',
  '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
  '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
  '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
  '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅',
  '👄', '💋', '🩸', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨',
  '🧔', '👩', '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁',
  '🙋', '🧏', '🙇', '🤦', '🤷', '👮', '🕵️', '💂', '🥷', '👷',
  '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼'
];

// 获取当前用户信息
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
const currentUserId = userInfo.userId;
const currentUserAvatar = userInfo.avatarUrl || '/default-avatar.png';

// 路由相关
const router = useRouter();

// 页面激活时（keep-alive组件或者返回该页面时触发）
onActivated(() => {
  console.log('聊天页面被激活');
  // 如果当前有选中的会话，确保滚动到最新消息
  if (activeConversation.value && messages.value.length > 0) {
    nextTick(() => {
      console.log('激活时滚动到最新消息');
      scrollToBottom();
    });
  }
});

// 监听路由变化，当从其他页面返回聊天页面时滚动到最新消息
router.afterEach((to, from) => {
  if (to.path === '/chat' && from.path !== '/chat' && activeConversation.value && messages.value.length > 0) {
    console.log('从其他页面返回聊天页面，滚动到最新消息');
    // 稍微延迟一下，确保 DOM 已经更新
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }
});

// 初始化
onMounted(async () => {
  // 先尝试断开任何现有连接，完全重置状态
  chatSocketService.disconnect();

  // 注册全局事件监听器，确保即使没有正常注册消息处理器也能收到通知
  window.addEventListener('ws-chat-message', handleGlobalChatMessage);

  // 添加智能后台刷新机制，避免打断用户浏览
  const refreshInterval = setInterval(() => {
    if (activeConversation.value) {
      console.log('检查是否有新消息...');
      // 使用静默检查方式，不打断用户浏览
      checkNewMessagesQuietly();
    }
  }, 15000); // 增加刷新间隔到每15秒

  // 记录定时器以便在组件卸载时清除
  timerRefs.value.push(refreshInterval);

  // 延迟一小段时间再连接，确保断开操作已完成
  setTimeout(() => {
    console.log('开始重新初始化WebSocket连接...');
    // 强制重新初始化WebSocket连接
    chatSocketService.init();

    // 注册消息处理器
    chatSocketService.addMessageHandler('chat', handleChatMessage);
    chatSocketService.addMessageHandler('unread', handleUnreadUpdate);
    chatSocketService.addMessageHandler('connection', handleConnectionStatus);
    chatSocketService.addMessageHandler('online_status', handleOnlineStatusUpdate);

    // 登录后立即刷新会话列表和聊天历史
    setTimeout(() => {
      // 使用静默模式获取会话列表，避免显示加载状态
      fetchConversations(true);
      if (activeConversation.value) {
        fetchChatHistory();
      }
    }, 1000);
  }, 500);

  // 获取会话列表
  await fetchConversations();

  // 获取好友列表
  await fetchFriendsList();

  // 先立即执行一次检查，确保 API 被调用
  setTimeout(() => {
    console.log('开始检查好友在线状态...');
    updateFriendsOnlineStatus();
  }, 2000); // 等待3秒确保好友列表已加载

  // 定时检查好友在线状态
  setInterval(updateFriendsOnlineStatus, 60000); // 每分钟更新一次
});

// 监听activeTab变化
watch(activeTab, (newTab) => {
  if (newTab === 'conversations' && conversations.value.length === 0) {
    fetchConversations();
  } else if (newTab === 'friends' && friendsList.value.length === 0) {
    fetchFriendsList();
  }
});

// 处理全局WebSocket消息事件
const handleGlobalChatMessage = (event) => {
  console.log('%c收到全局WebSocket消息事件', 'color: purple; font-weight: bold;', event.detail);

  // 提取消息数据
  const message = event.detail;

  // 如果是聊天消息，尝试更新当前消息列表和会话列表
  if (message && message.type === 'chat') {
    // 刷新会话列表
    fetchConversations();

    // 如果当前已选中会话，刷新消息列表
    if (activeConversation.value) {
      // 检查消息是否属于当前会话，使用isSameConversation函数
      const isSenderActive = isSameConversation(activeConversation.value, { senderId: message.senderId, receiverId: currentUserId });

      if (isSenderActive) {
        console.log('全局事件消息属于当前会话，刷新消息列表');
        fetchChatHistory();

        // 如果不是当前用户发送的消息，标记为已读
        if (message.senderId !== currentUserId) {
          markAsRead(message.messageId);
        }
      } else {
        // 收到非当前会话的消息，显示通知
        ElMessage({
          message: `收到来自 ${message.senderNickname || `用户${message.senderId}`} 的新消息`,
          type: 'info',
          duration: 3000,
          showClose: true,
          onClick: () => {
            // 点击通知切换到该会话
            // 使用静默模式为false，因为这是用户主动操作
            fetchConversations(false).then(() => {
              // 使用isSameConversation函数找到与消息发送者匹配的会话
              const tempConv = { senderId: message.senderId, receiverId: currentUserId };
              const matchingConversation = conversations.value.find(c =>
                isSameConversation(c, tempConv)
              );
              if (matchingConversation) {
                selectConversation(matchingConversation);
              }
            });
          }
        });
      }
    } else {
      // 如果没有选中会话，显示通知
      ElMessage({
        message: `收到来自 ${message.senderNickname || `用户${message.senderId}`} 的新消息`,
        type: 'info',
        duration: 3000,
        showClose: true
      });
    }
  }
};

// 组件卸载前清理
onBeforeUnmount(() => {
  console.log('聊天组件卸载，清理资源...');

  // 移除消息处理器
  chatSocketService.removeMessageHandler('chat', handleChatMessage);
  chatSocketService.removeMessageHandler('unread', handleUnreadUpdate);
  chatSocketService.removeMessageHandler('connection', handleConnectionStatus);
  chatSocketService.removeMessageHandler('online_status', handleOnlineStatusUpdate);

  // 移除全局事件监听器
  window.removeEventListener('ws-chat-message', handleGlobalChatMessage);

  // 清理所有定时器
  timerRefs.value.forEach(timer => {
    clearInterval(timer);
    clearTimeout(timer);
  });
  timerRefs.value = [];
});

// 获取会话列表
const fetchConversations = async (silent = false) => {
  // 只有在非静默模式且当前是会话标签时才显示加载状态
  if (!silent && activeTab.value === 'conversations') {
    loading.value = true;
  }

  try {
    const res = await getConversations();
    if (res.code === 200) {
      // 获取原始会话数据
      const rawConversations = res.data || [];

      // 为每个会话补充完整的好友信息
      const enrichedConversations = await Promise.all(rawConversations.map(async (conversation) => {
        // 确定对话好友的ID
        const friendId = conversation.senderId === currentUserId ?
          conversation.receiverId : conversation.senderId;

        try {
          // 获取好友的详细信息
          const userProfileRes = await getUserPublicProfile(friendId);

          if (userProfileRes.code === 200 && userProfileRes.data) {
            const friendProfile = userProfileRes.data;

            // 如果发送者是当前用户，为接收者补充信息
            if (conversation.senderId === currentUserId) {
              conversation.receiverNickname = friendProfile.nickname || `用户${friendId}`;
              conversation.receiverAvatarUrl = friendProfile.avatarUrl || '/default-avatar.png';
            } else {
              // 如果发送者是好友，为发送者补充信息
              conversation.senderNickname = friendProfile.nickname || `用户${friendId}`;
              conversation.senderAvatarUrl = friendProfile.avatarUrl || '/default-avatar.png';
            }

            console.log(`已为会话补充用户${friendId}的信息:`, {
              nickname: friendProfile.nickname,
              avatarUrl: friendProfile.avatarUrl
            });
          }
        } catch (profileError) {
          console.error(`获取用户${friendId}的详细信息失败:`, profileError);
        }

        return conversation;
      }));

      // 更新会话列表
      conversations.value = enrichedConversations;
    } else {
      // 只有非静默模式才显示错误消息
      if (!silent) {
        ElMessage.error(res.message || '获取会话列表失败');
      } else {
        console.warn('静默获取会话列表失败:', res.message);
      }
    }
  } catch (error) {
    console.error('获取会话列表失败', error);
    // 只有非静默模式才显示错误消息
    if (!silent) {
      ElMessage.error('获取会话列表失败，请检查网络连接');
    }
  } finally {
    // 保证加载状态总是被重置
    if (!silent && activeTab.value === 'conversations') {
      loading.value = false;
    }
  }
};

// 获取好友列表
const fetchFriendsList = async () => {
  if (activeTab.value === 'friends') {
    loading.value = true;
  }
  loadingFriends.value = true;

  try {
    const res = await getFriendsList();

    if (res.code === 200) {
      friendsList.value = res.data || [];

      // 获取好友的详细信息（头像和昵称）
      for (const friend of friendsList.value) {
        try {
          // 获取用户基本信息（头像和昵称）
          // 根据API文档，正确的字段是 otherUserId，而不是 userId 或 friendId
          if (!friend.nickname || !friend.avatarUrl) {
            // 使用正确的ID字段
            const friendUserId = friend.otherUserId;
            if (friendUserId) {
              const profileRes = await getUserPublicProfile(friendUserId);
              if (profileRes.code === 200) {
                friend.nickname = profileRes.data.nickname;
                friend.avatarUrl = profileRes.data.avatarUrl || '/default-avatar.png';
              }
            } else {
              console.warn('无法获取好友 ID，详细信息：', friend);
            }
          }

          // 将用户ID标准化并确保是数字类型
          // 使用正确的字段 otherUserId
          const userId = Number(friend.otherUserId);

          // 确保 userId 是有效的数字
          if (!isNaN(userId) && userId > 0) {
            // 使用专门的API检查用户在线状态
            const onlineStatusRes = await checkUserOnlineStatus(userId);
            if (onlineStatusRes.code === 200) {
              friend.online = onlineStatusRes.data || false;
            } else {
              friend.online = false;
            }
          } else {
            console.error('无效的用户ID:', friend.userId || friend.friendId);
            friend.online = false;
          }
        } catch (error) {
          console.error(`获取用户信息失败`, error);
          friend.online = false;
        }
      }
    } else {
      console.error('获取好友列表失败:', res.message);
    }
  } catch (error) {
    console.error('获取好友列表失败:', error);
    ElMessage.error('获取好友列表失败，请检查网络连接');
  } finally {
    loading.value = false;
    loadingFriends.value = false;
  }
};

// 选择会话
const selectConversation = async (conversation) => {
  activeConversation.value = conversation;

  // 如果是未读消息，标记为已读
  if (conversation.readStatus === 0) {
    markAllAsRead(conversation.senderId);
  }

  await fetchChatHistory();
};

// 与好友开始聊天
const startChatWithFriend = async (friend) => {
  // 使用正确的好友ID（otherUserId）
  const friendId = friend.otherUserId;

  if (!friendId) {
    console.error('无法开始聊天：好友 ID 不存在', friend);
    ElMessage.error('无法开始聊天，用户信息不完整');
    return;
  }

  // 首先检查是否已经有该好友的会话
  const existingConversation = conversations.value.find(conv =>
    conv.senderId === friendId || conv.receiverId === friendId
  );

  if (existingConversation) {
    // 如果已有会话，直接选择它
    activeTab.value = 'conversations';
    await nextTick();
    selectConversation(existingConversation);
  } else {
    // 创建一个新的消息对象
    const newConversation = {
      senderId: friendId,
      senderNickname: friend.nickname || `用户${friendId}`,
      senderAvatarUrl: friend.avatarUrl,
      content: '',
      createdAt: new Date().toISOString(),
      readStatus: 1, // 已读
      messageId: `temp-${Date.now()}`,
      receiverId: currentUserId
    };

    activeConversation.value = newConversation;
    messages.value = [];
    messageContent.value = '';
    activeTab.value = 'conversations';

    ElMessage.success(`已开始与 ${newConversation.senderNickname} 的对话`);
  }
};

// 获取聊天历史
const fetchChatHistory = async () => {
  if (!activeConversation.value) return;

  loadingHistory.value = true;
  try {
    // 获取对方的用户ID
    const userId = activeConversation.value.isFromCurrentUser ?
      activeConversation.value.receiverId : activeConversation.value.senderId;

    const res = await getChatHistory(userId);
    if (res.code === 200) {
      messages.value = res.data || [];

      // 滚动到底部
      await nextTick();
      scrollToBottom();
    } else {
      ElMessage.error(res.message || '获取聊天历史失败');
    }
  } catch (error) {
    console.error('获取聊天历史失败', error);
    ElMessage.error('获取聊天历史失败，请检查网络连接');
  } finally {
    loadingHistory.value = false;
  }
};

// 发送消息
const sendMessageToUser = async () => {
  if (!messageContent.value.trim()) return;
  if (!activeConversation.value) {
    ElMessage.warning('请先选择聊天对象');
    return;
  }

  if (sending.value) return;
  sending.value = true;

  try {
    // 获取对方的用户ID
    const receiverId = activeConversation.value.isFromCurrentUser ?
      activeConversation.value.receiverId : activeConversation.value.senderId;

    // 获取消息内容和类型
    const content = messageContent.value.trim();
    const messageType = 0; // 文本消息

    // 创建临时消息对象
    const tempMessage = {
      messageId: `temp-${Date.now()}`,
      senderId: currentUserId,
      receiverId: receiverId,
      content: content,
      messageType: messageType,
      readStatus: 0,
      createdAt: new Date().toISOString(),
      senderNickname: userInfo.nickname || `用户${currentUserId}`,
      senderAvatarUrl: currentUserAvatar,
      isFromCurrentUser: true
    };

    // 添加到消息列表
    messages.value.push(tempMessage);

    // 清空输入框
    messageContent.value = '';

    // 滚动到底部
    await nextTick();
    scrollToBottom();

    // 优先通过WebSocket发送消息，失败时回退到HTTP API
    let wsSuccess = false;
    let res;

    try {
      // 首先尝试WebSocket发送
      wsSuccess = chatSocketService.sendChatMessage(receiverId, content, messageType);

      if (wsSuccess) {
        // WebSocket发送成功，等待服务器响应
        // 服务器会通过WebSocket的chat消息处理器通知我们消息已发送
        console.log('消息通过WebSocket成功发送');
      } else {
        // WebSocket发送失败，使用HTTP API作为备选
        console.warn('WebSocket发送失败，使用HTTP API发送消息');
        res = await sendMessage(receiverId, content, messageType);
      }
    } catch (error) {
      console.error('WebSocket发送失败，使用HTTP API发送消息', error);
      // WebSocket抛出异常，使用HTTP API
      res = await sendMessage(receiverId, content, messageType);
      wsSuccess = false;
    }

    // 如果使用了HTTP API且请求成功
    if (res && res.code === 200) {
      // 使用真实消息ID更新临时消息
      const index = messages.value.findIndex(m => m.messageId === tempMessage.messageId);
      if (index !== -1) {
        messages.value[index].messageId = res.data;
        // 如果服务器返回了创建时间，更新它
        if (res.data.createdAt) {
          messages.value[index].createdAt = res.data.createdAt;
        }
      }

      // 使用静默模式刷新会话列表，避免显示加载状态
      await fetchConversations(true);
    } else if (wsSuccess) {
      // WebSocket发送成功，但可能还没收到服务器确认
      // 临时消息已经添加到列表中，可以等待WebSocket的响应更新它
      // 这种情况通常由handleChatMessage处理

      // 延迟刷新会话列表，给服务器一些处理时间
      // 使用静默模式避免显示加载状态
      setTimeout(() => fetchConversations(true), 500);
    } else {
      // 显示错误并从消息列表中移除临时消息
      ElMessage.error('发送消息失败: ' + res.message);
      const index = messages.value.findIndex(m => m.messageId === tempMessage.messageId);
      if (index !== -1) {
        messages.value.splice(index, 1);
      }
    }
  } catch (error) {
    console.error('发送消息时发生错误', error);
    ElMessage.error('发送消息出错，请稍后重试');
  } finally {
    sending.value = false;
  }
};

// 处理图片上传
const handleImageUpload = () => {
  fileInputRef.value.click();
};

// 切换表情选择器
const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
};

// 插入表情
const insertEmoji = (emoji) => {
  messageContent.value += emoji;
  showEmojiPicker.value = false;
};

// 上传图片
const uploadImage = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    // TODO: 调用上传API，获取图片URL
    // 目前模拟一个图片URL
    const imageUrl = URL.createObjectURL(file);

    // 获取对方的用户ID
    const receiverId = activeConversation.value.isFromCurrentUser ?
      activeConversation.value.receiverId : activeConversation.value.senderId;

    // 发送图片消息
    await sendMessage(receiverId, imageUrl, 1);

    // 刷新会话列表和聊天历史
    await fetchConversations();
    await fetchChatHistory();
  } catch (error) {
    console.error('上传图片失败', error);
    ElMessage.error('上传图片失败，请检查网络连接');
  } finally {
    // 清空文件输入
    event.target.value = '';
  }
};

// 预览图片
const previewImage = (url) => {
  previewImageUrl.value = url;
  showImageViewer.value = true;
};

// 获取聊天标题
const getChatTitle = () => {
  if (!activeConversation.value) return '';

  return activeConversation.value.isFromCurrentUser ?
    activeConversation.value.receiverNickname || `用户${activeConversation.value.receiverId}` :
    activeConversation.value.senderNickname || `用户${activeConversation.value.senderId}`;
};

// 获取当前聊天好友的在线状态
const getCurrentFriendOnlineStatus = () => {
  if (!activeConversation.value) return 'offline';

  // 获取对方的用户ID
  const friendId = activeConversation.value.senderId === currentUserId
    ? activeConversation.value.receiverId
    : activeConversation.value.senderId;

  // 在好友列表中查找对应的好友
  const friend = friendsList.value.find(f => f.otherUserId === friendId);

  if (friend && friend.online) {
    return 'online';
  } else {
    return 'offline';
  }
};

// 滚动到底部
const scrollToBottom = () => {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
  }
};

// 获取会话对话好友的头像
const getConversationAvatar = (conversation) => {
  // 如果发送者是当前用户，显示接收者的头像
  if (conversation.senderId === currentUserId) {
    return conversation.receiverAvatarUrl || '/default-avatar.png';
  } else {
    // 否则显示发送者的头像
    return conversation.senderAvatarUrl || '/default-avatar.png';
  }
};

// 获取会话对话好友的昵称
const getConversationNickname = (conversation) => {
  // 如果发送者是当前用户，显示接收者的昵称
  if (conversation.senderId === currentUserId) {
    return conversation.receiverNickname || `用户${conversation.receiverId}`;
  } else {
    // 否则显示发送者的昵称
    return conversation.senderNickname || `用户${conversation.senderId}`;
  }
};

// 判断两个会话是否为同一会话
// 即与同一个用户的对话，无论是发送者还是接收者
const isSameConversation = (conv1, conv2) => {
  // 获取第一个会话中对话好友的ID
  const friend1Id = conv1.senderId === currentUserId ? conv1.receiverId : conv1.senderId;
  // 获取第二个会话中对话好友的ID
  const friend2Id = conv2.senderId === currentUserId ? conv2.receiverId : conv2.senderId;

  // 如果两个会话中对话的是同一个好友，则返回true
  return friend1Id === friend2Id;
};

// 格式化时间
const formatTime = (timeString) => {
  if (!timeString) return '';

  const date = new Date(timeString);
  const now = new Date();
  const diff = now - date; // 毫秒差值

  // 如果时间差小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  // 如果时间差小于7天
  else if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
  }
  // 否则显示完整日期
  else {
    return date.toLocaleDateString('zh-CN');
  }
};

// 处理接收到的消息
const handleChatMessage = (data) => {
  console.log('%c收到WebSocket消息:', 'color: blue; font-weight: bold;', data);

  // 保存当前滚动位置
  const scrollContainer = messageListRef.value;
  const isAtBottom = scrollContainer ?
    (scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 50) : false;

  // 检查消息是否是确认我们通过WebSocket发送的消息
  if (data.senderId === currentUserId) {
    // 查找并更新临时消息
    const tempIndex = messages.value.findIndex(m =>
      m.messageId.toString().startsWith('temp-') &&
      m.content === data.content &&
      m.receiverId === data.receiverId
    );

    if (tempIndex !== -1) {
      // 用真实消息替换临时消息
      messages.value[tempIndex] = {
        ...data,
        isFromCurrentUser: true
      };
    } else {
      // 如果找不到匹配的临时消息，直接添加
      messages.value.push({
        ...data,
        isFromCurrentUser: true
      });
    }

    // 只有用户已在底部或者自己发送的消息才自动滚动到底部
    if (isAtBottom) {
      nextTick(() => scrollToBottom());
    }
  } else {
    // 收到其他用户的消息
    console.log('检查是否应将消息添加到当前会话', activeConversation.value, data);

    // 判断这条消息是否属于当前活跃会话
    // 检查消息是否属于当前活动会话，使用isSameConversation函数
    const isSenderActive = activeConversation.value &&
                         isSameConversation(activeConversation.value, { senderId: data.senderId, receiverId: currentUserId });

    // 如果当前会话存在，并且消息发送者是当前会话的对话者
    if (isSenderActive) {
      console.log('消息属于当前会话，添加到消息列表');

      // 添加到消息列表
      messages.value.push({
        ...data,
        isFromCurrentUser: false
      });

      // 标记为已读
      markAsRead(data.messageId);

      // 只有用户已在底部时才自动滚动到底部
      if (isAtBottom) {
        nextTick(() => scrollToBottom());
      } else {
        // 如果用户不在底部，显示新消息通知
        ElMessage({
          message: '收到新消息，可滚动到底部查看',
          type: 'info',
          duration: 2000,
        });
      }
    } else {
      // 非当前会话的消息
      console.log('收到非当前会话的新消息');

      // 显示通知
      ElMessage({
        message: `收到来自 ${data.senderNickname || `用户${data.senderId}`} 的新消息`,
        type: 'info',
        duration: 3000,
        showClose: true,
        onClick: () => {
          // 点击通知直接切换到该会话
          // 使用 false 而不是 true，因为这是用户主动操作，应该显示加载状态
          fetchConversations(false).then(() => {
            // 找到对应的会话
            const matchingConversation = conversations.value.find(c =>
              isSameConversation(c, { senderId: data.senderId, receiverId: data.receiverId })
            );
            if (matchingConversation) {
              // 选中这个会话
              selectConversation(matchingConversation);
            }
          });
        }
      });
    }
  }

  // 仅在后台静默刷新会话列表，不影响用户浏览
  fetchConversations(true);
};

// 处理未读消息更新
const handleUnreadUpdate = (message) => {
  console.log('未读消息更新:', message);
  // 实现未读消息更新的逻辑
  if (message && message.total !== undefined) {
    // 使用静默模式刷新会话列表，避免显示加载状态
    fetchConversations(true);
  }
};

// 处理连接状态变更
const handleConnectionStatus = (status) => {
  console.log('WebSocket连接状态:', status);
  // 只在控制台输出状态，不再弹出消息
  // 避免反复打扰用户
};

// 标记消息为已读
const markAsRead = async (messageId) => {
  try {
    const res = await markMessageRead(messageId);
    if (res.code === 200) {
      console.log('消息已标记为已读');
      return true;
    } else {
      console.error('标记消息已读失败:', res.message);
      return false;
    }
  } catch (error) {
    console.error('标记消息已读出错:', error);
    return false;
  }
};

// 标记所有消息为已读
const markAllAsRead = async (senderId) => {
  try {
    const res = await markAllMessagesRead(senderId);
    if (res.code === 200) {
      console.log(`已将${res.data}条消息标记为已读`);
      // 使用静默模式刷新会话列表，避免显示加载状态
      await fetchConversations(true);
      return true;
    } else {
      console.error('标记所有消息已读失败:', res.message);
      return false;
    }
  } catch (error) {
    console.error('标记所有消息已读出错:', error);
    return false;
  }
};

// 处理在线状态更新
const handleOnlineStatusUpdate = (data) => {
  console.log('用户在线状态更新:', data);
  if (data && data.userId && friendsList.value.length > 0) {
    // 找到对应的好友并更新其在线状态
    // 使用正确的字段 otherUserId
    const friend = friendsList.value.find(f => f.otherUserId === data.userId);
    if (friend) {
      friend.online = data.online;
    }
  }
};

// 更新好友在线状态
const updateFriendsOnlineStatus = async () => {
  console.log('正在检查好友在线状态...');
  if (friendsList.value.length === 0) {
    console.log('好友列表为空，不检查在线状态');
    return;
  }

  try {
    console.log(`开始检查 ${friendsList.value.length} 个好友的在线状态...`);

    for (const friend of friendsList.value) {
      // 正确获取好友ID：使用 otherUserId 字段
      const userId = Number(friend.otherUserId);
      console.log(`检查用户 ${userId} 的在线状态...`);

      if (!isNaN(userId) && userId > 0) {
        console.log(`调用 checkUserOnlineStatus API: userId=${userId}`);
        const res = await checkUserOnlineStatus(userId);
        console.log(`检查用户 ${userId} 的在线状态返回结果:`, res);

        if (res.code === 200) {
          friend.online = res.data || false;
          console.log(`用户 ${userId} 的在线状态是:`, friend.online ? '在线' : '离线');
        }
      } else {
        console.error('更新在线状态时发现无效的用户ID:', friend.otherUserId);
        friend.online = false;
      }
    }
  } catch (error) {
    console.error('更新好友在线状态失败:', error);
  }
};

// 监听activeConversation变化，更新聊天历史
watch(activeConversation, async () => {
  if (activeConversation.value) {
    await fetchChatHistory();
  }
});
</script>

<style scoped>

/* 聊天容器 - 单一白色背景 */
.chat-container {
  display: flex;
  height: calc(100vh - 120px); /* 留出适当空间 */
  width: 1000px; /* 固定宽度，更合适 */
  max-width: 90%; /* 小屏幕上还是有响应式 */
  background-color: #ffffff; /* 统一白色背景 */
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  position: fixed;
  top: 80px; /* 留出更多空间给顶部 */
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

/* 响应式样式 */
@media (max-width: 1400px) {
  .chat-container {
    width: 95%;
    height: calc(100vh - 80px);
  }
}

@media (max-width: 1200px) {
  .chat-container {
    width: 96%;
    height: calc(100vh - 75px);
    top: 55px;
  }
}

@media (max-width: 768px) {
  .chat-container {
    width: 98%;
    height: calc(100vh - 70px);
    top: 50px;
  }

  .sidebar-list {
    width: 230px; /* 在小屏幕上调整侧边栏宽度 */
  }
}

/* 聊天主体部分 */
.chat-page {
  display: flex;
  height: calc(100% - 64px); /* 减去顶栏高度 */
  background-color: #f7f8fa;
  flex: 1;
  overflow: hidden;
  border-radius: 8px;
  margin: 0 16px 16px 16px;
}

/* 会话列表样式 - 统一白色主题 */
.sidebar-list {
  width: 300px; /* 调整侧边栏宽度为合适比例 */
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 12px 0 0 12px;
  overflow: hidden;
}

.list-header {
  padding: 8px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-tabs {
  flex: 1;
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.refresh-btn {
  font-size: 16px;
}

.list-items {
  flex: 1;
  overflow-y: auto;
}

/* 列表项 - 现代化设计 */
.list-item {
  display: flex;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  margin: 0 8px;
  border-radius: 12px;
  margin-bottom: 4px;
}

.list-item:hover {
  background-color: #f8f9ff;
  transform: none;
  box-shadow: 0 2px 12px rgba(24, 144, 255, 0.08);
  border-bottom-color: transparent;
}

.list-item.active {
  background-color: #e6f7ff;
  border-bottom-color: transparent;
  box-shadow: 0 2px 12px rgba(24, 144, 255, 0.15);
}

.list-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  border-radius: 2px;
}

.item-info {
  margin-left: 12px;
  flex: 1;
  min-width: 0;
}

/* 好友列表特有样式 */
.friend-item {
  padding: 16px 20px;
  margin: 0 8px;
  border-radius: 12px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
}

.friend-item:hover {
  background-color: #f8f9ff;
  box-shadow: 0 2px 12px rgba(24, 144, 255, 0.08);
  border-bottom-color: transparent;
}

.name-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.online-status {
  font-size: 11px;
  color: #999;
  border-radius: 12px;
  padding: 4px 8px;
  background-color: #f5f5f5;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.online-status::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #d9d9d9;
}

.online-status.online {
  color: #52c41a;
  background-color: #f6ffed;
}

.online-status.online::before {
  background-color: #52c41a;
}

.friend-action {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.name-time {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

/* 文字样式优化 */
.name {
  font-weight: 600;
  color: #262626;
  font-size: 15px;
  line-height: 1.4;
  margin-bottom: 2px;
}

.time {
  font-size: 11px;
  color: #8c8c8c;
  font-weight: 400;
}

.preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.preview-text {
  font-size: 13px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  line-height: 1.3;
}

.preview-text.unread {
  color: #262626;
  font-weight: 500;
}

/* 头像样式优化 */
:deep(.el-avatar) {
  border: 2px solid #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.list-item:hover :deep(.el-avatar) {
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
  transform: scale(1.05);
}

/* 聊天区域容器 */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #ffffff;
  border-radius: 0 12px 12px 0;
  position: relative; /* 为了定位内部元素 */
}

.chat-header {
  padding: 18px 24px;
  background-color: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 3;
  position: sticky;
  top: 0;
}

/* 聊天标题样式 */
.chat-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
}

.chat-title::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 10px;
  transition: background-color 0.3s ease;
}

/* 在线状态 - 绿色 */
.chat-title.online::before {
  background-color: #52c41a;
}

/* 离线状态 - 灰色 */
.chat-title.offline::before {
  background-color: #d9d9d9;
}

/* 消息列表 - 添加美观的滚动条 */
.message-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  background-color: #fff;
  scrollbar-width: thin;
  scrollbar-color: rgba(24, 144, 255, 0.3) transparent;
}

/* 自定义消息列表滚动条 */
.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb {
  background: rgba(24, 144, 255, 0.4);
  border-radius: 3px;
  transition: all 0.3s ease;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: rgba(24, 144, 255, 0.6);
}

/* 消息容器 - 现代化设计 */
.message-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  margin-bottom: 0;
  max-width: 75%;
  animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-item.self {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  margin: 0 12px;
  align-self: flex-start;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-content {
  display: flex;
  flex-direction: column;
  position: relative;
}

.message-item.self .message-content {
  align-items: flex-end;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  background-color: #f5f5f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-width: 100%;
  word-break: break-word;
  position: relative;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.message-bubble:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.message-item.self .message-bubble {
  background-color: #1890ff;
  color: white;
  border-color: rgba(255, 255, 255, 0.2);
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 6px;
  opacity: 0.8;
  font-weight: 400;
}

.message-item.self .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message-image {
  max-width: 280px;
  max-height: 280px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.message-image:hover {
  transform: scale(1.03);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.message-input {
  padding: 18px 24px 20px;
  background-color: #ffffff;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 2;
}

/* 工具栏样式 */
.input-toolbar {
  display: flex;
  margin-bottom: 12px;
  gap: 8px;
}

/* 工具栏按钮 - 简洁黑色风格 */
.toolbar-btn {
  width: 36px !important;
  height: 36px !important;
  border-radius: 8px !important;
  background-color: transparent !important;
  border: none !important;
  color: #666 !important;
  transition: all 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  min-width: auto !important;
}

.toolbar-btn:hover {
  background-color: #f5f5f5 !important;
  color: #333 !important;
  transform: none !important;
  box-shadow: none !important;
}

.toolbar-btn:active {
  background-color: #e8e8e8 !important;
  transform: scale(0.95) !important;
}

/* 表情选择器 */
.emoji-picker {
  background-color: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
  overflow: hidden;
  animation: emojiPickerSlideIn 0.3s ease-out;
}

@keyframes emojiPickerSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.emoji-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e8e8e8;
  font-weight: 600;
  color: #1890ff;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
  padding: 12px;
  max-height: 180px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(24, 144, 255, 0.3) transparent;
}

.emoji-grid::-webkit-scrollbar {
  width: 4px;
}

.emoji-grid::-webkit-scrollbar-track {
  background: transparent;
}

.emoji-grid::-webkit-scrollbar-thumb {
  background: rgba(24, 144, 255, 0.3);
  border-radius: 2px;
}

.emoji-item {
  font-size: 20px;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
}

.emoji-item:hover {
  background-color: #f0f7ff;
  transform: scale(1.1);
}

.input-area {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background-color: #ffffff;
  border-radius: 12px;
  padding: 12px 16px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.input-area:focus-within {
  border-color: #1890ff;
  box-shadow: 0 2px 12px rgba(24, 144, 255, 0.15);
}

.input-container {
  flex: 1;
}

:deep(.el-textarea__inner) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  resize: none !important;
  font-size: 14px;
  line-height: 1.5;
  padding: 8px 0;
}

:deep(.el-textarea__inner):focus {
  border: none !important;
  box-shadow: none !important;
}

.send-btn {
  height: 40px !important;
  min-width: 70px !important;
  background-color: #1890ff !important;
  border: 1px solid #1890ff !important;
  border-radius: 8px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  color: white !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}

.send-btn:hover {
  background-color: #40a9ff !important;
  border-color: #40a9ff !important;
}

.send-btn:disabled {
  background-color: #d9d9d9 !important;
  border-color: #d9d9d9 !important;
  color: rgba(0, 0, 0, 0.25) !important;
}

/* 加载和未选择会话样式 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.loading-text {
  color: #909399;
}

/* 无会话提示页面 - 美化设计 */
.no-conversation {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
}

.no-conversation-content {
  text-align: center;
  padding: 40px;
  max-width: 400px;
}

.chat-icon {
  margin-bottom: 24px;
  color: #d9d9d9;
  display: flex;
  justify-content: center;
  align-items: center;
}

.no-conversation-content h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
}

.no-conversation-content .sub-text {
  margin: 0;
  font-size: 14px;
  color: #999;
  line-height: 1.5;
}

/* 未读消息徽章 - 现代化设计 */
.unread-badge {
  margin-left: 8px;
}

:deep(.el-badge__content) {
  background-color: #ff4d4f !important;
  border: 2px solid #ffffff !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  min-width: 18px !important;
  height: 18px !important;
  line-height: 14px !important;
  border-radius: 9px !important;
  box-shadow: 0 2px 4px rgba(255, 77, 79, 0.3) !important;
}
</style>
