<template>
  <!-- 评论弹窗组件 - 完全自定义实现 -->
  <div class="new-comment-modal-overlay" v-if="visible" @click.self="closeModal">
    <div class="new-comment-modal-container">
      <!-- 标题和关闭按钮 -->
      <div class="new-comment-modal-header">
        <div class="new-comment-modal-title" v-if="!activeRootComment">
          {{ commentCount }}条评论
        </div>
        <div class="new-comment-modal-title" v-else>
          <el-button class="back-button" text @click="backToMainComments">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          {{ replyCount }}条回复
        </div>
        <el-icon class="new-comment-modal-close" @click="closeModal"><Close /></el-icon>
      </div>
      
      <div class="new-comment-modal-content">
        <!-- 原动态内容 -->
        <div class="original-post" v-if="!activeRootComment">
          <el-avatar :src="post.userAvatar" size="small" />
          <span class="username">{{ post.username }}</span>
          <span class="post-content">{{ post.content }}</span>
        </div>
        
        <!-- 激活的一级评论（查看回复时显示） -->
        <div class="original-post root-comment-highlight" v-if="activeRootComment">
          <el-avatar :src="getUserAvatar(activeRootComment.userId)" size="small" />
          <div class="comment-content-wrapper">
            <div class="comment-user">{{ getUserName(activeRootComment.userId) }}</div>
            <div class="comment-text">{{ activeRootComment.content }}</div>
            <div class="comment-time-info">{{ formatTime(activeRootComment.createdAt) }}</div>
          </div>
        </div>
      
      <!-- 载入中提示 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-animation">
          <div class="dot-pulse"></div>
        </div>
        <span class="loading-text">正在加载评论...</span>
      </div>
      
      <!-- 一级评论列表 -->
      <div 
        class="comment-list" 
        v-else-if="!activeRootComment && primaryComments.length"
        ref="commentListRef"
      >
        <div class="comment-item" v-for="comment in primaryComments" :key="comment.commentId">
          <el-avatar :src="getUserAvatar(comment.userId)" size="small" class="comment-avatar" />
          <div class="comment-content">
            <div class="comment-user">{{ getUserName(comment.userId) }}</div>
            <div class="comment-text">{{ comment.content }}</div>
            <div class="comment-footer">
              <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
              <div class="comment-actions">
                <el-button
                  class="comment-action"
                  :type="comment.isLiked ? 'danger' : 'default'"
                  size="small"
                  text
                  @click="likeComment(comment)"
                >
                  <i class="fa-heart" :class="[comment.isLiked ? 'fas text-pink' : 'far']"></i>
                  {{ formatNumber(comment.likeNum) }}
                </el-button>
                <el-button
                  class="comment-action"
                  type="default"
                  size="small"
                  text
                  @click="viewReplies(comment)"
                >
                  <i class="far fa-comment"></i> 
                  {{ formatNumber(comment.commentNum) }}
                </el-button>
                <el-button
                  class="comment-action"
                  type="default"
                  size="small"
                  text
                  @click="handleReplyToComment(comment)"
                >
                  <i class="far fa-paper-plane"></i> 回复
                </el-button>
                
                <!-- 举报按钮 -->
                <el-button
                  class="comment-action"
                  type="default"
                  size="small"
                  text
                  @click="handleReport(comment, 2)" 
                >
                  <i class="far fa-flag"></i> 举报
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 二级评论列表（所有回复） -->
      <div 
        class="comment-list replies-list" 
        v-else-if="activeRootComment && secondaryComments.length"
        ref="repliesListRef"
      >
        <!-- 所有二级评论平级显示 -->
        <div 
          class="comment-item" 
          v-for="reply in secondaryComments" 
          :key="reply.commentId"
        >
          <el-avatar :src="getUserAvatar(reply.userId)" size="small" class="comment-avatar" />
          <div class="comment-content">
            <div class="comment-user">{{ getUserName(reply.userId) }}</div>
            <div class="comment-text">
              <!-- 如果回复的不是一级评论，显示@用户名 -->
              <template v-if="reply.parentCommentId !== activeRootComment.commentId">
                <span class="reply-to">@{{ getUserName(getParentUserId(reply)) }}</span>
              </template>
              <!-- 显示评论内容，但不显示已经以@开头的部分 -->
              {{ reply.content.includes('@') && reply.parentCommentId !== activeRootComment.commentId ? 
                 reply.content.substring(reply.content.indexOf(' ') + 1) : 
                 reply.content }}
            </div>
            <div class="comment-footer">
              <span class="comment-time">{{ formatTime(reply.createdAt) }}</span>
              <div class="comment-actions">
                <el-button
                  class="comment-action"
                  :type="reply.isLiked ? 'danger' : 'default'"
                  size="small"
                  text
                  @click="likeComment(reply)"
                  
                >
                  <i class="fa-heart" :class="[reply.isLiked ? 'fas text-pink' : 'far']"></i>
                  {{ formatNumber(reply.likeNum) }}
                </el-button>
                <el-button
                  class="comment-action"
                  type="default"
                  size="small"
                  text
                  @click="handleReplyToComment(reply)"
                >
                  <i class="far fa-paper-plane"></i> 回复
                </el-button>
                
                <!-- 举报按钮 -->
                <el-button
                  class="comment-action"
                  type="default"
                  size="small"
                  text
                  @click="handleReport(reply, 2)" 
                >
                  <i class="far fa-flag"></i> 举报
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 无评论提示 -->
      <div class="no-comments" v-else-if="!loading">
        <div class="no-comments-icon">
          <i class="far fa-comment-dots"></i>
        </div>
        <p class="no-comments-text">暂无评论，快来发表您的看法</p>
      </div>
      </div>
      
      <!-- 评论输入框 - 固定在底部 -->
      <div class="comment-input-area">
        <el-avatar :src="currentUserAvatar" size="small" class="current-user-avatar" />
        <div class="input-wrapper">
          <div class="input-container">
            <el-input
              v-model="commentText"
              :placeholder="getInputPlaceholder()"
              size="large"
              class="comment-input"
              maxlength="200"
              show-word-limit
              @keyup.enter="submitComment"
            />
            <div class="emoji-button" @click="handleEmojiClick">
              <i class="fas fa-smile"></i>
            </div>
            <!-- 表情面板 -->
            <div v-if="showEmojiPanel" class="emoji-panel" ref="emojiPanelRef">
              <div class="emoji-grid">
                <div 
                  v-for="(emoji, index) in emojis" 
                  :key="index"
                  class="emoji-item"
                  @click.stop="insertEmoji(emoji)"
                >
                  {{ emoji }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <el-button
          type="primary"
          size="large"
          :disabled="!commentText.trim() || submitting"
          class="btn-submit"
          @click="submitComment"
        >
          <span v-if="!submitting">发送</span>
          <el-icon v-else class="is-loading"><Loading /></el-icon>
        </el-button>
      </div>
    </div>
    
    <!-- 举报弹窗 -->
    <el-dialog
      v-model="showReportDialog"
      title="举报内容"
      width="30%"
      destroy-on-close
      append-to-body
    >
      <div class="report-dialog">
        <p class="report-title">请选择举报原因</p>
        <el-radio-group v-model="reportReason">
          <el-radio label="垃圾广告">垃圾广告</el-radio>
          <el-radio label="色情内容">色情内容</el-radio>
          <el-radio label="违法有害信息">违法有害信息</el-radio>
          <el-radio label="骗局信息">骗局信息</el-radio>
          <el-radio label="骚扰行为">骚扰行为</el-radio>
          <el-radio label="其他">其他</el-radio>
        </el-radio-group>
        
        <el-input
          v-if="reportReason === '其他'"
          v-model="customReason"
          type="textarea"
          :rows="3"
          placeholder="请详细描述举报原因"
          maxlength="200"
          show-word-limit
          class="custom-reason-input"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showReportDialog = false">取消</el-button>
          <el-button type="primary" @click="submitReport" :disabled="!reportReason || submittingReport">
            <span v-if="!submittingReport">提交举报</span>
            <el-icon v-else class="is-loading"><Loading /></el-icon>
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Close, ArrowLeft, Loading, Delete } from '@element-plus/icons-vue';
import { addComment, getCommentList, getCommentReplies, deleteComment, batchGetUserInfo, getAllCommentReplies } from '../../api/comment';
import { toggleLike, getLikeStatus } from '../../api/like';
import { submitReport as apiSubmitReport } from '../../api/report';
import { syncService } from '../../services/SyncService.js';

const props = defineProps({
  post: { type: Object, required: true }
});

const emit = defineEmits(['close', 'update-comment-count']);

// 基本状态
const visible = ref(true);
const loading = ref(false);
const submitting = ref(false);
const commentText = ref('');
const initialCommentCount = ref(0); // 用于记录动态原始评论数
const currentUserAvatar = ref('https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png');
const currentUserId = ref(localStorage.getItem('userId') || null);

// 举报相关状态
const showReportDialog = ref(false);
const reportReason = ref('');
const customReason = ref('');
const reportTarget = ref(null); // 要举报的评论对象
const reportType = ref(2); // 目标类型：2代表评论
const submittingReport = ref(false);

// 评论数据
const commentCount = ref(0); // 评论总数
const primaryComments = ref([]); // 一级评论列表
const secondaryComments = ref([]); // 二级评论列表（回复）
const activeRootComment = ref(null); // 当前查看回复的一级评论
const replyToComment = ref(null); // 当前回复的评论对象
const replyCount = ref(0); // 回复数量
const fetchCommentLikeStatus = async (commentId) => {
  try {
    // 评论类型点赞，targetType=1
    const response = await getLikeStatus(commentId, 1);
    if (response.code === 200) {
      return {
        isLiked: response.data.liked,
        likeCount: response.data.likeCount
      };
    }
    return { isLiked: false, likeCount: 0 };
  } catch (error) {
    console.error('获取评论点赞状态失败:', error);
    return { isLiked: false, likeCount: 0 };
  }
}

// 表情相关功能
const showEmojiPanel = ref(false); // 是否显示表情面板
const emojiPanelRef = ref(null); // 表情面板引用

// 常用表情集合
const emojis = [
  '😀', '😁', '😂', '😃', '😄', '😅', '😆',
  '😉', '😊', '😋', '😎', '😍', '😘', '😗',
  '😙', '😚', '🙂', '🥰', '😇', '🙃', '😏',
  '😌', '😒', '😜', '😝', '😞', '😔', '😢',
  '😣', '😤', '😥', '😨', '😪', '😭', '😱',
  '😳', '😵', '😶', '😕', '😟', '😫', '😬'
];

// 用户信息缓存
const userInfoCache = ref({}); // 用户信息缓存，避免重复请求
const commentListRef = ref(null); // 评论列表DOM引用
const repliesListRef = ref(null); // 回复列表DOM引用

// 后端已更新，commentNum字段直接返回该评论下的所有二级评论数量
// 因此不再需要额外获取完整回复数

// 获取一级评论列表
const fetchPrimaryComments = async () => {
  try {
    loading.value = true;
    
    // 获取帖子ID，优先使用postId，如果不存在则使用id
    const postIdValue = props.post.postId || props.post.id;
    
    if (!postIdValue) {
      console.error('错误: 无法获取帖子ID，帖子对象:', props.post);
      ElMessage.error('无法获取评论列表，帖子ID不存在');
      loading.value = false;
      return;
    }
    
    console.log('获取评论列表参数:', { postId: postIdValue });
    const response = await getCommentList(postIdValue);
    
    if (response.code === 200 && response.data) {
      // 设置评论列表
      primaryComments.value = response.data.map(comment => ({
        ...comment,
        isLiked: false // 默认未点赞，将会从服务端获取实际状态
      }));
      
      // 获取每个评论的点赞状态
      const likeStatusPromises = primaryComments.value.map(async (comment, index) => {
        const likeStatus = await fetchCommentLikeStatus(comment.commentId);
        primaryComments.value[index].isLiked = likeStatus.isLiked;
        primaryComments.value[index].likeNum = likeStatus.likeCount;
      });
      
      // 等待所有点赞状态获取完成
      await Promise.all(likeStatusPromises);
      
      // 计算总评论数 = 一级评论数 + 所有二级评论数
      // 现在后端直接返回准确的commentNum，所以可以直接累加
      let totalCommentCount = primaryComments.value.length;
      
      // 累加所有一级评论下的二级评论数量
      for (const comment of primaryComments.value) {
        totalCommentCount += comment.commentNum || 0;
      }
      
      // 更新总评论数
      commentCount.value = totalCommentCount;
      console.log('动态总评论数（一级评论 + 所有二级评论）:', totalCommentCount);
      
      // 收集所有用户ID进行批量查询
      const userIds = primaryComments.value.map(comment => comment.userId);
      if (userIds.length > 0) {
        await fetchUserInfo(userIds);
      }
    } else {
      primaryComments.value = [];
      commentCount.value = 0;
    }
  } catch (error) {
    console.error('获取评论列表失败:', error);
    ElMessage.error('获取评论列表失败');
    primaryComments.value = [];
  } finally {
    loading.value = false;
  }
};

// 获取二级评论列表（所有回复）
const fetchSecondaryComments = async (rootComment) => {
  try {
    loading.value = true;
    console.log('开始获取根评论的所有回复，根评论 ID:', rootComment.commentId);
    
    // 严格按照API文档使用getAllCommentReplies获取所有二级评论
    const response = await getAllCommentReplies(rootComment.commentId);
    console.log('获取到的所有二级评论数据:', response);
    
    if (response.code === 200 && response.data) {
      // 将所有评论按时间排序，以确保新评论在底部
      const sortedComments = [...response.data].sort((a, b) => {
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      
      secondaryComments.value = sortedComments.map(comment => ({
        ...comment,
        isLiked: false // 默认未点赞，将从服务端获取实际状态
      }));
      
      // 获取每个二级评论的点赞状态
      const likeStatusPromises = secondaryComments.value.map(async (comment, index) => {
        const likeStatus = await fetchCommentLikeStatus(comment.commentId);
        secondaryComments.value[index].isLiked = likeStatus.isLiked;
        secondaryComments.value[index].likeNum = likeStatus.likeCount;
      });
      
      // 等待所有点赞状态获取完成
      await Promise.all(likeStatusPromises);
      
      // 仅在二级评论计数与服务器返回不符时更新
      // 注意：此处不能直接覆盖为二级评论数组长度，因为API可能只返回部分评论
      // 正确的计数应该从一级评论的commentNum属性中获取
      
      // 设置二级评论区的评论数量
      replyCount.value = secondaryComments.value.length;
      console.log('二级评论总数:', replyCount.value);
      
      // 收集所有用户ID进行批量查询
      const userIds = secondaryComments.value.map(comment => comment.userId);
      
      // 收集引用的用户ID（对于@用户名的情况）
      const parentUserIds = [];
      
      // 检查每条评论是否引用了其他用户
      secondaryComments.value.forEach(comment => {
        const content = comment.content || '';
        // 找出内容中的@用户名
        const match = content.match(/@([^\s]+)/);
        if (match && match[1]) {
          // 尝试在用户缓存中找到对应的用户ID
          for (const [userId, info] of Object.entries(userInfoCache.value)) {
            if (info && info.nickname === match[1]) {
              parentUserIds.push(userId);
              break;
            }
          }
        }
      });
      
      const allUserIds = [...new Set([...userIds, ...parentUserIds])];
      if (allUserIds.length > 0) {
        await fetchUserInfo(allUserIds);
      }
    } else {
      secondaryComments.value = [];
      replyCount.value = 0;
      console.log('没有找到二级评论');
    }
  } catch (error) {
    console.error('获取回复列表失败:', error);
    ElMessage.error('获取回复列表失败');
    secondaryComments.value = [];
  } finally {
    loading.value = false;
  }
};

// 批量获取用户信息
const fetchUserInfo = async (userIds) => {
  try {
    // 过滤出未缓存的用户ID
    const uncachedUserIds = userIds.filter(id => !userInfoCache.value[id]);
    if (uncachedUserIds.length === 0) return;
    
    console.log('请求用户信息:', uncachedUserIds);
    const response = await batchGetUserInfo(uncachedUserIds);
    console.log('获取的用户信息响应:', response);
    
    if (response.code === 200 && response.data) {
      // 将新获取的用户信息添加到缓存中
      Object.entries(response.data).forEach(([userId, userInfo]) => {
        console.log(`缓存用户 ${userId} 信息:`, userInfo);
        userInfoCache.value[userId] = userInfo;
      });
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

// 格式化时间
const formatTime = (timeStr) => {
  const now = new Date();
  const time = new Date(timeStr);
  const diff = now - time;
  
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  
  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前';
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前';
  } else {
    return Math.floor(diff / day) + '天前';
  }
};

// 格式化数字
const formatNumber = (num) => {
  return num > 0 ? num : '';
};

// 点赞评论
const likeComment = async (comment) => {
  try {
    // 先更新UI，提高响应速度
    const originalLiked = comment.isLiked;
    comment.isLiked = !comment.isLiked;
    comment.likeNum += comment.isLiked ? 1 : -1;
    
    // 调用点赞切换API
    // 评论类型点赞，targetType=1
    const response = await toggleLike(comment.commentId, 1);
    
    if (response.code === 200) {
      // 使用服务器返回的正确数据更新UI
      comment.isLiked = response.data.liked;
      comment.likeNum = response.data.likeCount;
      console.log('评论点赞状态已更新:', response.data);
    } else {
      // 如果请求失败，恢复原始状态
      comment.isLiked = originalLiked;
      comment.likeNum = originalLiked ? (comment.likeNum + 1) : (comment.likeNum - 1);
      ElMessage.error('点赞操作失败: ' + response.message);
    }
  } catch (error) {
    console.error('点赞评论失败:', error);
    ElMessage.error('点赞操作失败，请重试');
  }
};

// 查看二级评论（回复）
const viewReplies = async (comment) => {
  activeRootComment.value = comment;
  await fetchSecondaryComments(comment);
};

// 返回一级评论列表
const backToMainComments = () => {
  activeRootComment.value = null;
  secondaryComments.value = [];
};

// 回复评论
const handleReplyToComment = (comment) => {
  replyToComment.value = comment;
  // 设置输入框初始值为@用户名
  commentText.value = `@${getUserName(comment.userId)} `;
  // 聚焦到输入框
  nextTick(() => {
    const input = document.querySelector('.comment-input input');
    if (input) {
      input.focus();
      // 将光标移动到文本末尾
      input.selectionStart = input.selectionEnd = commentText.value.length;
    }
  });
};

// 取消回复
const cancelReply = () => {
  replyToComment.value = null;
  commentText.value = '';
};

// 获取输入框提示文本
const getInputPlaceholder = () => {
  return '说点什么...';
};

// 提交评论
const submitComment = async () => {
  if (!commentText.value.trim() || submitting.value) {
    return;
  }
  
  submitting.value = true;
  
  try {
    // 获取帖子ID
    const postIdValue = props.post.postId || props.post.id;
    
    if (!postIdValue) {
      ElMessage.error('无法获取帖子ID，评论失败');
      submitting.value = false;
      return;
    }
    
    // 初始化数据对象
    const data = {
      postId: postIdValue,
      content: commentText.value.trim()
    };
    
    // 只处理parentCommentId，不要管rootCommentId
    
    // 规则一：当回复某个评论时，被回复评论就是父评论
    if (replyToComment.value) {
      data.parentCommentId = replyToComment.value.commentId;
      
      // 添加@用户名到评论内容
      if (!data.content.includes(`@${getUserName(replyToComment.value.userId)}`)) {
        data.content = `@${getUserName(replyToComment.value.userId)} ${data.content}`;
      }
    }
    // 规则二：如果没有回复任何评论
    else {
      // 在一级评论区：直接使用-1
      if (!activeRootComment.value) {
        data.parentCommentId = '-1';
      }
      // 在二级评论区：使用当前浏览的一级评论 ID
      else {
        data.parentCommentId = activeRootComment.value.commentId;
      }
    }
    
    const response = await addComment(data);
    
    if (response.code === 200) {
      ElMessage.success('评论成功');
      commentText.value = '';
      
      // 如果在查看二级评论区，更新计数并刷新列表
      if (activeRootComment.value) {
        // 使用变量缓存变更前的评论数，以便后续判断
        const prevCommentNum = activeRootComment.value.commentNum || 0;
        
        // 重新获取二级评论列表，更新UI
        await fetchSecondaryComments(activeRootComment.value);
        
        // 如果服务器返回的评论数与原数相同，则手动将计数+1
        if (activeRootComment.value.commentNum === prevCommentNum) {
          activeRootComment.value.commentNum += 1;
          replyCount.value = activeRootComment.value.commentNum;
        }
      }
      
      // 无论在哪个评论区，都需要重新获取一级评论列表
      // 以更新总评论数和各个一级评论的二级评论数
      await fetchPrimaryComments();
      
      // 通过事件将评论数变化发送给父组件
      emit('update-comment-count', commentCount.value);
      
      // 直接触发事件通知前端更新评论数量
      const postId = props.post.postId || props.post.id;
      if (postId) {
        // 使用自定义事件直接更新UI
        document.dispatchEvent(new CustomEvent('comment-updated', {
          detail: { postId, commentCount: commentCount.value }
        }));
      }
      
      // 取消回复状态
      replyToComment.value = null;
    } else {
      ElMessage.error(response.message || '评论失败');
    }
  } catch (error) {
    console.error('提交评论失败:', error);
    ElMessage.error('提交评论失败');
  } finally {
    submitting.value = false;
  }
};

// 获取评论的父评论用户ID
const getParentUserId = (comment) => {
  // 如果没有父评论，返回空
  if (!comment || !comment.parentCommentId || comment.parentCommentId === '-1') {
    return null;
  }
  
  // 如果父评论就是当前浏览的一级评论，返回其用户ID
  if (activeRootComment.value && comment.parentCommentId === activeRootComment.value.commentId) {
    return activeRootComment.value.userId;
  }
  
  // 在二级评论列表中寻找父评论
  const parentComment = secondaryComments.value.find(c => c.commentId === comment.parentCommentId);
  return parentComment ? parentComment.userId : null;
};

// 获取用户头像
const getUserAvatar = (userId) => {
  if (!userId) return 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
  
  const userInfo = userInfoCache.value[userId];
  // 试回不同的字段名，兼容不同的API返回格式
  return userInfo && (userInfo.avatar || userInfo.avatarUrl) 
    ? (userInfo.avatar || userInfo.avatarUrl) 
    : 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
};

// 获取用户名称
const getUserName = (userId) => {
  if (!userId) return '未知用户';
  
  const userInfo = userInfoCache.value[userId];
  return userInfo && userInfo.nickname ? userInfo.nickname : `用户${userId}`;
};

// 关闭模态框
const closeModal = () => {
  visible.value = false;
  activeRootComment.value = null;
  replyToComment.value = null;
  emit('close');
};

// 处理举报按钮点击
const handleReport = (target, type) => {
  reportTarget.value = target;
  reportType.value = type || 2; // 评论类型默认为2
  reportReason.value = '';
  customReason.value = '';
  showReportDialog.value = true;
};

// 提交举报
const submitReport = async () => {
  try {
    // 确定最终的举报原因
    const reason = reportReason.value === '其他' ? customReason.value : reportReason.value;
    
    if (reportReason.value === '其他' && !customReason.value.trim()) {
      ElMessage.warning('请输入举报原因');
      return;
    }
    
    submittingReport.value = true;
    
    // 确保 targetId 是整数类型
    const targetId = parseInt(reportTarget.value.commentId || reportTarget.value.id);
    if (isNaN(targetId)) {
      ElMessage.error('目标ID无效');
      submittingReport.value = false;
      return;
    }
    
    // 使用统一的API函数
    const response = await apiSubmitReport(targetId, reportType.value, reason);
    
    submittingReport.value = false;
    
    if (response.code === 200) {
      ElMessage.success('举报成功，我们会尽快处理');
      showReportDialog.value = false;
    } else {
      ElMessage.error(response.message || '举报失败，请稍后再试');
    }
  } catch (error) {
    submittingReport.value = false;
    console.error('提交举报错误:', error);
    if (error.response && error.response.data && error.response.data.message) {
      ElMessage.error(error.response.data.message);
    } else {
      ElMessage.error('网络错误，请稍后再试');
    }
  }
};

// 获取当前用户头像
const getCurrentUserAvatar = () => {
  const avatar = localStorage.getItem('userAvatar');
  if (avatar) {
    currentUserAvatar.value = avatar;
  }
};

// 处理表情按钮点击
const handleEmojiClick = () => {
  showEmojiPanel.value = !showEmojiPanel.value;
};

// 插入表情
const insertEmoji = (emoji) => {
  const input = document.querySelector('.comment-input input');
  if (input) {
    const startPos = input.selectionStart;
    const endPos = input.selectionEnd;
    commentText.value = commentText.value.substring(0, startPos) + emoji + commentText.value.substring(endPos);
    // 将光标移动到表情后面
    nextTick(() => {
      input.focus();
      const newCursorPos = startPos + emoji.length;
      input.selectionStart = input.selectionEnd = newCursorPos;
    });
  } else {
    commentText.value += emoji;
  }
  showEmojiPanel.value = false;
};

// 点击外部关闭表情面板
const closeEmojiPanel = (event) => {
  if (showEmojiPanel.value && emojiPanelRef.value && !emojiPanelRef.value.contains(event.target)) {
    const emojiButton = document.querySelector('.emoji-button');
    if (emojiButton && !emojiButton.contains(event.target)) {
      showEmojiPanel.value = false;
    }
  }
};

// 获取动态原始评论数
const getInitialCommentCount = () => {
  // 使用props中的post对象中的commentNum
  initialCommentCount.value = props.post.commentNum || 0;
  console.log('动态原始评论数:', initialCommentCount.value);
};

// 检查并更新评论数
const checkAndUpdateCommentCount = () => {
  // 如果计算出的评论数与动态原始评论数不一致
  if (commentCount.value !== initialCommentCount.value) {
    console.log('评论数量变化，原始数:', initialCommentCount.value, '新数量:', commentCount.value);
    
    // 更新UI和通知父组件
    emit('update-comment-count', commentCount.value);
    
    // 直接触发事件通知前端更新评论数量
    const postId = props.post.postId || props.post.id;
    if (postId) {
      document.dispatchEvent(new CustomEvent('comment-updated', {
        detail: { postId, commentCount: commentCount.value }
      }));
    }
  }
};

// 初始化
onMounted(async () => {
  // 打印post对象结构，查看实际字段
  console.log('帖子对象结构:', props.post);
  console.log('帖子ID字段:', {
    'props.post.id': props.post.id,
    'props.post.postId': props.post.postId,
  });
  
  // 记录动态原始评论数
  getInitialCommentCount();
  
  // 获取评论列表
  await fetchPrimaryComments();
  
  // 检查并更新评论数
  checkAndUpdateCommentCount();
  
  getCurrentUserAvatar();
  document.addEventListener('click', closeEmojiPanel);
});

// 组件卸载前清理事件监听
onBeforeUnmount(() => {
  document.removeEventListener('click', closeEmojiPanel);
});

// 监听帖子变化
watch(() => props.post, async () => {
  activeRootComment.value = null;
  replyToComment.value = null;
  await fetchPrimaryComments();
});
</script>

<style scoped>
/* 覆盖层样式 */
.new-comment-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2500;
}

/* 主容器样式 */
.new-comment-modal-container {
  background-color: #fff;
  position: relative;
  padding: 24px;
  border-radius: 12px;
  width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
}

.new-comment-modal-content {
  flex: 1;
  padding: 0 20px;
  overflow-y: auto;
  max-height: calc(90vh - 140px);
}

/* 模态框标题区 */
.new-comment-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.new-comment-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.new-comment-modal-close {
  cursor: pointer;
  font-size: 20px;
  color: #999;
  transition: color 0.2s;
}

.new-comment-modal-close:hover {
  color: #333;
}

/* 原动态样式 */
.original-post {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f7f8fa;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
  margin-left: 1px;
  margin-right: 1px;
  font-size: 15px;
  width: calc(100% - 2px);
  box-sizing: border-box;
}

.original-post .username {
  font-weight: 600;
  color: #1677ff;
  margin-right: 8px;
}

.original-post .post-content {
  color: #333;
  margin-left: 8px;
}

/* 评论列表样式 */
.comment-list {
  height: 380px;
  max-height: 380px;
  overflow-y: auto;
  margin-bottom: 10px;
  padding-right: 5px;
  width: 100%;
  box-sizing: border-box;
}

.comment-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

/* 二级评论区的样式已简化，所有评论平级显示 */

/* 被回复用户样式 */
.reply-to {
  color: #1677ff;
  margin-right: 4px;
  font-weight: 500;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-user {
  font-size: 15px;
  font-weight: 500;
  color: #1677ff;
}

.comment-text {
  font-size: 15px;
  color: #222;
  margin: 2px 0 4px 0;
  word-break: break-all;
}

.comment-footer {
  display: flex;
  align-items: center;
  gap: 18px;
  font-size: 13px;
  color: #888;
}

.comment-action {
  padding: 0 4px;
  font-size: 13px;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
}

.comment-action:hover {
  color: #1677ff;
  background: #f4f8ff;
}

/* 无评论提示 */
.no-comments {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #bbb;
  font-size: 15px;
  margin: 0;
  padding: 40px 0;
  min-height: 160px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.no-comments-icon {
  margin-bottom: 16px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-comments i {
  font-size: 28px;
  color: #909399;
}

.no-comments-text {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

/* 评论输入区域 */
.comment-input-area {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-top: 1px solid #f0f0f0;
  background-color: white;
  margin-top: 0;
  position: sticky;
  bottom: 0;
  width: 100%;
  z-index: 5;
}

.current-user-avatar {
  flex-shrink: 0;
}

.input-wrapper {
  flex: 1;
  position: relative;
}

.input-container {
  display: flex;
  align-items: center;
  position: relative;
}

.comment-input {
  flex: 1;
}

.btn-submit {
  flex-shrink: 0;
}

/* 表情选择器样式 */
.emoji-button {
  margin-left: 8px;
  padding: 5px;
  cursor: pointer;
  color: #909399;
  font-size: 18px;
  border-radius: 4px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.emoji-button:hover {
  color: #1677ff;
  background-color: rgba(22, 119, 255, 0.1);
}

.emoji-panel {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  width: 320px;
  max-height: 220px;
  overflow-y: auto;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  height: 30px;
  font-size: 18px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.emoji-item:hover {
  background-color: #f0f2f5;
}

/* 加载动画 */
.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  min-height: 200px;
}

.loading-text {
  margin-top: 16px;
  color: #909399;
  font-size: 14px;
}

.loading-animation {
  position: relative;
  width: 60px;
  height: 20px;
}

.dot-pulse {
  position: relative;
  left: 0;
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: #1677ff;
  color: #1677ff;
  animation: dot-pulse 1.5s infinite linear;
  animation-delay: 0.25s;
}

.dot-pulse::before,
.dot-pulse::after {
  content: '';
  display: inline-block;
  position: absolute;
  top: 0;
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: #1677ff;
  color: #1677ff;
}

.dot-pulse::before {
  left: -16px;
  animation: dot-pulse 1.5s infinite linear;
  animation-delay: 0s;
}

.dot-pulse::after {
  left: 16px;
  animation: dot-pulse 1.5s infinite linear;
  animation-delay: 0.5s;
}

@keyframes dot-pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.8;
  }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
