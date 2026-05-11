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
          :key="fileInputKey"
          accept=".xlsx,.xls"
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
  emits: ['update:visible', 'import-success'],
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedFile: null,
      fileInputKey: 0
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.selectedFile = null;
        this.fileInputKey += 1;
      }
    }
  },
  methods: {
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
        this.$emit('import-success');
        this.$emit('update:visible', false);
      } catch (error) {
        console.error('上传文件失败:', error);
        if (error.msg) {
          showAlert(this.$t('dialog.import.fail') + this.$t('colon') + error.msg, { useHTMLString: true });
        } else {
          showAlert(this.$t('dialog.import.fail'));
        }
      }
    },
    handleClose() {
      this.$emit('update:visible', false);
      this.selectedFile = null;
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
