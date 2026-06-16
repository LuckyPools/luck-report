<template>
  <!--
    工作台首页（仪表盘风格）
    - 顶部欢迎区：当前用户名 + 概览数字
    - 快捷入口卡片：跳转到各功能模块
    - 设计风格：与 WorkspaceLayout 主题色保持一致
  -->
  <div class="ws-home">
    <!-- 顶部欢迎横幅 -->
    <div class="ws-home__hero">
      <div class="ws-home__hero-bg" />
      <div class="ws-home__hero-content">
        <div class="ws-home__hero-text">
          <h1 class="ws-home__hero-title">{{ greeting }}，{{ userName }}</h1>
          <p class="ws-home__hero-subtitle">
            欢迎使用 Luck Report 智能报表工作台，从左侧菜单或下方快捷入口开始你的工作
          </p>
        </div>
        <div class="ws-home__hero-actions">
          <a-button type="primary" size="large" @click="goTo('/report/designer', '_blank')">
            <template #icon><EditOutlined /></template>
            新建报表
          </a-button>
        </div>
      </div>
    </div>

    <!-- 概览统计 -->
    <a-row :gutter="16" class="ws-home__stats">
      <a-col :xs="12" :sm="12" :md="6" v-for="s in stats" :key="s.title">
        <a-card class="ws-home__stat-card" :bordered="false">
          <div class="ws-home__stat-inner">
            <div class="ws-home__stat-icon" :style="{ background: s.color }">
              <component :is="s.icon" />
            </div>
            <div class="ws-home__stat-body">
              <div class="ws-home__stat-title">{{ s.title }}</div>
              <div class="ws-home__stat-value">{{ s.value }}</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 快捷入口 -->
    <a-card class="ws-home__quick" :bordered="false" title="快捷入口">
      <a-row :gutter="[16, 16]">
        <a-col
          v-for="item in quickEntries"
          :key="item.path"
          :xs="12" :sm="12" :md="8" :lg="6"
        >
          <div
            class="ws-home__entry"
            :style="{ '--entry-color': item.color }"
            @click="goTo(item.path, item.target)"
          >
            <div class="ws-home__entry-icon">
              <component :is="item.icon" />
            </div>
            <div class="ws-home__entry-body">
              <div class="ws-home__entry-title">
                {{ item.title }}
                <span v-if="item.target === '_blank'" class="ws-home__entry-tag">新窗口</span>
              </div>
              <div class="ws-home__entry-desc">{{ item.desc }}</div>
            </div>
            <RightOutlined class="ws-home__entry-arrow" />
          </div>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup lang="ts">
/**
 * WorkspaceHome - 工作台首页
 *
 * - 展示当前用户、概览统计、快捷入口
 * - 所有数据当前为静态占位（数字可后续对接后端接口）
 * - 主题色与 WorkspaceLayout 头部一致
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  EditOutlined,
  EyeOutlined,
  DatabaseOutlined,
  ApartmentOutlined,
  BookOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  BarChartOutlined,
  RightOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const userName = '管理员'

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

/**
 * 通用跳转
 * - target === '_blank'：新标签打开（用于顶层独立路由 designer/preview）
 * - target === '_self'（默认）：workspace 内 SPA 跳转
 */
const goTo = (path: string, target: '_self' | '_blank' = '_self'): void => {
  if (target === '_blank') {
    const base = (import.meta.env.VITE_PUBLIC_PATH || '/') as string
    const url = window.location.origin + base.replace(/\/?$/, '/') + path.replace(/^\//, '')
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  router.push(path)
}

const stats = [
  { title: '今日访问', value: '128', icon: TeamOutlined, color: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)' },
  { title: '报表总数', value: '36', icon: FileTextOutlined, color: 'linear-gradient(135deg, #56ccf2 0%, #2f80ed 100%)' },
  { title: 'AI 调用', value: '512', icon: ThunderboltOutlined, color: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' },
  { title: '平均耗时', value: '0.8s', icon: ClockCircleOutlined, color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }
]

/**
 * 快捷入口
 * - target: '_blank' 表示新标签打开（对应顶层独立路由）
 * - target 缺省/'_self' 表示 workspace 内跳转
 */
const quickEntries = [
  { path: '/report/designer',          title: '报表设计', desc: '拖拽设计 Excel 报表',  icon: EditOutlined,       color: '#1677ff', target: '_blank' as const },
  { path: '/report/preview',           title: '报表预览', desc: '查看已发布的报表',     icon: EyeOutlined,        color: '#52c41a', target: '_blank' as const },
  { path: '/report/datasource',        title: '数据源',  desc: '管理数据库连接',       icon: DatabaseOutlined,   color: '#13c2c2' },
  { path: '/report/model-config',      title: '模型管理', desc: '配置 AI 模型',         icon: ApartmentOutlined,  color: '#fa8c16' },
  { path: '/report/business-knowledge',title: '业务知识', desc: '业务词条与文档',       icon: BookOutlined,       color: '#eb2f96' },
  { path: '/report/agent-knowledge',   title: 'Agent 知识', desc: '智能体训练数据',      icon: ExperimentOutlined, color: '#2f54eb' },
  { path: '/report/designer',          title: '数据图表', desc: '可视化图表配置',       icon: BarChartOutlined,   color: '#f5222d', target: '_blank' as const }
]
</script>

<style scoped>
.ws-home {
  padding: 16px;
  background: #f0f2f5;
  min-height: 100%;
}

/* ===== 欢迎横幅 ===== */
.ws-home__hero {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #00554a 0%, #00897b 50%, #26a69a 100%);
  box-shadow: 0 4px 12px rgba(0, 85, 74, 0.15);
}

.ws-home__hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.18) 0, transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.12) 0, transparent 40%);
  pointer-events: none;
}

.ws-home__hero-content {
  position: relative;
  padding: 32px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  flex-wrap: wrap;
  gap: 16px;
}

.ws-home__hero-title {
  font-size: 26px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #fff;
  letter-spacing: 1px;
}

.ws-home__hero-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  max-width: 600px;
  line-height: 1.6;
}

.ws-home__hero-actions {
  display: flex;
  gap: 12px;
}

.ws-home__hero-actions :deep(.ant-btn) {
  border-radius: 20px;
  height: 40px;
  padding: 0 22px;
  font-weight: 500;
}

.ws-home__hero-actions :deep(.ant-btn-primary) {
  background: #ffd54f;
  border-color: #ffd54f;
  color: #00554a;
}
.ws-home__hero-actions :deep(.ant-btn-primary:hover) {
  background: #ffca28;
  border-color: #ffca28;
  color: #00554a;
}

.ws-home__hero-actions :deep(.ant-btn:not(.ant-btn-primary)) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
  backdrop-filter: blur(4px);
}
.ws-home__hero-actions :deep(.ant-btn:not(.ant-btn-primary):hover) {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  color: #fff;
}

/* ===== 统计卡片 ===== */
.ws-home__stats {
  margin-bottom: 16px;
}

.ws-home__stat-card {
  border-radius: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.ws-home__stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.ws-home__stat-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ws-home__stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 26px;
  flex-shrink: 0;
}

.ws-home__stat-title {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.ws-home__stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  line-height: 1.2;
}

/* ===== 快捷入口 ===== */
.ws-home__quick {
  border-radius: 8px;
}
.ws-home__quick :deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
  padding: 0 20px;
  min-height: 48px;
}
.ws-home__quick :deep(.ant-card-head-title) {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
}
.ws-home__quick :deep(.ant-card-body) {
  padding: 16px 20px;
}

.ws-home__entry {
  --entry-color: #1677ff;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.ws-home__entry:hover {
  background: #fff;
  border-color: var(--entry-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.ws-home__entry-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--entry-color) 12%, transparent);
  color: var(--entry-color);
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s;
}
.ws-home__entry:hover .ws-home__entry-icon {
  transform: scale(1.05);
}

.ws-home__entry-body {
  flex: 1;
  min-width: 0;
}

.ws-home__entry-title {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 新窗口打开的提示小标签 */
.ws-home__entry-tag {
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 6px;
  font-size: 10px;
  font-weight: 500;
  color: var(--entry-color, #1677ff);
  background: color-mix(in srgb, var(--entry-color, #1677ff) 12%, transparent);
  border-radius: 3px;
  line-height: 1;
  letter-spacing: 0.5px;
}

.ws-home__entry-desc {
  font-size: 12px;
  color: #8c8c8c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ws-home__entry-arrow {
  color: #bfbfbf;
  font-size: 12px;
  transition: transform 0.2s, color 0.2s;
}
.ws-home__entry:hover .ws-home__entry-arrow {
  color: var(--entry-color);
  transform: translateX(4px);
}
</style>
