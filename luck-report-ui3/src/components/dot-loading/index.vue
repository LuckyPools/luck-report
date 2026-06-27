<template>
  <div class="dot-loading">
    <i></i>
    <i></i>
    <i></i>
  </div>
</template>

<script setup></script>

<style>
/* 组件内部变量改用组件根class，脱离:root scoped限制 */
.dot-loading {
  --dot-loading-size: 8px;
  display: inline-flex;
  gap: 6px;
  align-items: center;
}
.dot-loading > i {
  width: 6px;
  height: 6px;
  background: var(--color-primary, #00554a);
  border-radius: 50%;
  animation: eleChatLoadingAnim 1.2s ease-in-out infinite forwards;
}
.dot-loading > i:nth-child(1) { animation-delay: 0s; }
.dot-loading > i:nth-child(2) { animation-delay: 0.2s; }
.dot-loading > i:nth-child(3) { animation-delay: 0.4s; }

@keyframes eleChatLoadingAnim {
  0% {
    transform: translateY(0);
  }

  10% {
    transform: translateY(4px);
  }
  20% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
  40% {
    transform: translateY(0);
  }
}
</style>
