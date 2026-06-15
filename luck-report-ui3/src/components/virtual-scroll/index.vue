<template>
  <div
    class="u-virtual-scroll"
    ref="scrollContainer"
    @scroll="handleScroll"
  >
    <div
      class="u-virtual-scroll-phantom"
      :style="{ height: totalHeight + 'px' }"
    ></div>
    <div
      class="u-virtual-scroll-content"
      :style="{ transform: `translateY(${offset}px)` }"
    >
      <div
        v-for="item in visibleData"
        :key="getKey(item)"
        class="u-virtual-scroll-item"
        :style="{ height: itemSize + 'px', lineHeight: itemSize + 'px' }"
        @click="handleClick(item)"
      >
        <slot :item="item" :index="item._index">
          {{ item[labelKey] }}
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UVirtualScroll',
  props: {
    items: {
      type: Array,
      default: () => []
    },
    itemSize: {
      type: Number,
      default: 32
    },
    visibleCount: {
      type: Number,
      default: 10
    },
    buffer: {
      type: Number,
      default: 5
    },
    valueKey: {
      type: String,
      default: 'value'
    },
    labelKey: {
      type: String,
      default: 'label'
    }
  },
  data() {
    return {
      startIndex: 0,
      endIndex: this.visibleCount,
      scrollTop: 0
    };
  },
  computed: {
    totalHeight() {
      return this.items.length * this.itemSize;
    },
    visibleData() {
      const start = Math.max(0, this.startIndex - this.buffer);
      const end = Math.min(this.items.length, this.endIndex + this.buffer);
      return this.items.slice(start, end).map((item, index) => {
        return {
          ...item,
          _index: start + index
        };
      });
    },
    offset() {
      const start = Math.max(0, this.startIndex - this.buffer);
      return start * this.itemSize;
    }
  },
  watch: {
    items: {
      handler() {
        this.$nextTick(() => {
          this.updateVisibleRange();
        });
      },
      immediate: true
    }
  },
  methods: {
    getKey(item) {
      return item[this.valueKey] + '_' + item._index;
    },
    handleScroll(e) {
      this.scrollTop = e.target.scrollTop;
      this.updateVisibleRange();
    },
    updateVisibleRange() {
      const startIndex = Math.floor(this.scrollTop / this.itemSize);
      this.startIndex = Math.max(0, startIndex);
      this.endIndex = Math.min(
        this.items.length,
        startIndex + this.visibleCount
      );
    },
    handleClick(item) {
      this.$emit('select', item);
    },
    scrollToIndex(index) {
      const scrollTop = index * this.itemSize;
      this.$refs.scrollContainer.scrollTop = scrollTop;
    }
  }
};
</script>

<style scoped>
.u-virtual-scroll {
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.u-virtual-scroll-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

.u-virtual-scroll-content {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}

.u-virtual-scroll-item {
  box-sizing: border-box;
}
</style>
