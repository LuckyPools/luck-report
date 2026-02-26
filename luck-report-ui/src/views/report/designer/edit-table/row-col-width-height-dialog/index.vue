<template>
  <UDialog
    :title="isCol ? $t('dialog.rowColWidthHeight.colWidth') : $t('dialog.rowColWidthHeight.rowHeight')"
    width="400px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="dialog-content">
      <div class="form-group">
        <label>{{ isCol ? $t('dialog.rowColWidthHeight.colWidth') : $t('dialog.rowColWidthHeight.rowHeight') }}：</label>
        <div class="u-inline">
          <u-input-number
            :placeholder="$t('dialog.rowColWidthHeight.tip')"
            v-model="value"
            ref="input"
            @keyup.enter="handleOk"
          />
        </div>
      </div>
    </div>
    <div slot="footer" style="text-align: right">
      <u-button @click="handleClose" type="info" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
      <u-button @click="handleOk">{{ $t('dialog.common.ok') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import { showAlert } from '@/utils/comnon.js';
import UDialog from '@/components/dialog/index.vue';
import UButton from "@/components/button/index.vue";
import UInputNumber from "@/components/input-number/index.vue";

export default {
  name: 'RowColWidthHeightDialog',
  components: {
    UButton,
    UDialog,
    UInputNumber
  },
  data() {
    return {
      visible: false,
      value: '',
      isCol: false,
      callback: null
    };
  },
  mounted() {
    // 添加键盘事件监听
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeDestroy() {
    // 移除事件监听
    document.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    show(callback, value, isCol) {
      this.visible = true;
      this.value = value || '';
      this.isCol = !!isCol;
      this.callback = callback;
    },
    handleOk() {
      const numValue = parseInt(this.value);
      if (!numValue) {
        showAlert(this.$t('dialog.rowColWidthHeight.numValidate'));
        return;
      }
      if (typeof this.callback === 'function') {
        this.callback(numValue);
      }
      this.handleClose();
    },
    handleClose() {
      this.visible = false;
      setTimeout(() => {
        this.value = '';
        this.callback = null;
      }, 300);
    },
    // 键盘事件处理
    handleKeydown(e) {
      if (this.visible) {
        if (e.key === 'Escape') {
          this.handleClose();
        }
      }
    }
  },
};
</script>

<style scoped>

</style>


