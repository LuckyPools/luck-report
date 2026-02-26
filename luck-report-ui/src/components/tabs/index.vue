<template>
  <div :class="['u-tabs tabs', `-${this.type}`]">
    <div class="content" :style="contentStyle" v-if="navPosition === 'bottom' || navPosition === 'right'">
      <slot></slot>
    </div>
    <ul :class="['nav', navPosition, {'center': navCenter}]">
      <li v-for="(tab, index) in tabs" v-html="tab" :key="tab"
          :class="{'active': index === activeIndex }"
          @click.stop="tabClickHandler(index)"></li>
    </ul>
    <div class="content" :style="contentStyle" v-if="navPosition === 'top' || navPosition === 'left'">
      <slot></slot>
    </div>
  </div>
</template>
<script>
export default {
  name: 'UTabs',
  props: {
    value: { type: [Number, String], required: true },
    type: { type: String, default: '' },
    navPosition: { type: String, default: 'top' },
    navCenter: { type: Boolean, default: false },
    padding: { type: String },
    height: { type: String },
    minHeight: { type: String, default: '' },
    maxHeight: { type: String, default: '' },
    overflow: { type: String, default: '' }
  },
  data () {
    return {
      tabs: [],
      activeIndex: 0
    }
  },
  watch: {
    value (nVal, oVal) {
      this.init(nVal)
    }
  },
  computed: {
    contentStyle () {
      const { padding, height, overflow, minHeight, maxHeight } = this
      return {
        padding,
        height,
        minHeight,
        maxHeight,
        overflow
      }
    }
  },
  mounted () {
    this.init(this.value)
  },
  methods: {
    init (indexValue) {
      this.tabs = []
      this.$children.forEach((ele, index) => {
        this.tabs.push(ele.label)
        // if (ele.index !== undefined) index = ele.index
        if (ele.index === indexValue) {
          ele.visible = true
          this.activeIndex = index
        } else {
          ele.visible = false
        }
      })
    },
    tabClickHandler (index) {
      this.$children[this.activeIndex].visible = false
      let ele = this.$children[index]
      ele.visible = true
      this.activeIndex = index
      this.$emit('input', ele.index)
      this.$emit('tab-change', ele.index)
    }
  }
}
</script>
<style scoped>
.u-tabs.tabs {
  font-size: 1rem;
  background: #fff
}

.u-tabs.tabs.-card {
  border: 1px solid rgba(34,36,38,.15);
  box-shadow: 0 2px 3px 0 rgba(34,36,38,.15)
}

.u-tabs.tabs.-card .nav {
  background: #f8f8f8;
  margin: 0
}

.u-tabs.tabs.-card .nav li:first-child {
  margin-left: -1px
}

.u-tabs.tabs.-card .nav.top li {
  margin-top: -1px
}

.u-tabs.tabs.-card .nav.bottom li {
  margin-bottom: -1px
}

.u-tabs.tabs.-text .nav,.u-tabs.tabs.-text .nav li {
  border-color: transparent!important
}

.u-tabs.tabs.-text .nav li {
  padding: .35714286em .5em
}

.u-tabs.tabs.-button .nav {
  border: none!important
}

.u-tabs.tabs.-button .nav li {
  border: none!important;
  border-radius: 3px;
  margin: 0 .357em!important
}

.u-tabs.tabs.-button .nav li.active,.u-tabs.tabs.-button .nav li:hover {
  background-color: rgba(0,0,0,.05)
}

.u-tabs.tabs .nav {
  padding: 0;
  margin: 0;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  list-style: none
}

.u-tabs.tabs .nav.center {
  justify-content: center
}

.u-tabs.tabs .nav li {
  padding: .785em .925em;
  cursor: pointer;
  border: 1px solid transparent;
  line-height: 1
}

.u-tabs.tabs .nav li.active {
  border: 1px solid rgba(34,36,38,.15);
  color: #00554a;
  background: #fff;
  font-weight: 700
}

.u-tabs.tabs .nav li:hover {
  color: #00554a;
}

.u-tabs.tabs .nav.top {
  border-bottom: 1px solid rgba(34,36,38,.15)
}

.u-tabs.tabs .nav.top li {
  margin-bottom: -1px
}

.u-tabs.tabs .nav.top li.active {
  border-bottom-color: #fff
}

.u-tabs.tabs .nav.bottom {
  border-top: 1px solid rgba(34,36,38,.15)
}

.u-tabs.tabs .nav.bottom li {
  margin-top: -1px
}

.u-tabs.tabs .nav.bottom li.active {
  border-top-color: #fff
}
</style>
