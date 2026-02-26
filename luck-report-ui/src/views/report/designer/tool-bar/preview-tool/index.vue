<template>
  <u-button
      :title="$t('tools.preview.view')"
      class="tool-button"
      icon="icon-preview"
      @click="execute"
  >
  </u-button>
</template>

<script>
import { tableToXml } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import { savePreviewFile } from '@/api/designer/index.js';
import UButton from "@/components/button/index.vue";

export default {
  name: 'PreviewTool',
  components: {UButton},
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  data() {
    return {

    };
  },
  methods: {
    // 执行预览操作
    execute() {
      const content = tableToXml(this.context);
      let fileName = this.$store.state.report.fileName;
      if(fileName){
        fileName = fileName + ".ureport.xml";
      }else{
        fileName = 'p'
      }

      savePreviewFile(fileName, content)
          .then(() => {
            // 使用路由解析获取URL，然后在新标签页中打开
            const routeData = this.$router.resolve({
              name: 'Preview',
              query: {
                reportPath: fileName,
                mode: 'preview'
              }
            });

            // 打开新窗口预览
            window.open(routeData.href, "_blank");
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
