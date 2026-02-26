<template>
  <u-button
      :title="$t('tools.save.saveAs')"
      class="tool-button"
      icon="icon-save-as"
      @click="execute"
  >
    <SaveDialog ref="saveDialog" @saveAfter="handleSaveAfter" />
  </u-button>
</template>

<script>
import { tableToXml } from '@/utils/table.js';
import SaveDialog from '@/views/report/designer/tool-bar/save-as-tool/save-dialog/index.vue';
import UButton from "@/components/button/index.vue";

export default {
  name: 'SaveAsTool',
  components: {
    SaveDialog,
    UButton
  },
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  methods: {
    execute() {
      const content = tableToXml(this.context);
      this.showSaveDialog(content);
    },
    showSaveDialog(content) {
      if (this.$refs.saveDialog && this.$refs.saveDialog.show) {
        this.$refs.saveDialog.show(content, this.context);
      }
    },
    handleSaveAfter(fullFile){
      window.location.replace("?reportPath=" + fullFile);
    }
  }
};
</script>

<style scoped>
</style>
