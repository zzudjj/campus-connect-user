// 引入样式
import './assets/css/global.css'
import './assets/css/custom-image-preview.css'
import './assets/css/modal-overrides.css' // 引入模态框样式覆盖

// 引入核心库和组件
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 引入第三方库
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import Masonry from 'vue-masonry-css'

// 引入Pinia状态管理
import { createPinia } from 'pinia'
import axios from 'axios'

// 创建应用实例
const app = createApp(App)
const pinia = createPinia()

// 使用插件
app.use(router)
app.use(ElementPlus)
app.use(pinia)
app.component('Masonry', Masonry)

// 注册ElementPlus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(`i-ep-${key}`, component)
}

// 全局属性
app.config.globalProperties.$filters = {
  // 格式化时间
  formatTime(timeStr) {
    const date = new Date(timeStr);
    const now = new Date();
    
    const diff = now - date;
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
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  },
  
  // 格式化数字
  formatNumber(num) {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num;
  }
};

// 挂载应用
app.mount('#app')
