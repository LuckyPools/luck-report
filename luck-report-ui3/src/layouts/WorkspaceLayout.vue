<template>
  <!--
    报表工作台主布局（顶栏 + 侧边菜单 + 内容区）

    形态：
    - 默认（workspace）：顶栏 + 左侧菜单 + 右侧内容，第三方系统按 URL 模板嵌入即可
    - 嵌入（embed）：通过 ?view=embed 隐藏顶栏与菜单，直接渲染目标页（钻取场景）

    设计目标：
    - 主题色与 App.vue ConfigProvider 的 colorPrimary #00554a 保持一致
    - 顶栏固定高度 56px，左侧菜单默认 220px 可折叠到 64px
    - 菜单分组从 router meta.group 派生，零硬编码便于后续增减模块
  -->
  <a-layout class="workspace-root">
    <!-- ===== 嵌入模式：仅渲染 router-view（无 chrome） ===== -->
    <template v-if="isEmbed">
      <router-view v-slot="{ Component, route: r }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" :key="r.fullPath" />
        </transition>
      </router-view>
    </template>

    <!-- ===== 工作台模式：顶栏 + 侧栏 + 内容 ===== -->
    <template v-else>
      <a-layout-header class="ws-header">
        <div class="ws-header__left">
          <div class="ws-header__brand" @click="goHome">
            <div class="ws-header__logo">
              <BarChartOutlined />
            </div>
            <div class="ws-header__brand-text">
              <div class="ws-header__title">报表工作台</div>
              <div class="ws-header__subtitle">Luck Report</div>
            </div>
          </div>
          <div class="ws-header__divider" />
          <div class="ws-header__welcome">
            <ThunderboltFilled class="ws-header__welcome-icon" />
            <span>欢迎进入报表工作台</span>
          </div>
        </div>
        <div class="ws-header__right">
          <a-tooltip :title="'折叠侧栏'">
            <a-button
              type="text"
              class="ws-header__action"
              @click="collapsed = !collapsed"
            >
              <template #icon>
                <MenuFoldOutlined v-if="!collapsed" />
                <MenuUnfoldOutlined v-else />
              </template>
            </a-button>
          </a-tooltip>
          <a-tooltip :title="'刷新当前页'">
            <a-button type="text" class="ws-header__action" @click="reload">
              <template #icon><ReloadOutlined /></template>
            </a-button>
          </a-tooltip>
        </div>
      </a-layout-header>

      <a-layout class="ws-body">
        <a-layout-sider
          v-model:collapsed="collapsed"
          :width="220"
          :collapsed-width="64"
          collapsible
          :trigger="null"
          class="ws-sider"
          theme="dark"
        >
          <a-menu
            mode="inline"
            theme="dark"
            :selected-keys="selectedKeys"
            :open-keys="openKeys"
            :inline-collapsed="collapsed"
            class="ws-menu"
            @select="onMenuSelect"
          >
            <a-sub-menu
              v-for="group in menuGroups"
              :key="group.key"
              :title="group.title"
            >
              <template #icon>
                <component :is="group.icon" />
              </template>
              <a-menu-item
                v-for="item in group.children"
                :key="item.path"
              >
                <template #icon>
                  <component :is="item.icon" />
                </template>
                <span>{{ item.title }}</span>
                <!-- 顶层独立路由的菜单项：右侧加小图标提示"新标签打开" -->
                <ExportOutlined
                  v-if="item.target === '_blank'"
                  class="ws-menu__external"
                />
              </a-menu-item>
            </a-sub-menu>
          </a-menu>
          <div class="ws-sider__footer">
            <div class="ws-sider__version">v1.0.0</div>
          </div>
        </a-layout-sider>

        <a-layout-content class="ws-content">
          <div class="ws-content__inner">
            <router-view v-slot="{ Component, route: r }">
              <transition name="fade-slide" mode="out-in">
                <component :is="Component" :key="r.fullPath" />
              </transition>
            </router-view>
          </div>
        </a-layout-content>
      </a-layout>
    </template>
  </a-layout>
</template>

<script setup lang="ts">
/**
 * WorkspaceLayout - 报表工作台主布局
 *
 * 关键交互：
 * 1. 通过 route.query.view === 'embed' 切换"无 chrome"嵌入模式
 * 2. 菜单根据 route.matched 链中子路由的 meta.menuGroup / meta.menuIndex 自动归组
 * 3. 选中态：当前路由 path 精确匹配时高亮
 * 4. 展开态：根据 meta.openByDefault 控制子菜单默认展开
 */
import { computed, inject, ref, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BarChartOutlined,
  ThunderboltFilled,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  ApartmentOutlined,
  BookOutlined,
  ExperimentOutlined,
  SettingOutlined,
  ProfileOutlined
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()
const collapsed = ref(false)

/** 嵌入模式：优先用 lib-entry 注入的标志，兼容 URL ?view=embed（独立打开场景） */
const injectedEmbed = inject<boolean>('luckReportEmbed', false)
const isEmbed = computed(() => injectedEmbed.value === true || route.query.view === 'embed')

/** 当前路由 path（用于菜单高亮） */
const currentPath = computed(() => route.path)

/** 菜单选中态 */
const selectedKeys = computed(() => [currentPath.value])

/**
 * 菜单分组定义（与 router meta 配合，零硬编码到路由表）
 * - key  : 分组 key
 * - title: 分组标题
 * - icon : 分组图标（antd icons）
 * - children: 分组下菜单项
 *   - path : 路由 path（与 router 中保持一致）
 *   - title: 显示名
 *   - icon : 图标
 *   - defaultOpen: 父级分组是否默认展开
 */
interface MenuItem {
  path: string
  title: string
  icon: Component
  /**
   * 打开方式
   * - '_self'（默认）：在 workspace 内 SPA 跳转
   * - '_blank'       ：调用 window.open 新标签打开（用于脱离 workspace 的顶层全屏页）
   */
  target?: '_self' | '_blank'
}
interface MenuGroup {
  key: string
  title: string
  icon: Component
  children: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    key: 'reports',
    title: '报表中心',
    icon: BarChartOutlined,
    children: [
      // 报表管理：workspace 内的后台管理页
      // 注：报表设计/预览为顶层独立路由，原本以 _blank 模式挂在工作台菜单中。
      // 第三方系统 iframe 嵌入时，菜单项已移除（菜单跳转由 manage 卡片上的
      // "编辑/预览" 按钮通过 window.open 触发，避免 iframe 内 window.open 被浏览器拦截）。
      { path: '/report/manage', title: '报表管理', icon: ProfileOutlined }
    ]
  },
  {
    key: 'config',
    title: '系统配置',
    icon: SettingOutlined,
    children: [
      { path: '/report/datasource', title: '数据源', icon: DatabaseOutlined },
      { path: '/report/model-config', title: '模型管理', icon: ApartmentOutlined },
      { path: '/report/business-knowledge', title: '业务知识库', icon: BookOutlined },
      { path: '/report/agent-knowledge', title: 'Agent 知识库', icon: ExperimentOutlined }
    ]
  }
]

/**
 * 默认展开的子菜单 key 集合
 * - 报表中心、系统配置 都默认展开
 * - 用户手动收起的子菜单不记忆（保持简单，刷新即重置）
 */
const openKeys = ref<string[]>(menuGroups.map(g => g.key))

/** 跳转到报表管理（默认入口） */
const goHome = (): void => {
  router.push('/report/manage')
}

/** 刷新当前页：触发整页重新渲染（简单可靠） */
const reload = (): void => {
  router.go(0)
}

/**
 * 菜单点击：根据 menuItem.target 决定行为
 * - _blank：window.open 新标签（脱离 workspace）
 * - _self：workspace 内 router.push
 */
const onMenuSelect = ({ key }: { key: string }): void => {
  // 找到被点击的 menuItem
  const target = menuGroups
    .flatMap(g => g.children)
    .find(i => i.path === key)
  if (target?.target === '_blank') {
    // 以当前 origin 为基准拼接完整 URL，新标签打开
    const url = window.location.origin + (import.meta.env.VITE_PUBLIC_PATH || '/') + key.replace(/^\//, '')
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  if (key !== route.path) {
    router.push(key)
  }
}
</script>

<style scoped>
/* ===================== 主题色变量 ===================== */
.workspace-root {
  height: 100vh;
  background: #f0f2f5;
  --ws-primary: #00554a;
  --ws-primary-hover: #00695f;
  --ws-primary-active: #004d40;
  --ws-sider-bg: #001529;
  --ws-sider-bg-light: #1f2d3d;
  --ws-header-h: 56px;
  --ws-sider-w: 220px;
  --ws-sider-w-collapsed: 64px;
}

/* ===================== 顶栏 ===================== */
.ws-header {
  position: relative;
  z-index: 10;
  height: var(--ws-header-h);
  padding: 0 20px;
  background: linear-gradient(135deg, var(--ws-primary) 0%, var(--ws-primary-hover) 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ws-header__left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ws-header__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s;
}
.ws-header__brand:hover { opacity: 0.85; }

.ws-header__logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.ws-header__brand-text {
  line-height: 1.1;
  color: #fff;
}

.ws-header__title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.ws-header__subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
  letter-spacing: 1px;
}

.ws-header__divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 4px;
}

.ws-header__welcome {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.ws-header__welcome-icon {
  color: #ffd54f;
  font-size: 14px;
}

.ws-header__right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ws-header__action {
  color: rgba(255, 255, 255, 0.85) !important;
}
.ws-header__action:hover {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

.ws-header__user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  margin-left: 8px;
  border-radius: 20px;
  cursor: pointer;
  color: #fff;
  transition: background 0.2s;
}
.ws-header__user:hover { background: rgba(255, 255, 255, 0.1); }

.ws-header__avatar {
  background: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%);
  font-weight: 600;
}

.ws-header__username {
  font-size: 14px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ws-header__caret {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
}

.ws-header__user-menu {
  min-width: 160px;
  border-radius: 8px;
}

/* ===================== 侧栏 ===================== */
.ws-body {
  height: calc(100vh - var(--ws-header-h));
  background: #f0f2f5;
}

.ws-sider {
  background: var(--ws-sider-bg) !important;
  position: relative;
}

.ws-sider :deep(.ant-menu) {
  background: transparent;
  border-inline-end: 0 !important;
  padding-top: 8px;
}

.ws-sider :deep(.ant-menu-sub) {
  background: var(--ws-sider-bg-light) !important;
}

/* 顶层独立路由的菜单项右侧"外链"小图标 */
.ws-menu__external {
  float: right;
  font-size: 11px;
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.45);
  transition: color 0.2s;
}
.ws-sider :deep(.ant-menu-item:hover) .ws-menu__external,
.ws-sider :deep(.ant-menu-item-selected) .ws-menu__external {
  color: #ffd54f;
}

.ws-sider :deep(.ant-menu-item),
.ws-sider :deep(.ant-menu-submenu-title) {
  color: rgba(255, 255, 255, 0.75) !important;
}
.ws-sider :deep(.ant-menu-item:hover),
.ws-sider :deep(.ant-menu-submenu-title:hover) {
  color: #fff !important;
}

.ws-sider :deep(.ant-menu-item-selected) {
  background: var(--ws-primary) !important;
  color: #fff !important;
  position: relative;
}

.ws-sider__footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.ws-sider__version {
  letter-spacing: 1px;
}

/* ===================== 内容区 ===================== */
.ws-content {
  background: #f0f2f5;
  overflow: hidden;
  position: relative;
}

.ws-content__inner {
  height: 100%;
  overflow: auto;
  padding: 0;
  background: #fff;
  border-top-left-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.04);
}

/* ===================== 路由切换动画 ===================== */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
