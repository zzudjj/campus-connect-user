import { createRouter, createWebHistory } from 'vue-router';
import MainPage from '../views/MainPage.vue';
import FeedPage from '../views/FeedPage.vue';
import UserProfile from '../views/UserProfile.vue';
import FriendsPage from '../views/FriendsPage.vue';
import ChatPage from '../views/ChatPage.vue';

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
      }
      // 这里可继续添加其它主内容区页面
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
