<template>
    <UDialog
      :title="$t('dialog.preview.title')"
      width="1200px"
      top="50px"
      :visible="visible"
      :z-index="20000"
      @close="closeDialog"
    >
        <div class="preview-body-container">
          <div v-if="loading" style="padding: 20px; text-align: center;">
            {{ $t('dialog.preview.load') }}
          </div>
          <div v-else-if="errorInfo" v-html="errorInfo"></div>
          <div v-else-if="resultData">
            <div style="height: 30px; background: #fdfdfd;">
              <span style="margin: 4px;">{{ $t('dialog.preview.total') }}{{ resultData.total }}{{ $t('dialog.preview.totalMid') }}{{ resultData.currentTotal }}{{ $t('dialog.preview.item') }}</span>
            </div>
            <div class="table-container">
              <table class="table table-bordered" style="margin-top: 2px; table-layout: fixed;">
                <thead>
                <tr style="background: #f3f3f3;">
                  <td v-for="field in resultData.fields" :key="field" style="word-wrap: break-word; width: 120px;">
                    {{ field }}
                  </td>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(item, index) in resultData.data" :key="index">
                  <td v-for="field in resultData.fields" :key="`${index}-${field}`" style="word-wrap: break-word;">
                    {{ item[field] }}
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div slot="footer" style="text-align: right">
            <u-button @click="closeDialog" type="info" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
        </div>
    </UDialog>
</template>

<script>
import UDialog from '@/components/dialog/index.vue';
import UButton from '@/components/button/index.vue';
export default {
  name: 'PreviewDataDialog',
  components: {
    UDialog,
    UButton
  },
  data() {
    return {
      visible: false,
      loading: true,
      errorInfo: null,
      resultData: null
    };
  },
  methods: {
    show() {
      this.loading = true;
      this.errorInfo = null;
      this.resultData = null;
      this.visible = true;
    },
    showData(data) {
      this.loading = false;
      this.errorInfo = null;
      this.resultData = data;
    },
    showError(error) {
      this.loading = false;
      this.errorInfo = error;
      this.resultData = null;
    },
    closeDialog() {
      this.visible = false;
    }
  }
};
</script>

<style scoped>
:root {
    --dialog-height: 600px;
}

.preview-body-container{
  max-height: var(--dialog-height);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.table-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  min-height: 0;
  max-height: var(--dialog-height);
}

.preview-body-container table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 0;
}

.preview-body-container table td, .data-table th {
  border: 1px solid #ddd;
}

.preview-body-container table thead th {
  vertical-align: bottom;
  border-bottom: 2px solid #ddd;
}
</style>
