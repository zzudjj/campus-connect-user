<!-- 动态页面组件 -->
<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <el-header class="navbar">
      <div class="nav-brand">校园社交</div>
      <el-tabs v-model="activeTab" class="nav-tabs" @tab-click="handleTabClick">
        <el-tab-pane label="综合" name="all" />
        <el-tab-pane label="视频" name="video" />
        <el-tab-pane label="用户" name="user" />
        <el-tab-pane label="直播" name="live" />
      </el-tabs>
      <el-input v-model="searchText" placeholder="搜索" class="nav-search" clearable prefix-icon="el-icon-search" />
      <el-avatar :src="userAvatar" class="nav-avatar" @click="goToProfile" style="cursor:pointer;" />
    </el-header>
    <el-main class="main-content">
      <!-- 侧边栏导航 -->
      <el-aside class="sidebar">
        <el-menu :default-active="activeSidebar" class="el-menu-vertical-demo" @select="handleSidebarSelect">
          <el-menu-item index="home"><el-icon><House /></el-icon>首页</el-menu-item>
          <el-menu-item index="explore"><el-icon><Search /></el-icon>发现</el-menu-item>
          <el-menu-item index="follow"><el-icon><UserFilled /></el-icon>关注</el-menu-item>
          <el-menu-item index="friends"><el-icon><User /></el-icon>朋友</el-menu-item>
          <el-menu-item index="profile"><el-icon><Avatar /></el-icon>我的</el-menu-item>
          <el-menu-item index="live"><el-icon><VideoCamera /></el-icon>直播</el-menu-item>
          <el-menu-item index="theater"><el-icon><VideoPlay /></el-icon>放映厅</el-menu-item>
          <el-menu-item index="game"><el-icon><Gamepad /></el-icon>游戏</el-menu-item>
        </el-menu>
      </el-aside>
      <!-- 主内容区 -->
      <div class="content">
        <el-tabs v-model="activeCategory" class="category-tabs" @tab-click="handleCategoryClick">
          <el-tab-pane v-for="cat in categories" :key="cat" :label="cat" :name="cat" />
        </el-tabs>
        <div class="post-list">
          <el-card v-for="post in postList" :key="post.id" class="post-item" shadow="hover">
            <template #header>
              <div class="post-header">
                <el-avatar :src="post.userAvatar" />
                <div class="user-info">
                  <div class="username">{{ post.username }}</div>
                  <div class="post-time">{{ formatTime(post.createTime) }}</div>
                </div>
                <el-button v-if="!post.isFollowed" type="primary" size="small" @click="handleFollow(post)">关注</el-button>
              </div>
            </template>
            <div class="post-content">{{ post.content }}</div>
            <div class="post-images" v-if="post.images && post.images.length">
              <el-image v-for="(img, idx) in post.images" :key="idx" :src="img" fit="cover" class="post-image" :preview-src-list="post.images" :initial-index="idx" />
            </div>
            <div class="post-actions">
              <el-tooltip content="点赞" placement="top">
                <el-button :type="post.isLiked ? 'danger' : 'default'" size="small" text @click="handleLike(post)">
                  <el-icon><StarFilled /></el-icon>{{ post.likeCount }}
                </el-button>
              </el-tooltip>
              <el-tooltip content="评论" placement="top">
                <el-button size="small" text>
                  <el-icon><ChatDotRound /></el-icon>{{ post.commentCount }}
                </el-button>
              </el-tooltip>
              <el-tooltip content="分享" placement="top">
                <el-button size="small" text>
                  <el-icon><Share /></el-icon>分享
                </el-button>
              </el-tooltip>
            </div>
          </el-card>
        </div>
      </div>
      <!-- 右侧推荐区域 -->
      <el-aside class="recommendation">
        <el-card class="recommend-card" shadow="hover">
          <div class="recommend-title">推荐搜索</div>
          <el-list>
            <el-list-item v-for="(item, idx) in recommendList" :key="idx">
              <el-icon><Search /></el-icon>{{ item }}
            </el-list-item>
          </el-list>
        </el-card>
      </el-aside>
    </el-main>
    <!-- 发布按钮 -->
    <el-button class="publish-btn" type="primary" circle size="large" @click="navigateToPost">
      <el-icon><Plus /></el-icon>
    </el-button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getPostList, likePost } from '../api/post';
import { ElMessage } from 'element-plus';
import {
  House, Search, UserFilled, User, Avatar, VideoCamera, VideoPlay, Gamepad, StarFilled, ChatDotRound, Share, Plus
} from '@element-plus/icons-vue';

const router = useRouter();
const userAvatar = ref('https://via.placeholder.com/40');
const searchText = ref('');
const activeTab = ref('all');
const activeSidebar = ref('home');
const activeCategory = ref('全部');
const categories = [
  '全部', '同城', '校园', '学科', '热点课堂', '音乐', '电视剧', '影视原片', '明星', '游戏', '情感', '课堂', '更多'
];
const recommendList = [
  '抖音下载', '抖音电脑版下载', '抖音极速版', '抖音小店', '抖音客服手机入口', '抖音怎么直接进入'
];
const postList = ref([]);

const fetchPostList = async () => {
  try {
    const res = await getPostList({ page: 1, pageSize: 10 });
    postList.value = res.data.list;
  } catch (error) {
    ElMessage.error('获取动态列表失败');
  }
};

const formatTime = (timeStr) => {
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now - date;
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  if (diff < minute) return '刚刚';
  if (diff < hour) return Math.floor(diff / minute) + '分钟前';
  if (diff < day) return Math.floor(diff / hour) + '小时前';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const handleTabClick = (tab) => {
  // 可根据tab切换加载不同内容
};
const handleSidebarSelect = (key) => {
  if (key === 'profile') {
    router.push('/user');
  }
  // 可根据侧边栏切换
};
const handleCategoryClick = (tab) => {
  // 可根据分类切换
};
const handleLike = async (post) => {
  try {
    await likePost(post.id, !post.isLiked);
    post.isLiked = !post.isLiked;
    post.likeCount += post.isLiked ? 1 : -1;
  } catch (error) {
    ElMessage.error('操作失败');
  }
};
const handleFollow = (post) => {
  post.isFollowed = true;
  ElMessage.success('关注成功');
};
const navigateToPost = () => {
  router.push('/post');
};
const goToProfile = () => {
  router.push('/user');
};
onMounted(fetchPostList);
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
  position: relative;
}
.navbar {
  display: flex;
  align-items: center;
  padding: 0 32px;
  height: 64px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  border-radius: 0 0 16px 16px;
  z-index: 10;
}
.nav-brand {
  font-size: 22px;
  font-weight: bold;
  color: #1677ff;
  margin-right: 32px;
}
.nav-tabs {
  flex: 1;
  margin-right: 32px;
}
.nav-search {
  width: 220px;
  margin-right: 24px;
}
.nav-avatar {
  width: 40px;
  height: 40px;
}
.main-content {
  display: flex;
  flex: 1;
  padding: 24px 32px 0 32px;
  gap: 24px;
}
.sidebar {
  width: 120px;
  background: transparent;
}
.content {
  flex: 1;
  min-width: 0;
}
.category-tabs {
  margin-bottom: 18px;
}
.post-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.post-item {
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s;
}
.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-info {
  flex: 1;
}
.username {
  font-weight: 600;
  color: #1677ff;
}
.post-time {
  font-size: 13px;
  color: #888;
}
.post-content {
  font-size: 16px;
  color: #222;
  margin: 8px 0 12px 0;
}
.post-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
.post-image {
  width: 96px;
  height: 96px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
}
.post-actions {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 6px;
}
.recommendation {
  width: 220px;
}
.recommend-card {
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  padding: 18px 12px;
}
.recommend-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}
.publish-btn {
  position: fixed;
  right: 48px;
  bottom: 48px;
  z-index: 100;
  box-shadow: 0 4px 16px rgba(22,119,255,0.18);
  animation: popin 0.3s;
}
@keyframes popin {
  0% { transform: scale(0.7); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
