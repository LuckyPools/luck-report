<template>
  <div
    v-if="visible"
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

<script>
export default {
  name: 'ContextMenu',
  data() {
    return {
      visible: false,
      x: 0,
      y: 0,
      items: [],
      callback: null,
      justShown: false
    };
  },
  mounted() {
    // 点击其他地方关闭菜单
    document.addEventListener('click', this.handleDocumentClick, true);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleDocumentClick, true);
  },
  methods: {
    /**
     * 显示右键菜单
     */
    show(event, items, callback) {
      this.x = event.clientX;
      this.y = event.clientY;
      this.items = items;
      this.callback = callback;
      this.visible = true;
      this.justShown = true;

      let that = this;
      // 重置 justShown 标志
      setTimeout(() => {
          that.justShown = false;
      }, 100);

      // 确保菜单不超出视口
      this.$nextTick(() => {
        const menu = that.$el;
        if (menu) {
          const rect = menu.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          if (rect.right > viewportWidth) {
              that.x = viewportWidth - rect.width - 5;
          }
          if (rect.bottom > viewportHeight) {
              that.y = viewportHeight - rect.height - 5;
          }
        }
      });
    },

    /**
     * 隐藏菜单
     */
    hideMenu() {
      this.visible = false;
    },

    /**
     * 处理文档点击事件
     */
    handleDocumentClick(e) {
      // 如果刚刚显示，不处理
      if (this.justShown) {
        return;
      }

      // 如果菜单可见且点击的不是菜单本身，关闭菜单
      if (this.visible && this.$el && !this.$el.contains(e.target)) {
        this.hideMenu();
      }
    },

    /**
     * 处理菜单项点击
     */
    handleItemClick(item) {
      if (this.callback) {
        this.callback(item.key);
      }
      this.hideMenu();
    },

    /**
     * 获取图标class
     */
    getIconClass(icon) {
      const iconMap = {
        'add': 'iconfont icon-plus-circle',
        'edit': 'iconfont icon-edit',
        'delete': 'iconfont icon-delete',
        'loading': 'iconfont icon-refresh'
      };
      return iconMap[icon] || '';
    }
  }
};
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

