<template>
  <div
    v-if="visible"
    ref="menuRef"
    class="context-menu"
    :style="{ left: x + 'px', top: y + 'px' }"
    @click.stop
  >
    <div
      v-for="(item, index) in items"
      :key="index"
      class="context-menu-item"
      @click="handleItemClick(item)"
    >
      <i v-if="item.icon" class="menu-icon" :class="getIconClass(item.icon)"></i>
      <span>{{ item.name }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ContextMenu 自定义右键菜单（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - show(event, items, callback) 通过 defineExpose 暴露给父组件调用
 * - mounted/beforeDestroy → onMounted/onBeforeUnmount
 * - $nextTick → nextTick
 */
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

defineOptions({ name: 'ContextMenu' })

interface ContextMenuItem {
  key: string
  name: string
  icon: string
}

const visible = ref<boolean>(false)
const x = ref<number>(0)
const y = ref<number>(0)
const items = ref<ContextMenuItem[]>([])
const callback = ref<((key: string) => void) | null>(null)
const justShown = ref<boolean>(false)

let justShownTimer: ReturnType<typeof setTimeout> | null = null

const menuRef = ref<HTMLElement | null>(null)

/**
 * 显示右键菜单
 */
async function show(event: MouseEvent, newItems: ContextMenuItem[], cb: (key: string) => void): Promise<void> {
  x.value = event.clientX
  y.value = event.clientY
  items.value = newItems
  callback.value = cb
  visible.value = true
  justShown.value = true

  // 重置 justShown 标志
  if (justShownTimer) {
    clearTimeout(justShownTimer)
  }
  justShownTimer = setTimeout(() => {
    justShown.value = false
    justShownTimer = null
  }, 100)

  // 确保菜单不超出视口
  await nextTick()
  const menu = menuRef.value
  if (menu) {
    const rect = menu.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (rect.right > viewportWidth) {
      x.value = viewportWidth - rect.width - 5
    }
    if (rect.bottom > viewportHeight) {
      y.value = viewportHeight - rect.height - 5
    }
  }
}

/**
 * 隐藏菜单
 */
function hideMenu(): void {
  visible.value = false
  // 清理回调与菜单项，避免长生命周期场景下持有旧引用
  callback.value = null
  items.value = []
}

/**
 * 处理文档点击事件
 */
function handleDocumentClick(e: MouseEvent): void {
  // 如果刚刚显示，不处理
  if (justShown.value) {
    return
  }

  // 如果菜单可见且点击的不是菜单本身，关闭菜单
  if (visible.value && menuRef.value && !menuRef.value.contains(e.target as Node)) {
    hideMenu()
  }
}

/**
 * 处理菜单项点击
 */
function handleItemClick(item: ContextMenuItem): void {
  if (callback.value) {
    callback.value(item.key)
  }
  hideMenu()
}

/**
 * 获取图标class
 */
function getIconClass(icon: string): string {
  const iconMap: Record<string, string> = {
    add: 'iconfont icon-plus-circle',
    edit: 'iconfont icon-edit',
    delete: 'iconfont icon-delete',
    loading: 'iconfont icon-refresh'
  }
  return iconMap[icon] || ''
}

onMounted(() => {
  // 点击其他地方关闭菜单
  document.addEventListener('click', handleDocumentClick, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick, true)
  if (justShownTimer) {
    clearTimeout(justShownTimer)
    justShownTimer = null
  }
})

defineExpose({
  show,
  hideMenu
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: #fff;
  border-radius: 4px;
  box-shadow:
      0 3px 6px rgba(0, 0, 0, 0.10),
      0 6px 12px rgba(0, 0, 0, 0.08),
      0 10px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 10000;
  min-width: 180px;
  padding: 4px 0;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.context-menu-item:hover {
  background-color: #f5f5f5;
}

.menu-icon {
  margin-right: 8px;
  font-size: 14px;
  width: 16px;
  display: inline-block;
  text-align: center;
}
</style>
