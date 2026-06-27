<template>
  <div class="thinking-row">
    <!-- 8瓣完整菊花SVG -->
    <svg class="rotate-icon" width="32" height="32" viewBox="0 0 100 100" fill="#333">
      <!-- 8根短线，每根间隔45度，圆角矩形匹配原图样式 -->
      <rect x="46" y="2" width="8" height="22" rx="4" />
      <rect x="46" y="2" width="8" height="22" rx="4" transform="rotate(45 50 50)" />
      <rect x="46" y="2" width="8" height="22" rx="4" transform="rotate(90 50 50)" />
      <rect x="46" y="2" width="8" height="22" rx="4" transform="rotate(135 50 50)" />
      <rect x="46" y="2" width="8" height="22" rx="4" transform="rotate(180 50 50)" />
      <rect x="46" y="2" width="8" height="22" rx="4" transform="rotate(225 50 50)" />
      <rect x="46" y="2" width="8" height="22" rx="4" transform="rotate(270 50 50)" />
      <rect x="46" y="2" width="8" height="22" rx="4" transform="rotate(315 50 50)" />
    </svg>
  </div>
</template>

<script setup>
// 无业务逻辑，纯CSS动画
</script>

<style scoped>
.thinking-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 36px;
  color: #222;
}
/* 无限匀速旋转 */
.rotate-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
