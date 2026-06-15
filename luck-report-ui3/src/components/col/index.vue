<template>
  <div :class="classes" :style="styles">
    <slot></slot>
  </div>
</template>

<script>
import './style/index.css'
import { findComponentUpward } from '../utils'

const prefixCls = 'u-col'

export default {
  name: 'UCol',
  props: {
    span: [Number, String],
    order: [Number, String],
    offset: [Number, String],
    push: [Number, String],
    pull: [Number, String],
    className: String,
    xs: [Number, Object],
    sm: [Number, Object],
    md: [Number, Object],
    lg: [Number, Object],
    xl: [Number, Object],
    xxl: [Number, Object]
  },
  data() {
    return {
      gutter: 0
    }
  },
  computed: {
    classes() {
      let classList = [
        `${prefixCls}`,
        {
          [`${prefixCls}-span-${this.span}`]: this.span,
          [`${prefixCls}-order-${this.order}`]: this.order,
          [`${prefixCls}-offset-${this.offset}`]: this.offset,
          [`${prefixCls}-push-${this.push}`]: this.push,
          [`${prefixCls}-pull-${this.pull}`]: this.pull,
          [`${this.className}`]: !!this.className
        }
      ];

      ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'].forEach(size => {
        if (typeof this[size] === 'number') {
          classList.push(`${prefixCls}-span-${size}-${this[size]}`)
        } else if (typeof this[size] === 'object') {
          let props = this[size]
          Object.keys(props).forEach(prop => {
            classList.push(
                prop !== 'span'
                    ? `${prefixCls}-${size}-${prop}-${props[prop]}`
                    : `${prefixCls}-span-${size}-${props[prop]}`
            )
          })
        }
      })

      return classList
    },
    styles() {
      let style = {}
      if (this.gutter !== 0) {
        style = {
          paddingLeft: this.gutter / 2 + 'px',
          paddingRight: this.gutter / 2 + 'px'
        }
      }

      return style
    }
  },
  methods: {
    updateGutter() {
      const row = findComponentUpward(this, 'BRow')
      if (row) {
        row.updateGutter(row.gutter)
      }
    }
  },
  mounted() {
    this.updateGutter()
  },
  beforeDestroy() {
    this.updateGutter()
  }
}
</script>
<style scoped>

.u-row {
  position: relative;
  display: block
}

.u-row-flex {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap
}

.u-row-flex:before,.u-row-flex:after {
  display: flex
}

.u-row-flex-start {
  justify-content: flex-start
}

.u-row-flex-center {
  justify-content: center
}

.u-row-flex-end {
  justify-content: flex-end
}

.u-row-flex-space-between {
  justify-content: space-between
}

.u-row-flex-space-around {
  justify-content: space-around
}

.u-row-flex-top {
  align-items: flex-start
}

.u-row-flex-middle {
  align-items: center
}

.u-row-flex-bottom {
  align-items: flex-end
}

.u-row:before,.u-row:after {
  content: "";
  display: table
}

.u-row:after {
  clear: both;
  visibility: hidden;
  font-size: 0;
  height: 0
}
</style>
