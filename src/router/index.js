import { createRouter, createWebHistory } from 'vue-router';
import MainPage from '../views/MainPage.vue';
import FeedPage from '../views/FeedPage.vue';
import UserProfile from '../views/UserProfile.vue';
import UserProfilePage from '../views/UserProfilePage.vue';
import UserEditProfile from '../views/UserEditProfile.vue';
import FriendsPage from '../views/FriendsPage.vue';
import ChatPage from '../views/ChatPage.vue';
import VerificationPage from '../views/VerificationPage.vue';
import NotificationPage from '../views/NotificationPage.vue';

const routes = [
  {
    path: '/',
    component: MainPage,
    children: [
      {
        path: '',
        name: 'Feed',
        component: FeedPage
      },
      {
        path: 'user',
        name: 'UserProfile',
        component: UserProfile
      },
      // 好友模块
      {
        path: 'friends',
        name: 'Friends',
        component: FriendsPage
      },
      // 聊天模块
      {
        path: 'chat',
        name: 'Chat',
        component: ChatPage
      },
      // 通知模块
      {
        path: 'notification',
        name: 'Notification',
        component: NotificationPage
      }
      // 这里可继续添加其它主内容区页面
    ]
  },
  // 校园卡认证页面 - 独立页面不包含顶栏和侧边栏
  {
    path: '/verification',
    name: 'Verification',
    component: VerificationPage
  },
  // 编辑个人资料页面
  {
    path: '/profile/edit',
    name: 'UserEditProfile',
    component: UserEditProfile,
    meta: { requiresAuth: true }
  },
  // 用户公开资料页面
  {
    path: '/user/:id',
    name: 'UserProfilePage',
    component: UserProfilePage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 不需要登录就可以访问的白名单路径
const publicPages = ['/', '/verification'];
// 不需要登录就可以访问的路径前缀
const publicPathPrefixes = ['/user/'];

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 检查是否有token
  const token = localStorage.getItem('token');
  
  // 检查是否为公开页面或以公开路径前缀开头
  const isPublicPage = publicPages.includes(to.path) || to.path.startsWith('/?');
  const hasPublicPrefix = publicPathPrefixes.some(prefix => to.path.startsWith(prefix));
  
  if (!token && !isPublicPage && !hasPublicPrefix) {
    console.log('检测到未登录状态且访问需要登录的页面，触发登录事件');
    
    // 跳转到首页
    next('/');
    
    // 使用延时确保路由完成后再触发登录模态框
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('show-auth-modal'));
    }, 100);
  } else {
    next();
  }
});

export default router;
