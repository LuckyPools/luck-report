<template>
    <UDialog
      :title="$t('dialog.springDS.title')"
      width="500px"
      :visible="visible"
      :z-index="20000"
      @close="closeDialog"
    >
        <u-form ref="form" :model="formData" :rules="rules">
            <u-form-item :label="$t('dialog.springDS.name')" :label-width="120" prop="name">
                <u-input v-model="formData.name" />
            </u-form-item>
            <u-form-item :label="$t('dialog.springDS.bean')" :label-width="120" prop="beanId">
                <u-input v-model="formData.beanId" />
            </u-form-item>
        </u-form>
        <div slot="footer" style="text-align: right">
            <u-button @click="closeDialog" type="info" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
            <u-button @click="saveData">{{ $t('dialog.common.ok') }}</u-button>
        </div>
    </UDialog>
</template>

<script>
import { showAlert } from '@/utils/comnon.js';
import { setDirty } from '@/utils/table.js';
import UDialog from '@/components/dialog/index.vue';
import UButton from "@/components/button/index.vue";
import UInput from '@/components/input/index.vue';
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';

export default {
  name: 'SpringDialog',
  components: {
    UButton,
    UDialog,
    UInput,
    UForm,
    UFormItem
  },
  props: {
    datasources: {
      type: Array,
      default: () => []
    },
    visible: {
      type: Boolean,
      default: false
    },
    datasource: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      formData: {
        name: '',
        beanId: ''
      },
      oldName: null,
      rules: {
        name: [{
          required: true,
          message: this.$t('dialog.springDS.nameTip'),
          trigger: 'blur'
        }],
        beanId: [{
          required: true,
          message: this.$t('dialog.springDS.beanTip'),
          trigger: 'blur'
        }]
      }
    };
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
     * 重置表单数据
     */
    resetForm() {
      this.formData.name = '';
      this.formData.beanId = '';
      this.oldName = null;
    },

    /**
     * 填充表单数据
     */
    initData() {
      this.oldName = this.datasource?.name ?? null;
      this.formData.name = this.datasource?.name ?? '';
      this.formData.beanId = this.datasource?.beanId ?? '';
    },

    /**
     * 保存数据
     */
    async saveData() {
      const valid = await this.validateForm();
      if (!valid) {
        return;
      }

      let check = false;
      if (!this.oldName || this.formData.name !== this.oldName) {
        check = true;
      }

      if (check) {
        for (let source of this.datasources) {
          if (source.name === this.formData.name) {
            showAlert(`${this.$t('dialog.springDS.ds')}[${this.formData.name}]${this.$t('dialog.springDS.exist')}`);
            return;
          }
        }
      }

      this.$emit('save', {
        name: this.formData.name,
        beanId: this.formData.beanId,
        type: 'spring',
        datasets: [],
        oldName: this.oldName
      });
      this.closeDialog();
      setDirty();
    },

    /**
     * 关闭弹窗
     */
    closeDialog() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
</style>
