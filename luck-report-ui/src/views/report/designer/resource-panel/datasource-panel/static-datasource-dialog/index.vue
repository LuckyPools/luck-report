<template>
    <UDialog
        :title="$t('dialog.staticDatasource.title')"
        width="800px"
        :visible="visible"
        @close="closeDialog"
    >
        <div class="dialog-content">
            <u-form ref="form" :model="formData" :rules="rules" :label-width="120">
                <u-form-item :label="$t('dialog.staticDatasource.name')" prop="dsName">
                    <u-input v-model="formData.dsName" style="width: 600px" />
                </u-form-item>

                <u-form-item :label="$t('dialog.staticDatasource.remark')" prop="remark">
                    <u-input v-model="formData.remark" style="width: 600px" />
                </u-form-item>
            </u-form>
        </div>

        <div slot="footer" style="text-align: right">
            <u-button @click="handleOk">{{ $t('dialog.common.ok') }}</u-button>
        </div>
    </UDialog>
</template>

<script>
import { showAlert } from '@/utils/comnon.js';
import { setDirty } from '@/utils/table';
import { testConnection } from '@/api/designer';
import UDialog from '@/components/dialog/index.vue';
import UButton from '@/components/button/index.vue';
import UInput from '@/components/input/index.vue';
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';

export default {
  name: 'StaticDatasourceDialog',
  components: {
    UDialog,
    UButton,
    UInput,
    UForm,
    UFormItem
  },
  props: {
    // 用于检查名称是否重复
    datasources: {
      type: Array,
      default: () => []
    },
    // 控制弹窗显示
    visible: {
      type: Boolean,
      default: false
    },
    // 数据源数据
    datasource: {
      type: Object,
      default: null
    }
  },
  data() {
    const validateDsName = (rule, value, callback) => {
      if (!value) {
        callback(new Error(this.$t('dialog.staticDatasource.nameTip')));
      } else if (this.checkDuplicateName(value)) {
        callback();
      } else {
        callback(new Error(`${this.$t('dialog.datasource.datasource')}[${value}]${this.$t('dialog.datasource.existTip')}`));
      }
    };
    return {
      formData: {
        dsName: '',
        remark:''
      },
      oldName: null,
      backdrop: null,
      rules: {
        dsName: [{
          required: true,
          validator: validateDsName,
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
    resetForm() {
      this.$refs.form && this.$refs.form.resetFields();
      this.oldName = null;
    },

    initData() {
      console.log("datasource init ",this.datasource)
      this.oldName = this.datasource?.name;
      this.formData = {
        dsName: this.datasource?.name || '',
        remark: this.datasource?.remark || ''
      };
    },

    closeDialog() {
      this.$emit('close');
    },

    handleClose() {
      this.closeDialog();
    },

    handleOk() {
      this.save();
    },

    validateForm() {
      return new Promise((resolve) => {
        this.$refs.form.validate((valid) => {
          resolve(valid);
        });
      });
    },

    /**
     * 检查是否有重名的数据源
     * @param name
     * @returns {boolean}
     */
    checkDuplicateName(name) {
      if (!this.oldName || name !== this.oldName) {
        for (let source of this.datasources) {
          if (source.name === name) {
            return false;
          }
        }
      }
      return true;
    },

    async save() {
      const valid = await this.validateForm();
      if (!valid) {
        return;
      }
      this.$emit('save', {
        name: this.formData.dsName,
        remark: this.formData.remark,
        type:'staticDs',
        oldName: this.oldName
      });
      setDirty();
      this.closeDialog();
    }
  }
}
</script>

<style scoped>

</style>
