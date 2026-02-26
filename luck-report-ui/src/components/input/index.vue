<template>
  <div
      class="u-input"
      :class="{ 'u-input-disabled': disabled, [`u-input-${size}-size`]: true }"
      ref="myInput"
  >
    <input
        class="u-input-input"
        :class="{
        'u-input-input-disabled': disabled,
        'u-input-input-icon': needPaddingRight,
        'u-input-input-icon-suffix': prefixIcon,
        [`u-input-input-${size}-size`]: true,
      }"
        :type="type"
        :value="currentValue"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        :readonly="readonly"
        :placeholder="placeholder"
        :disabled="disabled"
    />
    <!-- 前置图标区域 -->
    <span class="u-input-icon u-input-icon-prefix">
      <i
          class="iconfont"
          :class="{
          [`${prefixIcon}`]: prefixIcon,
        }"
      />
    </span>
    <!-- 后置图标区域 -->
    <span class="u-input-icon">
      <i
          class="iconfont icon-close"
          v-if="clearable && currentValue && !disabled"
          @click="handleClean"
      />
      <i
          v-else
          class="iconfont"
          :class="{
          [`${suffixIcon}`]: suffixIcon,
        }"
      />
    </span>
    <!-- 输入建议选项框 -->
    <transition name="fade-bottom">
      <div
          class="u-input-suggestion"
          v-show="panelVisible"
          ref="mySuggestion"
          v-if="suggestion && this.options.length > 0"
      >
        <div
            class="u-input-suggestion-cell"
            @click="setSuggestion(item.value)"
            v-for="item in options"
            :key="item.value"
        >
          <slot :item="item">
            {{ item.value }}
          </slot>
        </div>
        <!-- 加载中提示 -->
        <div class="u-input-suggestion-layer" v-show="loading">
          <i class="iconfont icon-loading u-input-suggestion-layer-loading" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
// 工具函数，用于判断传入的值是否符合条件
import { oneOf, debounce } from '../utils'
import Emitter from "@/components/mixins/emitter";

export default {
  name: 'UInput',
  mixins: [Emitter],
  data() {
    return {
      currentValue: this.formatValue(this.value), // 当前输入值
      panelVisible: false, // 鼠标在hover阶段
      options: [], // 输入建议可选项
      loading: false, // 是否正在加载中
    }
  },
  props: {
    value: {
      type: [String, Number],
      default: '',
    },
    // 占位符
    placeholder: {
      type: String,
      default: '请输入',
    },
    max: {
      type: Number,
    },
    min: {
      type: Number,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false,
    },
    // 是否显示清空按钮
    clearable: {
      type: Boolean,
      default: false,
    },
    // 前置图标名称
    prefixIcon: {
      type: String,
      default: '',
    },
    // 后置图标名称
    suffixIcon: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: "text"
    },
    // 尺寸
    size: {
      validator(value) {
        return oneOf(value, ['large', 'medium', 'small', 'mini'])
      },
      type: String,
      default: 'medium',
    },
    // 是否开启输入建议
    suggestion: {
      type: Boolean,
      default: false,
    },
    // 输入建议回调函数
    fetchSuggestions: {
      type: Function,
    },
  },
  watch: {
    value: {
      handler(newVal) {
        this.currentValue = this.formatValue(newVal)
      },
      immediate: true,
    },
  },
  computed: {
    // 是否需要设置输入框的右侧内边距
    needPaddingRight() {
      return this.clearable && this.suffixIcon
    },
  },
  mounted() {
    // 绑定点击事件
    document.addEventListener('click', this.addCloseEvent)
    this.getSuggesitions()
  },
  beforeDestroy() {
    // 释放点击事件
    document.removeEventListener('click', this.addCloseEvent)
  },
  methods: {
    /**
     * @description 将值转换为字符串格式
     * @param {String|Number} value - 需要转换的值
     * @returns {String} 转换后的字符串值
     */
    formatValue(value) {
      return value === null || value === undefined ? '' : String(value)
    },
    /**
     * @description 输入事件
     */
    handleInput(_e) {
      const value = _e.target.value
      this.currentValue = value
      this.$emit('input', value)
      this.$emit('change', value)
      this.dispatch('UFormItem', 'form-change', value)
      debounce(
          () => {
            this.getSuggesitions()
          },
          333,
          'fetch-suggestions'
      )
    },
    /**
     * @description 清空输入值
     */
    handleClean() {
      if (!this.disabled) {
        this.currentValue = ''
        this.$emit('input', '')
        this.$emit('change', '')
        this.getSuggesitions()
      }
    },
    /**
     * @description input的hover事件，该函数作用是控制输入提示的显示
     */
    handleFocus() {
      this.panelVisible = true
    },

    /**
     * 失去焦点
     * @param event
     */
    handleBlur(event) {
      this.$emit('blur', event)
      this.dispatch('UFormItem', 'form-blur', this.currentValue)
    },
    /**
     * @description 控制提示框的显示/隐藏
     */
    addCloseEvent(event) {
      // 点击目标若不是组件内元素时，关闭选项弹窗
      if(event.path){
        let target = event.path.find((d) => d === this.$refs.myInput)
        if (!target && this.panelVisible) {
          this.panelVisible = false
        }
      }
    },
    /**
     * @description 获取输入提示数据
     */
    getSuggesitions() {
      if (this.fetchSuggestions) {
        this.loading = true
        this.fetchSuggestions(this.currentValue, (options) => {
          this.loading = false
          this.options = options
        })
      }
    },
    /**
     * @description 设置所选中的值
     */
    setSuggestion(str) {
      this.currentValue = this.formatValue(str)
      this.$emit('input', str)
      this.$emit('change', str)
      this.panelVisible = false
    },
  },
}
</script>
<style scoped>

.u-input {
  position: relative;
  display: inline-block;
  width: 220px;
  height: 36px;
  align-items: center
}

.u-input-disabled {
  cursor: not-allowed !important
}

.u-input-input {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  line-height: 22px;
  padding: 7px 10px;
  box-sizing: border-box;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  outline: 0;
  font-size: 14px
}

.u-input-input:focus {
  border-color: #00554a;
  box-shadow: 0 0 4px #00554a
}

.u-input-input-disabled {
  cursor: not-allowed;
  background-color: #f5f7fa
}

.u-input-input-icon {
  padding-right: 24px !important
}

.u-input-input-icon-suffix {
  padding-left: 24px !important
}

.u-input-input-large-size {
  padding: 9px 10px
}

.u-input-input-medium-size {
  padding: 7px 10px
}

.u-input-input-small-size {
  padding: 5px 10px;
  font-size: 13px
}

.u-input-input-mini-size {
  padding: 3px 10px;
  font-size: 13px
}

.u-input-icon {
  position: absolute;
  width: 16px;
  height: 16px;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  text-align: center;
  line-height: 16px
}

.u-input-icon i {
  cursor: pointer
}

.u-input-icon-prefix {
  left: 6px
}

.u-input-large-size {
  height: 40px
}

.u-input-medium-size {
  height: 36px
}

.u-input-small-size {
  height: 32px
}

.u-input-mini-size {
  height: 28px
}

.u-input-suggestion {
  width: 100%;
  max-height: 160px;
  transform-origin: center top;
  z-index: 2367;
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  border: solid 1px #e4e7ed;
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto
}

.u-input-suggestion::-webkit-scrollbar-track-piece {
  background: #f8f8f8
}

.u-input-suggestion::-webkit-scrollbar {
  width: 6px;
  height: 6px
}

.u-input-suggestion::-webkit-scrollbar-thumb:hover {
  background-color: #bbb
}

.u-input-suggestion::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 10px
}

.u-input-suggestion-cell {
  padding: 0 10px;
  line-height: 28px;
  font-size: 14px;
  cursor: pointer
}

.u-input-suggestion-cell:hover {
  background-color: #f5f7fa
}

.u-input-suggestion-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff
}

.u-input-suggestion-layer-loading {
  display: inline-block;
  animation: loading 2s linear infinite
}
</style>
