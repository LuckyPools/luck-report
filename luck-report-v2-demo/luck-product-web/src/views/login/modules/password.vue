<template>
    <a-form-model
            ref="form"
            :rules="rules"
            :model="form" class="login-form">
        <div class="login-header">
            <img class="logo-img" :src="require('@/assets/images/logo/logo.png')" alt="logo">
            <span class="title-text">{{ $t('system.title') }}</span>
        </div>
        <a-form-model-item>
        </a-form-model-item>
        <a-form-model-item prop="username">
            <a-input size="large" v-model="form.username" placeholder="请输入用户名">
                <a-icon slot="prefix" type="user" />
            </a-input>
        </a-form-model-item>
        <a-form-model-item prop="password">
            <a-input-password size="large" v-model="form.password" placeholder="请输入密码" >
                <a-icon slot="prefix" type="lock" />
            </a-input-password>
        </a-form-model-item>
        <a-form-model-item>
            <a-button size="large" :loading="loading" class="login-btn" type="primary" v-on:click="login">登 录</a-button>
        </a-form-model-item>
    </a-form-model>
</template>

<script>
import {login} from "@/api/auth";
import {routerPushByKey} from "@/router";
import {setToken, encryptSHAPassword} from "@/utils/auth";

export default {
    name: 'PasswordLogin',
    data() {
        return {
            loading: false,
            form: {
                username: '',
                password: ''
            },
            rules:{
                username: [
                    {required: true, message: '请输入用户名', trigger: 'blur'}
                ],
                password: [
                    {required: true, message: '请输入密码', trigger: 'blur'}
                ]
            }
        };
    },
    methods: {
        login() {
            let that = this;
            that.loading = true;
            this.$refs.form.validate(valid => {
                if(valid){
                    let formData = {
                        username: that.form.username,
                        password: encryptSHAPassword(that.form.password)
                    };
                    login(formData).then(res => {
                        that.$message.success(that.$t('page.login.common.loginSuccess'));
                        setToken(res.data);
                        that.$store.commit('user/SET_USER_INFO', { name: formData.username });
                        routerPushByKey('home');
                        that.loading = false;
                    }).catch((e) => {
                        that.loading = false;
                        console.log(e)
                    })
                }else{
                    that.loading = false;
                }
            })
        }
    }
}
</script>
<style lang="less" scoped>
.login-form {
  position: relative;
  width: 400px;
  padding: 48px 60px;
  border-radius: 24px;
  background: #ffffff;
}

.login-header {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: flex-start !important;
  padding: 0;

  .logo-img {
    width: 56px !important;
    height: 56px !important;
    margin-right: 20px !important;
    flex-shrink: 0 !important;
    object-fit: contain !important;
    display: inline-block !important;
  }

  .title-text {
    font-size: 26px !important;
    font-weight: 600 !important;
    color: #333333 !important;
    white-space: nowrap !important;
    line-height: 1 !important;
    display: inline-block !important;
  }
}

.login-btn {
  width: 100%;
}
</style>
