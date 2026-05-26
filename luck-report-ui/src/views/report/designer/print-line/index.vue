<template>
  <div
    v-show="showPrintLine"
    ref="printLine"
    title="打印线"
    class="right-hr-for-print"
    :style="lineStyle"
  ></div>
</template>

<script>
export default {
  name: 'PrintLine',
  computed: {
    /**
     * 从vuex获取context
     */
    context: function() {
      return this.$store.getters['report/getContext'];
    },
    /**
     * 获取打印线刷新标志
     */
    isPrintLineRefresh() {
      return this.$store.getters['report/getPrintLineShouldRefresh'];
    },
    /**
     * 获取打印线显示状态
     */
    showPrintLine() {
      return this.$store.getters['report/getShowPrintLine'];
    }
  },
  watch: {
    /**
     * 监听打印线刷新标志，为true时刷新打印线并重置标志
     */
    isPrintLineRefresh(newVal) {
      if (newVal) {
        this.refresh();
        this.$store.dispatch('report/setIsPrintLineRefresh', false);
      }
    }
  },
  data() {
    return {
      lineStyle: {
        height: '0px',
        width: '0px',
        borderLeft: 'dashed 1px #999999',
        position: 'absolute',
        left: '300pt',
        top: '35px',
        zIndex: 10
      }
    };
  },
  mounted() {
    // 监听窗口大小变化
    window.addEventListener('resize', this.updateLineHeight);
    // 初始化打印线高度
    this.updateLineHeight();
  },
  beforeUnmount() {
    // 清理事件监听
    window.removeEventListener('resize', this.updateLineHeight);
  },
  methods: {

    /**
     * 更新打印线高度
     */
    updateLineHeight() {
      const height = window.innerHeight - 90;
      this.lineStyle.height = height + 'px';
    },

    /**
     * 刷新打印线位置
     */
    refresh() {
      if (!this.context || !this.context.reportDef || !this.context.reportDef.paper) {
        return;
      }
      const paper = this.context.reportDef.paper;
      const orientation = paper.orientation;
      let width = paper.width;

      // 如果是横向，交换宽高
      if (orientation === 'landscape') {
        width = paper.height;
      }

      // 计算实际宽度（减去左右边距）并加上偏移量
      const actualWidth = width - paper.leftMargin - paper.rightMargin + 38;

      // 更新打印线位置
      this.lineStyle.left = actualWidth + 'pt';
    }
  }
};
</script>

<style scoped>
/* 可以在这里添加组件特定的样式 */
</style>
