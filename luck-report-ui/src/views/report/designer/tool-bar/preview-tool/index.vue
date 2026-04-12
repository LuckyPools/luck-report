<template>
  <u-button
      :title="$t('tools.preview.view')"
      class="tool-button"
      icon="icon-preview"
      @click="handleClick"
  >
  </u-button>
</template>

<script>
import { tableToXml } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import { savePreviewFile } from '@/api/designer/index.js';
import UButton from "@/components/button/index.vue";
import { mapGetters, mapActions } from 'vuex';
import { createNavigator, getLibMode } from '@/lib/navigator';

export default {
  name: 'PreviewTool',
  components: {UButton},
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
      let fileName = this.$store.state.report.fileName;
      if(fileName){
        fileName = fileName + ".ureport.xml";
      }else{
        fileName = 'p'
      }

      savePreviewFile(fileName, content)
          .then(() => {
            this.navigator.openPreview({
              reportPath: fileName,
              mode: 'preview'
            }, true);
          })
          .catch(error => {
            console.error('预览失败:', error);
            if (error.msg) {
              showAlert("服务端错误：" + error.msg);
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
