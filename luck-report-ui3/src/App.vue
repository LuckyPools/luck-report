<template>
  <a-config-provider :theme="themeConfig">
    <div id="app">
      <router-view />
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'

defineOptions({ name: 'App' })

/** 全局主题配置：修改 colorPrimary 即可统一切换所有 ant 组件的主题色 */
const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#00554a',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    borderRadius: 6
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
}
</style>
