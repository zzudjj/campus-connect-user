<template>
  <aside class="main-hotlist">
    <el-card class="hotlist-sticky">
      <div class="hotlist-title">校园热点榜</div>
      <!-- 加载中状态 -->
      <div v-if="loading" class="hotlist-loading">
        <el-skeleton :rows="5" animated />
      </div>
      <!-- 错误状态 -->
      <div v-else-if="error" class="hotlist-error">
        <el-empty description="加载热点榜失败" :image-size="60">
          <el-button type="primary" size="small" @click="fetchHotList">重试</el-button>
        </el-empty>
      </div>
      <!-- 正常列表 -->
      <div v-else class="hotlist-list">
        <div 
          v-for="(item, idx) in hotList" 
          :key="item.postId" 
          class="hotlist-item"
          @click="navigateToPost(item.postId)"
        >
          <span class="hotlist-rank" :class="'rank-' + (idx+1)">{{ idx+1 }}</span>
          <span class="hotlist-title-text">{{ item.title }}</span>
          <span class="hotlist-score">{{ item.hotScore }}</span>
        </div>
      </div>
    </el-card>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getTopHotBrief } from '../../api/post';

const router = useRouter();
const hotList = ref([]);
const loading = ref(true);
const error = ref(false);

// 获取热门动态列表
 const fetchHotList = async () => {
  loading.value = true;
  error.value = false;
  
  try {
    const response = await getTopHotBrief();
    if (response.code === 200) {
      hotList.value = response.data;
    } else {
      throw new Error(response.message || '获取热门动态失败');
    }
  } catch (err) {
    console.error('获取热点榜失败:', err);
    error.value = true;
    ElMessage.error('热点榜加载失败');
  } finally {
    loading.value = false;
  }
};

// 点击热门动态跳转到详情页
const navigateToPost = (postId) => {
  router.push(`/post/${postId}`);
};

// 组件挂载时获取数据
onMounted(() => {
  fetchHotList();
});
</script>

<style scoped>
.main-hotlist {
  width: 270px;
  flex-shrink: 0;
  margin-left: 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.hotlist-sticky {
  position: sticky;
  top: 20px;
  width: 100%;
  background: #fff7f7;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(255,42,69,0.06);
  padding: 22px 18px 18px 18px;
}
.hotlist-title {
  font-size: 17px;
  font-weight: 600;
  color: #ff2a45;
  margin-bottom: 18px;
  letter-spacing: 1px;
}
.hotlist-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.hotlist-item {
  display: flex;
  align-items: center;
  font-size: 15px;
  color: #333;
  cursor: pointer;
  transition: color 0.2s;
}
.hotlist-item:hover {
  color: #ff2a45;
}
.hotlist-rank {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  margin-right: 10px;
  background: #ffeaea;
  color: #ff2a45;
}
.hotlist-rank.rank-1 { background: #ff2a45; color: #fff; }
.hotlist-rank.rank-2 { background: #ff6a00; color: #fff; }
.hotlist-rank.rank-3 { background: #ffaa00; color: #fff; }

.hotlist-title-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hotlist-score {
  margin-left: 6px;
  font-size: 13px;
  color: #ff2a45;
  font-weight: 600;
}
</style> 