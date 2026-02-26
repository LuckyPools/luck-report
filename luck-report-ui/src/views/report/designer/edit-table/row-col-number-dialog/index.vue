<template>
  <UDialog
    :title="isRow ? $t('dialog.rowColNumber.insertRow') : $t('dialog.rowColNumber.insertCol')"
    width="400px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="dialog-content">
      <u-form :label-width="100">
        <u-form-item :label="isRow ? $t('dialog.rowColNumber.rowCount') : $t('dialog.rowColNumber.colCount')">
          <u-input-number
            :placeholder="$t('dialog.rowColNumber.tip')"
            v-model="number"
            :min="1"
            ref="input"
            @keyup.enter="handleOk"
          />
        </u-form-item>
      </u-form>
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
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';

export default {
  name: 'RowColNumberDialog',
  components: {
    UButton,
    UDialog,
    UInputNumber,
    UForm,
    UFormItem
  },
  data() {
    return {
      visible: false,
      number: 1,
      isRow: false,
      callback: null
    };
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    show(callback, isRow) {
      this.visible = true;
      this.number = 1;
      this.isRow = !!isRow;
      this.callback = callback;
    },
    handleOk() {
      const numValue = parseInt(this.number);
      if (!numValue || numValue < 1) {
        showAlert(this.$t('dialog.rowColNumber.numValidate'));
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
        this.number = 1;
        this.callback = null;
      }, 300);
    },
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
