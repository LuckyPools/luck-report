<template>
  <div class="blank-layout">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'BlankLayout'
};
</script>

<style lang="less" scoped>
.blank-layout {
  min-height: 100vh;
  background: #f0f2f5;
}
</style>
