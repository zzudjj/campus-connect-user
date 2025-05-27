<!-- 图标组件 -->
<template>
  <i class="icon" :class="iconClass">
    <slot></slot>
  </i>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // 图标名称
  name: {
    type: String,
    required: true
  },
  // 图标大小
  size: {
    type: [Number, String],
    default: '16px'
  },
  // 图标颜色
  color: {
    type: String,
    default: ''
  }
});

// 计算图标的CSS类名
const iconClass = computed(() => {
  return {
    [`icon-${props.name}`]: true
  }
});
</script>

<style scoped>
.icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-style: normal;
}

/* 不同大小的图标 */
.icon-sm {
  font-size: 14px;
}

.icon-md {
  font-size: 18px;
}

.icon-lg {
  font-size: 24px;
}
</style>
