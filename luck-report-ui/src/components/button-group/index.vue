<template>
  <div class="dropdown-buttons" :class="customClass">
    <u-button
      type="info"
      :style="buttonStyle"
      :title="title"
      :icon="iconClass"
      @click="toggleDropdown"
      ref="mainButton"
    >
      <span v-if="showText" class="button-text">{{ buttonText }}</span>
      <span v-if="hasDropdown" class="caret"></span>
    </u-button>
    <ul v-if="hasDropdown" class="dropdown-menu" role="menu" :style="{ display: isDropdownOpen ? 'block' : 'none', maxHeight: maxMenuHeight + 'px', overflowY: 'auto' }" ref="dropdown">
      <li v-for="(item, index) in menuItems" :key="index" :class="item.class">
        <a href="javascript:void(0)" @click="handleMenuItemClick(item)" style="text-decoration: none">
          <i v-if="item.icon" :class="item.icon" :style="item.iconStyle"></i> {{ item.text }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script>
import UButton from "@/components/button/index.vue";

export default {
  name: 'ButtonGroup',
  components: {UButton},
  props: {
    // 主按钮图标类名
    iconClass: {
      type: String,
      default: ''
    },
    // 主按钮图标样式
    iconStyle: {
      type: Object,
      default: () => ({ color: '#0e90d2' })
    },
    // 主按钮文本
    buttonText: {
      type: String,
      default: ''
    },
    // 是否显示文本
    showText: {
      type: Boolean,
      default: false
    },
    // 主按钮样式
    buttonStyle: {
      type: Object,
      default: () => ({
        border: 'none'
      })
    },
    // 工具提示
    title: {
      type: String,
      default: ''
    },
    // 自定义类名
    customClass: {
      type: String,
      default: ''
    },
    // 是否有下拉菜单
    hasDropdown: {
      type: Boolean,
      default: true
    },
    // 下拉菜单项
    menuItems: {
      type: Array,
      default: () => []
    },
    // 下拉菜单最大高度
    maxMenuHeight: {
      type: Number,
      default: 300
    }
  },
  data() {
    return {
      isDropdownOpen: false
    };
  },
  mounted() {
    if (this.hasDropdown) {
      // 添加点击外部关闭下拉菜单的事件监听
      document.addEventListener('click', this.handleClickOutside);
    }
  },
  beforeDestroy() {
    if (this.hasDropdown) {
      // 移除事件监听
      document.removeEventListener('click', this.handleClickOutside);
    }
  },
  methods: {
    toggleDropdown() {
      if (!this.hasDropdown) {
        // 如果没有下拉菜单，直接触发点击事件
        this.$emit('button-click');
        return;
      }
      this.isDropdownOpen = !this.isDropdownOpen;
      this.$emit('dropdown-toggle', this.isDropdownOpen);
    },
    closeDropdown() {
      this.isDropdownOpen = false;
      this.$emit('dropdown-close');
    },
    handleClickOutside(event) {
      // 检查点击是否在下拉菜单外部
      if (this.$el && !this.$el.contains(event.target)) {
        this.closeDropdown();
      }
    },
    handleMenuItemClick(item) {
      if (item.disabled) {
        return;
      }

      // 触发菜单项点击事件，传递菜单项数据
      this.$emit('menu-item-click', item);

      // 如果菜单项有自定义的处理函数，则调用它
      if (item.action && typeof item.action === 'function') {
        item.action(item);
      }

      // 关闭下拉菜单
      this.closeDropdown();
    }
  }
};
</script>

<style scoped>
.dropdown-buttons {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  display: none;
  min-width: 160px;
  max-width: 300px;
  padding: 5px 0;
  margin: 2px 0 0;
  list-style: none;
  background-color: #fff;
  border: 1px solid #ccc;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.175);
  background-clip: padding-box;
}

.dropdown-menu > li > a {
  display: block;
  padding: 3px 20px;
  clear: both;
  font-weight: normal;
  line-height: 1.42857143;
  color: #333;
  white-space: nowrap;
}

.dropdown-menu > li > a:hover,
.dropdown-menu > li > a:focus {
  color: #262626;
  text-decoration: none;
  background-color: #f5f5f5;
}

.dropdown-menu > .disabled > a,
.dropdown-menu > .disabled > a:hover,
.dropdown-menu > .disabled > a:focus {
  color: #777;
}

.dropdown-menu > .disabled > a:hover,
.dropdown-menu > .disabled > a:focus {
  text-decoration: none;
  background-color: transparent;
  background-image: none;
  filter: progid:DXImageTransform.Microsoft.gradient(enabled = false);
  cursor: not-allowed;
}

.caret {
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: 8px;
  vertical-align: middle;
  border-top: 4px dashed;
  border-top: 4px solid \9;
  border-right: 4px solid transparent;
  border-left: 4px solid transparent;
}

.button-text {
  margin-left: 5px;
}

.btn-group .btn + .btn,
.btn-group .btn + .btn-group,
.btn-group .btn-group + .btn,
.btn-group .btn-group + .btn-group {
  margin-left: -1px;
}
</style>

