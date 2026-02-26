<template>
  <div :class="classes">
    <span v-if="$slots.default" :class="slotClasses">
      <slot></slot>
    </span>
  </div>
</template>

<script>
const prefixCls = 'u-divider'
export default {
  name: 'UDivider',
  props: {
    type: {
      type: String,
      default: 'horizontal'// 'horizontal', 'vertical'
    },
    align: {
      type: String,
      default: 'center'// 'left', 'right', 'center'
    },
    dashed: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    classes() {
      return [
        `${prefixCls}`,
        `${prefixCls}-${this.type}`,
        {
          [`${prefixCls}-dashed`]: !!this.dashed
        }
      ]
    },
    slotClasses() {
      return [
        `${prefixCls}-inner-text`, `is-${this.align}`
      ]
    }
  }
}
</script>
<style scoped>
.u-divider {

}

.u-divider {
  position: relative
}

.u-divider-horizontal {
  display: block;
  height: 1px;
  width: 100%;
  margin: 24px 0
}

.u-divider-vertical {
  position: relative;
  margin: 0 8px;
  display: inline-block;
  height: 1em;
  width: 1px;
  vertical-align: middle;
  top: -.06em
}

.u-divider-dashed {
  background: 0 0;
}

.u-divider-inner-text {
  position: absolute;
  background-color: #fff;
  padding: 0 16px;
  font-weight: 600;
  color: #303133;
  font-size: 14px
}

.u-divider-inner-text.is-left {
  left: 24px;
  transform: translateY(-50%)
}

.u-divider-inner-text.is-center {
  left: 50%;
  transform: translate(-50%) translateY(-50%)
}

.u-divider-inner-text.is-right {
  right: 24px;
  transform: translateY(-50%)
}

</style>
