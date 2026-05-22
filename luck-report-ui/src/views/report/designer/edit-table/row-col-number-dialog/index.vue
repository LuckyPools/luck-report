<template>
  <UDialog
    :title="isRow ? $t('dialog.rowColNumber.insertRow') : $t('dialog.rowColNumber.insertCol')"
    width="400px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="dialog-content">
      <u-form ref="form" :model="formData" :rules="rules" :label-width="100">
        <u-form-item class="solo-label" :label="isRow ? $t('dialog.rowColNumber.rowCount') : $t('dialog.rowColNumber.colCount')" prop="num">
          <u-input-number
            :placeholder="$t('dialog.rowColNumber.tip')"
            v-model="formData.num"
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
      formData: {
        num: 1
      },
      rules: {
        num: [{
          required: true,
          type: 'number',
          message: this.$t('dialog.rowColNumber.numValidate'),
          trigger: 'blur'
        }]
      },
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
    /**
     * 显示弹窗
     * @param {Function} callback - 回调函数
     * @param {Boolean} isRow - 是否为行操作
     */
    show(callback, isRow) {
      this.visible = true;
      this.formData.num = 1;
      this.isRow = !!isRow;
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

      const numValue = parseInt(this.formData.num);
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
