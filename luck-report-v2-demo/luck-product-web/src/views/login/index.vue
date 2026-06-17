<template>
  <div class="login-container">
    <div class="login-main">
      <div class="login-wrapper-left"></div>
      <div class="login-wrapper-right">
        <Password></Password>
      </div>
    </div>
  </div>
</template>

<script>
import Password from "./modules/password.vue";

export default {
  name: 'Login',
  components: {Password}
}
</script>
<style lang="less">
.login-container{
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: #d6e7fd no-repeat center url('@/assets/images/login/bg.png') !important;
  background-size: cover !important;

  .login-main{
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    position: relative;

    .login-wrapper-left{
      width: 50%;
      position: relative;
    }

    .login-wrapper-right{
      width: 50%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }
  }
}
</style>
