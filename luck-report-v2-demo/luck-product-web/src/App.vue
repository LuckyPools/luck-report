<template>
  <!-- 配置ant全局语言 -->
  <a-config-provider :locale="localLocale">
    <router-view class="bg-layout"/>
  </a-config-provider>
</template>

<script>
import zh from "ant-design-vue/lib/locale-provider/zh_CN";
import en from "ant-design-vue/lib/locale-provider/en_US";
const locale = {
    zh,
    en
}

export default {
    name: 'App',
    computed: {
        localLocale(){
            return locale[this.$i18n.locale];
        }
    }
}
</script>

<style>
</style>
