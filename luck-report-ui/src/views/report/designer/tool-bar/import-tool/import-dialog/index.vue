<template>
  <UDialog
    :title="$t('dialog.import.title')"
    width="800px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="dialog-content">
      <div class="form-group">
        <div class="import-description">{{ $t('dialog.import.desc') }}</div>
      </div>
      <div class="form-group">
        <label>{{ $t('dialog.import.file') }}：</label>
        <input
          type="file"
          class="form-control"
          ref="fileInput"
          @change="handleFileChange"
        />
      </div>
    </div>

    <div slot="footer" style="text-align: right">
      <u-button @click="handleClose" type="info" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
      <u-button @click="handleUpload">{{ $t('dialog.common.ok') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import { showAlert } from '@/utils/comnon.js';
import UDialog from '@/components/dialog/index.vue';
import UButton from '@/components/button/index.vue';
import { importExcelFile } from '@/api/designer';

export default {
  name: 'ImportDialog',
  components: {
    UDialog,
    UButton
  },
  data() {
    return {
      visible: false,
      selectedFile: null
    };
  },
  methods: {
    show() {
      this.visible = true;
      this.selectedFile = null;
      // 重置文件输入框
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    handleFileChange(event) {
      this.selectedFile = event.target.files[0];
    },
    async handleUpload() {
      if (!this.selectedFile) {
        showAlert(this.$t('dialog.import.selectFile') || this.$t('dialog.import.file'));
        return;
      }

      try {
        const response = await importExcelFile(this.selectedFile);
        this.handleImportResponse(response);
      } catch (error) {
        console.error('上传文件失败:', error);
        showAlert(this.$t('dialog.import.fail'));
      }
    },
    handleImportResponse(response) {
      const result = response.result;
      if (result) {
        const routeData = this.$router.resolve({
          name: 'Designer',
        });
        window.open(routeData.href , "_self");
      } else {
        const errorInfo = response.errorInfo;
        if (errorInfo) {
          showAlert(`${this.$t('dialog.import.fail')}: ${errorInfo}`);
        } else {
          showAlert(this.$t('dialog.import.fail'));
        }
      }
    },
    handleClose() {
      this.visible = false;
      setTimeout(() => {
        this.selectedFile = null;
      }, 300);
    }
  }
};
</script>

<style scoped>

.import-description {
  margin-bottom: 10px;
  line-height: 2;
  color: #929191;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
</style>
