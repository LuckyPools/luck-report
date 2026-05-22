<template>
  <UDialog
      :title="isCol ? $t('dialog.rowColWidthHeight.colWidth') : $t('dialog.rowColWidthHeight.rowHeight')"
      width="400px"
      :visible="visible"
      @close="handleClose"
  >
    <div class="dialog-content">
      <u-form ref="form" :model="formData" :rules="rules" :label-width="100">
        <u-form-item class="solo-label" :label="isCol ? $t('dialog.rowColWidthHeight.colWidth') : $t('dialog.rowColWidthHeight.rowHeight')" prop="value">
          <u-input-number
              :placeholder="$t('dialog.rowColWidthHeight.tip')"
              v-model="formData.value"
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
import UDialog from '@/components/dialog/index.vue';
import UButton from "@/components/button/index.vue";
import UInputNumber from "@/components/input-number/index.vue";
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';

export default {
  name: 'RowColWidthHeightDialog',
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
      formData: {
        value: ''
      },
      rules: {
        value: [{
          required: true,
          type: 'number',
          message: this.$t('dialog.rowColWidthHeight.numValidate'),
          trigger: 'blur'
        }]
      },
      isCol: false,
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
    /**
     * 显示弹窗
     * @param {Function} callback - 回调函数
     * @param {Number} value - 初始值
     * @param {Boolean} isCol - 是否为列操作
     */
    show(callback, value, isCol) {
      this.visible = true;
      this.formData.value = value || '';
      this.isCol = !!isCol;
      this.callback = callback;
    },

    /**
     * 校验表单
     * @returns {Promise<boolean>} 校验结果
     */
    validateForm() {
      return new Promise((resolve) => {
        this.$refs.form.validate((valid) => {
          resolve(valid);
        });
      });
    },

    /**
     * 确认操作
     */
    async handleOk() {
      const valid = await this.validateForm();
      if (!valid) {
        return;
      }

      const numValue = parseInt(this.formData.value);
      if (typeof this.callback === 'function') {
        this.callback(numValue);
      }
      this.handleClose();
    },

    /**
     * 关闭弹窗
     */
    handleClose() {
      this.$refs.form && this.$refs.form.resetFields();
      this.visible = false;
      setTimeout(() => {
        this.callback = null;
      }, 300);
    },

    /**
     * 键盘事件处理
     * @param {KeyboardEvent} e - 键盘事件
     */
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


