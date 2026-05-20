<template>
    <UDialog
      :title="$t('dialog.preview.title')"
      width="1200px"
      top="50px"
      :visible="visible"
      :z-index="20000"
      @close="closeDialog"
    >
        <div class="preview-body-container" v-loading="loading">
          <div v-if="errorInfo" v-html="errorInfo"></div>
          <div v-else-if="resultData">
            <div style="height: 30px; background: #fdfdfd;">
              <span style="margin: 4px;">{{ $t('dialog.preview.total') }}{{ resultData.total }}{{ $t('dialog.preview.totalMid') }}{{ resultData.currentTotal }}{{ $t('dialog.preview.item') }}</span>
            </div>
            <div class="preview-body-content table-wrapper" style="margin-top: 2px;">
              <table class="table-container" style="table-layout: fixed;">
                <thead>
                  <tr style="background: #f3f3f3;">
                    <th v-for="field in resultData.fields" :key="field" style="word-wrap: break-word; width: 120px;">
                      {{ field }}
                    </th>
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
import { LoadingDirective } from '@/components/loading/instance.js';
import { previewData } from '@/api/designer/index.js';

export default {
  name: 'PreviewDataDialog',
  components: {
    UDialog,
    UButton
  },
  directives: {
    loading: LoadingDirective
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    parameters: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      errorInfo: null,
      resultData: null
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.loadPreviewData();
      }
    }
  },
  methods: {
    async loadPreviewData() {
      if (!this.parameters) {
        return;
      }

      this.loading = true;
      this.errorInfo = null;
      this.resultData = null;

      try {
        const data = await previewData(this.parameters);
        this.loading = false;
        this.resultData = data;
      } catch (error) {
        let msg = this.$t('dialog.sql.previewFail');
        if (error.msg) {
          msg = msg + this.$t('colon') + error.msg;
        }
        this.loading = false;
        this.errorInfo = `<div style='color: #d30e00;'>${msg}</div>`;
      }
    },
    closeDialog() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
:root {
    --dialog-height: 600px;
}

.preview-body-container{
  min-height: 300px;
  max-height: var(--dialog-height);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: black;
}

.preview-body-content {
  min-height: 0;
  max-height: var(--dialog-height);
  overflow-x: scroll;
}

.table-container td{
  padding: 0 5px;
  color: black;
}

</style>
