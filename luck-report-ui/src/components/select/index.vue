<template>
  <div class="u-select" ref="USelect">
    <div class="u-select-inner" ref="myInput">
      <!-- 多选专用区域 -->
      <div
          class="u-select-multi"
          :class="{
          'u-select-multi-disabled': disabled,
          [`u-select-multi-${size}`]: true
        }"
          v-if="multiple"
          ref="multiPanel"
          @click.self="handleMultiClick"
      >
        <!-- <div class="u-select-multi-tags"></div> -->
        <tag
            size="mini"
            type="text"
            closeable
            disableTransitions
            v-for="item in currentTags"
            :key="item.value"
            @close="handleTagClose(item)"
        >{{ item.label }}</tag
        >
        <input
            type="text"
            class="u-select-multi-input"
            ref="multiInput"
            :placeholder="disabled ? '' : '请输入'"
            v-if="filterable"
            :disabled="disabled"
            @click.self="handleMultiClick"
            @input="handleInput"
            @focus="handleInputFocus"
            @blur="handleInputBlur"

        />
      </div>
      <input
          class="u-select-inner-input"
          :class="{
          ['u-select-inner-input-select']: visible,
          [`u-select-inner-input-disabled`]: disabled,
          [`u-select-inner-input-size-${size}`]: true
        }"
          :style="{ 'min-height': `${panelHeight}px` }"
          ref="myInput"
          type="text"
          :placeholder="currentTags.length > 0 ? '' : placeholderLabel"
          :disabled="disabled"
          :value="multiple ? '' : currentLabel"
          :readonly="!filterable"
          @click="handleClick"
          @input="handleInput"
          @focus="handleInputFocus"
          @blur="handleInputBlur"
      />
      <i
          class="u-select-inner-icon iconfont icon-down"
          :class="{
          'u-select-inner-icon-focus': visible,
          [`u-select-inner-icon-size-${size}`]: true
        }"
          v-show="!(clearable && this.currentValue && onHover)"
      />
      <span
          class="u-select-inner-icon"
          v-show="clearable && this.currentValue && onHover"
          @click="handleClear"
      >
        <i class="iconfont icon-close" />
      </span>
    </div>
    <transition name="fade-bottom">
      <div
          class="u-select-options"
          :class="{ 'u-select-options-virtual': virtual }"
          :style="{
            top: panelHeight ? `${panelHeight + 6}px` : undefined,
            width: optionsWidth ? `${optionsWidth}px` : undefined,
            height: virtual ? virtualOptionsHeight : undefined
          }"
          v-show="visible"
          v-loading="filterable && loading"
      >
        <template v-if="virtual">
          <u-virtual-scroll
            ref="virtualScroll"
            :items="filteredVirtualOptions"
            :item-size="32"
            :visible-count="5"
            :value-key="valueKey"
            :label-key="labelKey"
            @select="handleVirtualSelect"
          >
            <template #default="{ item }">
              <div
                class="u-virtual-option"
                :class="{
                  'u-virtual-option-selected': isVirtualOptionSelected(item)
                }"
              >
                {{ item[labelKey] }}
              </div>
            </template>
          </u-virtual-scroll>
          <div class="u-select-options-no-data" v-show="filteredVirtualOptions.length === 0">
            无数据
          </div>
        </template>
        <template v-else>
          <slot> </slot>
          <div
              class="u-select-options-no-data"
              v-show="!$slots.default || !hasOptions"
          >
            无数据
          </div>
        </template>
      </div>
    </transition>
  </div>
</template>

<script>
import { oneOf, debounce } from "../utils";
import Emitter from "../mixins/emitter";
import { LoadingDirective } from "../loading/instance";
import Tag from "../tag/index.vue";
import UVirtualScroll from "../virtual-scroll/index.vue";

export default {
  name: "USelect",
  components: {
    Tag,
    UVirtualScroll
  },
  mixins: [Emitter],
  directives: {
    loading: LoadingDirective
  },
  data() {
    return {
      options: [],
      visible: false,
      currentLabel: "",
      currentValue: "",
      currentTags: [],
      panelHeight: "",
      hasOptions: true,
      currentPlaceholder: "",
      onHover: false,
      optionsWidth: null,
      virtualQuery: ""
    };
  },
  props: {
    // 当前的选中值
    value: {
      type: [Array, String, Number]
    },
    // 占位符
    placeholder: {
      type: String,
      default: "请选择"
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false
    },
    // 是否可清空
    clearable: {
      type: Boolean,
      default: false
    },
    // 尺寸
    size: {
      validator(value) {
        return oneOf(value, ["mini", "small", "medium", "large"]);
      },
      default: "medium"
    },
    // 是否可搜索
    filterable: {
      type: Boolean,
      default: false
    },
    // 搜索的自定义回调
    filterMethod: {
      required: false,
      type: Function
    },
    // 远程搜索-是否加载中
    loading: {
      type: Boolean,
      default: false
    },
    // 是否为远程搜索
    remote: {
      type: Boolean,
      default: false
    },
    // 远程搜索回调
    remoteMethod: {
      required: false,
      type: Function
    },
    // 是否为多选
    multiple: {
      type: Boolean,
      default: false
    },
    multipleLimit: {
      type: Number,
      default: 0
    },
    virtual: {
      type: Boolean,
      default: false
    },
    virtualOptions: {
      type: Array,
      default: () => []
    },
    valueKey: {
      type: String,
      default: "value"
    },
    labelKey: {
      type: String,
      default: "label"
    }
  },
  computed: {
    placeholderLabel() {
      let x = this.currentPlaceholder
          ? this.currentPlaceholder
          : this.placeholder;
      return x;
    },
    filteredVirtualOptions() {
      if (!this.virtual) return [];
      if (!this.filterable || !this.virtualQuery) {
        return this.virtualOptions;
      }
      const query = this.virtualQuery.toLowerCase();
      return this.virtualOptions.filter(item => {
        const label = String(item[this.labelKey] || '').toLowerCase();
        return label.includes(query);
      });
    },
    virtualOptionsHeight() {
      if (!this.virtual) return undefined;
      const itemSize = 32;
      const maxHeight = 160;
      const borderWidth = 2;
      const actualHeight = this.filteredVirtualOptions.length * itemSize + borderWidth;
      return actualHeight > 0 ? `${Math.min(actualHeight, maxHeight + borderWidth)}px` : `${maxHeight}px`;
    }
  },
  watch: {
    "currentTags.length"(newVal) {
      this.$nextTick(() => {
        setTimeout(() => {
          const height = this.$refs.multiPanel.clientHeight;
          this.panelHeight = height;
        }, 10);
      });

      let values = this.currentTags.reduce((total, cell) => {
        if (cell.choose) {
          total.push(cell.value);
        }
        return total;
      }, []);

      this.$emit("input", values);
      this.$emit("change", values);
    },
    value: {
      handler(newVal) {
        this.syncValue(newVal);
      },
      immediate: true
    },
    visible(newVal) {
      this.$emit("visible-change", newVal);
      if (newVal) {
        this.updateOptionsWidth();
      }
    },
    multiple: {
      handler(value) {
        this.setMultiOptionStyle(value);
      },
      immediate: true
    }
  },
  created() {
    this.$on("on-option-add", child => {
      child && this.options.push(child);
      this.syncValue(this.value);
      this.setMultiOptionStyle(this.multiple);
    });

    this.$on("on-option-select", child => {
      if (this.multiple) {
        this.handleMultiChoose(child);
      } else {
        this.handleChoose(child);
      }
    });

    this.$on("on-option-remove", child => {
      this.options.splice(this.options.indexOf(child), 1);
    });
  },
  // 挂载时，绑定根元素点击事件
  mounted() {
    document.addEventListener("click", this.addCloseEvent);

    this.$refs.myInput.addEventListener("mouseenter", this.setHoverAttr);
    this.$refs.myInput.addEventListener("mouseleave", this.setHoverAttr);

    this.updateOptionsWidth();
  },
  // 移除时，删除根元素点击事件
  beforeDestroy() {
    document.removeEventListener("click", this.addCloseEvent);

    this.$refs.myInput.removeEventListener("mouseenter", this.setHoverAttr);
    this.$refs.myInput.removeEventListener("mouseleave", this.setHoverAttr);
  },
  methods: {
    updateOptionsWidth() {
      if (this.$refs.USelect) {
        this.optionsWidth = this.$refs.USelect.offsetWidth;
      }
    },
    handleMultiClick() {
      if (this.disabled) return;
      this.visible = !this.visible;
      if (this.filterable && this.visible) {
        this.$nextTick(() => {
          this.$refs.multiInput.focus();
        });
      }
    },
    handleClick() {
      this.visible = !this.visible;
    },
    // 单项选择
    handleChoose(opt) {
      this.options.forEach(d => (d.selected = false));
      opt.selected = true;

      this.currentValue = opt.value;
      this.currentLabel = opt.label;
      this.visible = false;
      this.$emit("input", this.currentValue);
      this.$emit("change", this.currentValue);
    },
    // 多选
    handleMultiChoose(opt) {
      if (
          this.multipleLimit > 0 &&
          this.currentTags.length >= this.multipleLimit &&
          !opt.choose
      )
        return;

      opt.choose = !opt.choose;

      // 多选且可搜索条件下，默认选中输入框
      if (this.filterable) {
        this.$refs.multiInput.focus();
      }

      if (opt.choose) {
        this.currentTags.push(opt);
      } else {
        this.currentTags.splice(this.currentTags.indexOf(opt), 1);
      }
    },
    // 判断是否关闭
    addCloseEvent(event) {
      const target = event.target;
      if (!this.$refs.USelect) return;

      if (!this.$refs.USelect.contains(target) && this.visible) {
        this.visible = false;
      }
    },
    setHoverAttr(event) {
      this.onHover = event.type === "mouseenter";
    },
    handleClear() {
      this.currentLabel = "";
      this.currentValue = "";
      this.options.forEach(d => (d.selected = false));
      this.$emit("input", null);
      this.$emit("change", null);
      this.$emit("clear");
    },
    /**
     * @description 过滤-输入事件
     */
    handleInput(_e) {
      this.currentLabel = _e.target.value;
      if (this.virtual) {
        this.virtualQuery = _e.target.value;
        return;
      }
      debounce(
          () => {
            // 远程搜索
            if (this.remote && typeof this.remoteMethod === "function") {
              this.remoteMethod(_e.target.value);
            }
            // 自定义搜索
            else if (
                this.filterMethod &&
                typeof this.filterMethod === "function"
            ) {
              this.filterMethod(_e.target.value);
            }
            // 默认搜索
            else {
              this.filterOptionsByValue(_e.target.value);
            }
          },
          333,
          "u-select-input"
      );
    },
    /**
     * @description 根据输入值过滤出参数
     * @param { string } value 输入值
     */
    filterOptionsByValue(value) {
      this.options.forEach(cell => {
        const label = cell.label || '';
        cell.visible = String(label).indexOf(value) > -1;
      });

      this.setNoDataVisible();
    },
    /**
     * @description 输入框触发focus事件
     */
    handleInputFocus(_e) {
      if (this.filterable) {
        this.currentPlaceholder = this.currentLabel;
        this.currentLabel = "";
      }
      this.$emit("focus", _e);
    },
    /**
     * @description 输入空触发blur事件
     */
    handleInputBlur(_e) {
      if (this.filterable) {
        this.currentLabel = this.currentPlaceholder;
        this.currentPlaceholder = "";
      }

      this.$emit("blur", _e);

      setTimeout(() => {
        if (this.visible) return;
        // if (this.filterable && _e.target.value) {
        //   _e.target.value = "";
        // }

        this.filterOptionsByValue("");
      }, 250);
    },
    /**
     * @description 没有选项时，显示暂无数据
     */
    setNoDataVisible() {
      let hasOptions = false;
      hasOptions = this.options.length > 0;
      if (this.filterable) {
        hasOptions = !!this.options.find(d => d.visible);
      }
      this.hasOptions = hasOptions;
    },
    /**
     * @description 多选模式下，选项的padding-right放大
     */
    setMultiOptionStyle(multi) {
      this.options.forEach(d => (d.multi = multi));
    },
    handleTagClose(opt) {
      if (this.disabled) return;
      opt.choose = false;
      this.$emit("remove-tag", opt.value);
      this.currentTags.splice(this.currentTags.indexOf(opt), 1);
    },
    /**
     * @description 同步选择值
     * @param {number|string} value 选择值
     */
    syncValue(value) {
      if (this.multiple) {
        this.__syncMultiValues(value);
      } else {
        this.__syncSimpleValue(value);
      }
      this.dispatch('UFormItem', 'form-change', value)
    },
    /**
     * @description 同步单选的选择值
     */
    __syncSimpleValue(value) {
      const that = this;
      const options = this.virtual ? this.virtualOptions : this.options;
      let found = false;

      options.forEach(d => {
        const optionValue = this.virtual ? d[this.valueKey] : d.value;
        if (optionValue === value) {
          found = true;
          that.currentValue = value;
          that.currentLabel = this.virtual ? d[this.labelKey] : d.label;
          if (!this.virtual) {
            d.selected = true;
          }
        } else if (!this.virtual) {
          d.selected = false;
        }
      });

      if (!found) {
        that.currentValue = value;
        that.currentLabel = value;
      }
    },
    /**
     * @description 同步多选的选择值
     */
    __syncMultiValues(values) {
      this.options.forEach(d => {
        if (values.includes(d.value)) {
          d.choose = true;

          if (!this.currentTags.find(tag => tag.value === d.value)) {
            this.currentTags.push(d);
          }
        } else {
          d.choose = false;
          if (this.currentTags.find(tag => tag.value === d.value)) {
            this.currentTags.splice(this.currentTags.indexOf(d), 1);
          }
        }
      });
    },
    handleVirtualSelect(item) {
      if (this.multiple) {
        this.handleVirtualMultiSelect(item);
      } else {
        this.currentValue = item[this.valueKey];
        this.currentLabel = item[this.labelKey];
        this.visible = false;
        this.$emit("input", this.currentValue);
        this.$emit("change", this.currentValue);
      }
    },
    handleVirtualMultiSelect(item) {
      const value = item[this.valueKey];
      const index = this.currentTags.findIndex(tag => tag.value === value);
      if (index > -1) {
        this.currentTags.splice(index, 1);
        this.$emit("remove-tag", value);
      } else {
        if (
          this.multipleLimit > 0 &&
          this.currentTags.length >= this.multipleLimit
        ) {
          return;
        }
        this.currentTags.push({
          value: item[this.valueKey],
          label: item[this.labelKey]
        });
      }
      const values = this.currentTags.map(tag => tag.value);
      this.$emit("input", values);
      this.$emit("change", values);
    },
    isVirtualOptionSelected(item) {
      const value = item[this.valueKey];
      if (this.multiple) {
        return this.currentTags.some(tag => tag.value === value);
      }
      return this.currentValue === value;
    }
  }
};
</script>
<style scoped>

.u-select {
  position: relative;
  width: 220px;
  display: inline-block
}

.u-select-inner {
  position: relative
}

.u-select-inner-input {
  cursor: pointer;
  background-color: #fff;
  background-image: none;
  border-radius: 4px;
  border: 1px solid #d8d8d8;
  box-sizing: border-box;
  color: #606266;
  display: inline-block;
  font-size: 13px;
  height: 36px;
  line-height: 34px;
  outline: 0;
  padding: 0 30px 0 15px;
  transition: border-color .2s cubic-bezier(.645, .045, .355, 1);
  width: 100%
}

.u-select-inner-input-select {
  border-color: #00554a
}

.u-select-inner-input-disabled {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #c0c4cc;
  cursor: not-allowed
}

.u-select-inner-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 3px;
  width: 25px;
  height: 34px;
  line-height: 34px;
  text-align: center;
  cursor: pointer;
  transition: all .2s;
  color: #bbbcc0
}

.u-select-inner-icon-focus {
  transform: translateY(-50%) rotate(180deg);
  color: #00554a
}

.u-select-inner-input-size-large {
  height: 40px;
  line-height: 38px
}

.u-select-inner-icon-size-large {
  height: 38px;
  line-height: 38px
}

.u-select-inner-input-size-small {
  font-size: 12px;
  height: 32px;
  line-height: 30px
}

.u-select-inner-icon-size-small {
  height: 30px;
  line-height: 30px
}

.u-select-inner-input-size-mini {
  font-size: 12px;
  height: 28px;
  line-height: 26px
}

.u-select-inner-icon-size-mini {
  height: 26px;
  line-height: 26px
}

.u-select-options {
  max-height: 160px;
  transform-origin: center top;
  z-index: 2367;
  position: absolute;
  top: 42px;
  left: 0;
  border: solid 1px #e4e7ed;
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
  box-sizing: border-box;
  margin: 5px 0;
  overflow-x: hidden;
  overflow-y: auto
}

.u-select-options::-webkit-scrollbar-track-piece {
  background: #f8f8f8
}

.u-select-options::-webkit-scrollbar {
  width: 6px;
  height: 6px
}

.u-select-options::-webkit-scrollbar-thumb:hover {
  background-color: #bbb
}

.u-select-options::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 10px
}

.u-select-options-no-data {
  padding: 5px 0;
  line-height: 32px;
  margin: 0;
  text-align: center;
  color: #999;
  font-size: 13px
}

.u-select-multi {
  cursor: pointer;
  box-sizing: border-box;
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  padding: 0 30px 4px 10px
}

.u-select-multi-disabled {
  cursor: not-allowed !important
}

.u-select-multi .u-tag {
  margin: 4px 4px 0 0
}

.u-select-multi-input {
  display: inline-block;
  width: 80px;
  border: none;
  outline: 0;
  height: 20px;
  line-height: 20px;
  padding: 0;
  margin-top: 4px
}

.u-select-multi-large {
  padding: 6px 30px 10px 10px
}

.u-select-multi-small {
  padding: 2px 30px 6px 10px
}

.u-select-multi-medium {
  padding: 4px 30px 8px 10px
}

::-webkit-input-placeholder {
  color: #bbbcc0
}

:-moz-placeholder {
  color: #bbbcc0
}

::-moz-placeholder {
  color: #bbbcc0
}

:-ms-input-placeholder {
  color: #bbbcc0
}

.u-select-options-virtual {
  max-height: 160px;
  padding: 0;
}

.u-virtual-option {
  height: 100%;
  padding: 0 15px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: #606266;
  box-sizing: border-box;
}

.u-virtual-option:hover {
  background-color: #f5f7fa;
}

.u-virtual-option-selected {
  font-weight: 700;
  color: #00554a;
  background-color: #f5f7fa;
}
</style>
