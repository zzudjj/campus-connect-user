<template>
  <aside class="main-hotlist">
    <el-card class="hotlist-sticky">
      <div class="hotlist-title">校园热点榜</div>
      <div class="hotlist-list">
        <div v-for="(item, idx) in hotList" :key="item.id" class="hotlist-item">
          <span class="hotlist-rank" :class="'rank-' + (idx+1)">{{ idx+1 }}</span>
          <span>{{ item.title }}</span>
        </div>
      </div>
    </el-card>
  </aside>
</template>

<script setup>
import { ref } from 'vue';
const hotList = ref([
  { id: 1, title: '表白墙今日最热' },
  { id: 2, title: '食堂新菜品投票' },
  { id: 3, title: '校园歌手大赛决赛' },
  { id: 4, title: '期末复习资料分享' },
  { id: 5, title: '运动会精彩瞬间' },
]);
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
</style> 