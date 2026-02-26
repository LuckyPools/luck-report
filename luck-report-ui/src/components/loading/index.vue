<template>
  <transition name="fade">
    <div class="u-loading" :class="{'u-loading-fullscreen': fullscreen}" :style="{ background: bgColor }">
      <div class="u-loading-content">
        <div class="u-loading-icon">
          <i class="u-loading-animate iconfont icon-loading" />
        </div>
        <p class="u-loading-text">{{ text }}</p>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'ULoading',
  data() {
    return {
      text: '', // 显示文本
      bgColor: '', // 背景颜色
      fullscreen: false, // 是否覆盖全局
    }
  },
}
</script>
<style scoped>
.u-loading {
  position: absolute;
  z-index: 3000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, .8)
}

.u-loading-content {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  text-align: center
}

.u-loading-text {
  margin-top: 5px;
  font-size: 13px;
  color: #00554a
}

.u-loading-animate {
  display: inline-block;
  color: #00554a;
  font-size: 30px;
  animation: loading 2s linear infinite
}

@keyframes loading {
  from {
    transform: rotate(0)
  }

  to {
    transform: rotate(360deg)
  }
}

.u-loading-fullscreen {
  position: fixed
}

.u-loading-parent {
  overflow: hidden !important
}
</style>
