<template>
  <UDialog
    :title="dialogTitle"
    width="500px"
    :visible="visible"
    :z-index="10000"
    @close="handleClose"
  >
    <div class="dialog-content">
      <u-form ref="form" :model="formData" :rules="rules" :label-width="120">
        <u-form-item :label="$t('dialog.mapping.key')" prop="value">
          <u-input
            v-model="formData.value"
            :placeholder="$t('dialog.mapping.keyPlaceholder')"
          />
        </u-form-item>
        <u-form-item :label="$t('dialog.mapping.value')" prop="label">
          <u-input
            v-model="formData.label"
            :placeholder="$t('dialog.mapping.valuePlaceholder')"
          />
        </u-form-item>
      </u-form>
    </div>

    <div slot="footer" style="text-align: right">
      <u-button @click="handleClose" type="info" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
      <u-button @click="handleSave">{{ $t('dialog.common.ok') }}</u-button>
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
  name: 'MappingDialog',
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
    mappingItem: {
      type: Object,
      default: () => ({
        value: '',
        label: ''
      })
    },
    operation: {
      type: String,
      default: 'add'
    }
  },
  data() {
    return {
      formData: {
        value: '',
        label: ''
      },
      rules: {
        value: [{
          required: true,
          message: this.$t('dialog.mapping.keyPlaceholder'),
          trigger: 'blur'
        }],
        label: [{
          required: true,
          message: this.$t('dialog.mapping.valuePlaceholder'),
          trigger: 'blur'
        }]
      }
    };
  },
  computed: {
    dialogTitle() {
      return this.operation === 'add' ? this.$t('dialog.mapping.add') : this.$t('dialog.mapping.edit');
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetForm();
        this.initData();
      }
    }
  },
  methods: {

    initData() {
      this.formData = {
        value: this.mappingItem?.value || '',
        label: this.mappingItem?.label || ''
      };
    },

    resetForm() {
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
     * 保存映射项
     */
    async handleSave() {
      const valid = await this.validateForm();
      if (!valid) {
        return;
      }

      this.$emit('save', {
        value: this.formData.value,
        label: this.formData.label
      });

      this.handleClose();
    },

    /**
     * 关闭弹窗
     */
    handleClose() {
      this.$emit('update:visible', false);
    }
  }
};
</script>
<style scoped>
</style>
