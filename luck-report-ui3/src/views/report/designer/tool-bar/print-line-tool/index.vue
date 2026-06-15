<template>
  <u-button
      :title="buttonTitle"
      class="tool-button"
      :icon="buttonIcon"
      @click="handleClick"
  >
  </u-button>
</template>

<script>
import UButton from "@/components/button/index.vue";

export default {
  name: 'PrintLineTool',
  components: {UButton},
  computed: {
    /**
     * 获取打印线显示状态
     */
    showPrintLine() {
      return this.$store.getters['report/getShowPrintLine'];
    },
    /**
     * 按钮标题，根据状态显示不同的提示
     */
    buttonTitle() {
      return this.showPrintLine ? this.$t('tools.printLine.hidePrintLine') : this.$t('tools.printLine.showPrintLine');
    },
    /**
     * 按钮图标，根据状态显示不同的图标
     */
    buttonIcon() {
      return this.showPrintLine ? 'icon-browse' : 'icon-hide';
    }
  },
  methods: {
    /**
     * 处理按钮点击事件，切换打印线显示状态
     */
    handleClick() {
      this.$store.dispatch('report/setShowPrintLine', !this.showPrintLine);
    }
  }
};
</script>

<style scoped>
</style>
