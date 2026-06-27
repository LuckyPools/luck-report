<template>
  <a-config-provider :theme="themeConfig" :locale="antdLocale">
    <div id="app">
      <router-view />
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import enUS from 'ant-design-vue/es/locale/en_US'
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'

defineOptions({ name: 'App' })

const { locale } = useI18n()

/** 根据当前 i18n 语言切换 antd 组件内置文案（分页、表格等） */
const antdLocale = computed(() => (locale.value === 'zh' ? zhCN : enUS))

const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#00554a',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    borderRadius: 6,
    // 选中/激活态背景由"主色派生"改为"中性淡灰"（与老项目 USelect 风格一致）
    colorPrimaryBg: '#f5f7fa',
    colorPrimaryBgHover: '#eef0f4'
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
}
</style>
