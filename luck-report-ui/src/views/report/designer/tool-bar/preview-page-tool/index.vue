<template>
  <u-button
      :title="$t('tools.preview.pagingPreview')"
      class="tool-button"
      icon="icon-view-page"
      @click="handleClick"
  >
  </u-button>
</template>

<script>
import { tableToXml } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import { savePreviewFile } from '@/api/designer/index.js';
import UButton from "@/components/button/index.vue";
import { mapGetters } from 'vuex';
import { createNavigator, getLibMode } from '@/lib/navigator';

export default {
  name: 'PreviewPageTool',
  components: {UButton},
  data() {
    return {
    };
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    },
    isLibMode() {
      return getLibMode();
    },
    navigator() {
      return createNavigator(this);
    }
  },
  methods: {

    handleClick() {
      const content = tableToXml(this.context);
      let reportPath = this.$store.state.report.fileName;
      if(reportPath){
        reportPath = reportPath + ".ureport.xml";
      }else{
        reportPath = 'p'
      }

      savePreviewFile(reportPath, content)
      .then(() => {
        this.navigator.openPreview({
          reportPath: reportPath,
          mode: 'preview',
          _i: '1',
          _r: '1'
        }, true);
      })
      .catch(error => {
        console.error('预览失败:', error);
        if (error.msg) {
          showAlert(this.$t('dialog.save.serverError') + this.$t('colon') + error.msg, { useHTMLString: true });
        } else {
          showAlert(this.$t('tools.preview.previewFail'));
        }
      });
    }
  }
};
</script>

<style scoped>
</style>
