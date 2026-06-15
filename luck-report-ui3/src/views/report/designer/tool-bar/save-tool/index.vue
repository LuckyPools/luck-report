<template>
  <u-button
      :title="$t('tools.save.save')"
      class="tool-button"
      icon="icon-save2"
      @click="handleClick"
  >
    <SaveDialog
      :visible="visible"
      @update:visible="visible = $event"
      @saveAfter="handleSaveAfter"
    />
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
  data() {
    return {
      visible: false
    };
  },
  computed: {
    ...mapGetters('report', ['getSaveStatus', 'getFileName', 'getContext']),
    context() {
      return this.getContext;
    }
  },
  methods: {
    handleClick() {
      if (!this.getSaveStatus) {
        this.visible = true;
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
              showAlert(this.$t('dialog.save.serverError') + this.$t('colon') + error.msg, { useHTMLString: true });
            } else {
              showAlert(this.$t('tools.save.failSave'));
            }
          });
    },
    handleSaveAfter(fullFile){
      window.location.replace("?reportPath=" + fullFile);
    }
  }
};
</script>

<style scoped>
</style>
