<!--
  占位首页
  用于验证 Vue3 + Pinia + vue-router 4 + vue-i18n 9 + AntdVue 骨架
  views 下的页面后续按 vue3 写法逐个迁移后，会替代本页面
-->
<template>
  <div class="home-placeholder">
    <a-card class="home-card" :bordered="false">
      <template #title>
        <span class="home-title">Luck Report · Vue3 骨架</span>
      </template>
      <a-space direction="vertical" size="middle" style="width: 100%">
        <a-alert
          message="骨架阶段"
          description="依赖已升级到 vue3 / pinia / vue-router 4 / vue-i18n 9 / ant-design-vue，原 views 暂未挂载"
          type="info"
          show-icon
        />
        <a-descriptions :column="1" size="small" bordered>
          <a-descriptions-item label="Vue">3.x</a-descriptions-item>
          <a-descriptions-item label="Store">Pinia</a-descriptions-item>
          <a-descriptions-item label="Router">vue-router 4</a-descriptions-item>
          <a-descriptions-item label="i18n">vue-i18n 9 (legacy: false)</a-descriptions-item>
          <a-descriptions-item label="UI">ant-design-vue 4 (全局注册)</a-descriptions-item>
          <a-descriptions-item label="i18n 验证">
            {{ $t('placeholder.currentStage') }}
          </a-descriptions-item>
        </a-descriptions>
        <a-space>
          <a-button type="primary" @click="handleSwitchLocale('zh')">中文</a-button>
          <a-button @click="handleSwitchLocale('en')">English</a-button>
          <a-button type="link" @click="handlePiniaCheck">检查 Pinia</a-button>
        </a-space>
        <a-tag v-if="piniaStatus" :color="piniaStatus.color">{{ piniaStatus.text }}</a-tag>
      </a-space>
    </a-card>
  </div>
</template>

<script setup>
/**
 * 占位首页逻辑
 * 演示 i18n 切换、Pinia 注入、AntdVue 组件全局可用
 */
import { ref } from 'vue'
import { setLocale, $t } from '@/locales'

const piniaStatus = ref(null)

/**
 * 切换语言（演示 i18n 组合式 API 写法）
 * @param {string} locale - 目标语言标识
 */
const handleSwitchLocale = (locale) => {
  const ok = setLocale(locale)
  if (!ok) return
  // 强制刷新占位页标签：用 $t 的链式结果让模板依赖响应式 locale
  piniaStatus.value = null
}

/**
 * 验证 Pinia 是否正常注入到应用实例
 * 通过动态 import 触发 pinia store 工厂创建，验证模块链路通畅
 */
const handlePiniaCheck = async () => {
  try {
    const { default: pinia } = await import('@/store')
    piniaStatus.value = {
      text: $t('placeholder.piniaReady') + (pinia ? ' ✓' : ' ✗'),
      color: pinia ? 'success' : 'error'
    }
  } catch (e) {
    piniaStatus.value = {
      text: $t('placeholder.piniaFailed') + ': ' + (e && e.message),
      color: 'error'
    }
  }
}
</script>

<style scoped>
.home-placeholder {
  padding: 40px;
  display: flex;
  justify-content: center;
}
.home-card {
  width: 640px;
  max-width: 100%;
}
.home-title {
  font-weight: 600;
  font-size: 16px;
}
</style>
