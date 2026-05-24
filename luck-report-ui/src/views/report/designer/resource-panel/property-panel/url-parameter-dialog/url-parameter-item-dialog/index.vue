<template>
  <UDialog
    :title="title"
    width="500px"
    :visible="visible"
    :z-index="20010"
    @close="handleClose"
  >
    <div class="dialog-content">
      <u-form ref="form" :model="formData" :rules="rules" :label-width="120">
        <u-form-item :label="$t('dialog.paramItem.name')" prop="name">
          <u-input
            v-model="formData.name"
            ref="nameInput"
            @keyup.enter="handleOk"
          />
        </u-form-item>

        <u-form-item :label="$t('dialog.paramItem.expr')" prop="value">
          <u-input
            v-model="formData.value"
            ref="valueInput"
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
import UInput from "@/components/input/index.vue";
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';

export default {
  name: 'URLParameterItemDialog',
  components: {
    UButton,
    UDialog,
    UInput,
    UForm,
    UFormItem
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    paramItem: {
      type: Object,
      default: null
    },
    operation: {
      type: String,
      default: 'add'
    }
  },
  emits: ['saveAfter', 'update:visible'],
  data() {
    return {
      formData: {
        name: '',
        value: ''
      },
      rules: {
        name: [{
          required: true,
          message: this.$t('dialog.paramItem.nameRequired'),
          trigger: 'blur'
        }],
        value: [{
          required: true,
          message: this.$t('dialog.paramItem.valueRequired'),
          trigger: 'blur'
        }]
      }
    };
  },
  computed: {
    title() {
      return this.operation === 'add' ? this.$t('dialog.paramItem.add') : this.$t('dialog.paramItem.edit');
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetFormData();
        this.initData();
      }
    }
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {

    initData(){
      this.formData.name = this.paramItem?.name || '';
      this.formData.value = this.paramItem?.value || '';
    },

    /**
     * 重置表单数据
     */
    resetFormData() {
      this.$refs.form && this.$refs.form.resetFields();
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
     * 确认按钮点击处理
     */
    async handleOk() {
      const valid = await this.validateForm();
      if (!valid) {
        return;
      }

      const paramItem = { name: this.formData.name, value: this.formData.value };

      this.$emit('saveAfter', {
        paramItem: paramItem,
        operation: this.operation
      });

      this.handleClose();
    },

    /**
     * 关闭弹窗
     */
    handleClose() {
      this.resetFormData();
      this.$emit('update:visible', false);
    },

    /**
     * 键盘事件处理
     * @param {KeyboardEvent} e 键盘事件对象
     */
    handleKeydown(e) {
      if (this.visible) {
        if (e.key === 'Escape') {
          this.handleClose();
        }
      }
    }
  }
};
</script>

<style scoped>
</style>
