<template>
  <u-button
      :title="$t('tools.save.save')"
      class="tool-button"
      icon="icon-save2"
      @click="execute"
  >
    <SaveDialog ref="saveDialog" @saveAfter="handleSaveAfter" />
  </u-button>
</template>

<script>
import { showAlert } from '@/utils/comnon.js';
import { resetDirty, tableToXml } from '@/utils/table.js';
import { saveReportFile } from '@/api/designer/index.js';
import UButton from "@/components/button/index.vue";
import SaveDialog from "@/views/report/designer/tool-bar/save-as-tool/save-dialog/index.vue";
import { mapGetters } from 'vuex';

export default {
  name: 'SaveTool',
  components: {SaveDialog, UButton},
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapGetters('report', ['getIsSaved', 'getFileName'])
  },
  methods: {
    execute() {
      if (!this.getIsSaved) {
        const content = tableToXml(this.context);
        this.showSaveDialog(content);
        return;
      }

      const content = tableToXml(this.context);

      const fullFileName = this.getFileName + ".ureport.xml";
      saveReportFile(fullFileName, content)
          .then(() => {
            showAlert(this.$t('tools.save.successSave'));
            resetDirty();
          })
          .catch(error => {
            console.error('保存失败:', error);
            if (error.msg) {
              showAlert("服务端错误：" + error.msg);
            } else {
              showAlert(this.$t('tools.save.failSave'));
            }
          });
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
