<template>
  <div class="exception-page">
    <div class="exception-content">
      <img src="@/assets/icons/svg/service-error.svg" alt="500" class="exception-icon" />
      <h1>500</h1>
      <p>{{ $t('route.500') }}</p>
      <a-button type="primary" @click="goHome">
        {{ $t('common.backToHome') }}
      </a-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ServiceError',
  methods: {
    goHome() {
      this.$router.push('/home');
    }
  }
}
</script>

<style lang="less" scoped>
.exception-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.exception-content {
  text-align: center;
  
  .exception-icon {
    width: 200px;
    height: 200px;
    margin-bottom: 24px;
  }
  
  h1 {
    font-size: 72px;
    color: #ff4d4f;
    margin: 0;
    line-height: 1;
  }
  
  p {
    font-size: 20px;
    color: #666;
    margin: 24px 0;
  }
}
</style>
