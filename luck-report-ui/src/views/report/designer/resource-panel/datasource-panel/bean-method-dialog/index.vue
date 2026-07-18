<template>
  <div>
    <UDialog
      :title="$t('dialog.bean.beanDatasetConfig')"
      width="600px"
      :visible="visible"
      @close="closeDialog"
    >
      <div class="dialog-content">
        <u-form ref="form" :model="formData" :rules="rules" :label-width="120">
          <u-form-item :label="$t('dialog.bean.datasetName')" prop="name">
            <u-input v-model="formData.name" style="width: 400px" />
          </u-form-item>

          <u-form-item :label="$t('dialog.bean.methodName')" prop="method">
            <div class="input-group">
              <u-input v-model="formData.method" :placeholder="$t('dialog.bean.methodParameters')" style="width: 300px" />
              <span class="input-group-btn">
                <u-button type="primary" @click.prevent="selectMethod">{{ $t('dialog.bean.selectMethod') }}</u-button>
              </span>
            </div>
          </u-form-item>

          <u-form-item :label="$t('dialog.bean.returnObject')" prop="clazz">
            <u-input v-model="formData.clazz" :placeholder="$t('dialog.bean.className')" style="width: 400px" />
          </u-form-item>
        </u-form>
      </div>

      <div slot="footer" style="text-align: right">
        <u-button type="info" @click="handleClose" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
        <u-button type="primary" @click="handleOk">{{ $t('dialog.common.ok') }}</u-button>
      </div>
    </UDialog>

    <MethodSelectDialog
      :visible="methodSelectDialogVisible"
      :beanId="beanId"
      @save="handleMethodSelect"
      @close="methodSelectDialogVisible = false"
    />
  </div>
</template>

<script>
import { setDirty } from '@/utils/table.js';
import MethodSelectDialog from '@/views/report/designer/resource-panel/datasource-panel/method-select-dialog/index.vue';
import UDialog from '@/components/dialog/index.vue';
import UButton from '@/components/button/index.vue';
import UInput from '@/components/input/index.vue';
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import { showAlert } from "@/utils/comnon";
import { $t } from "@/locales";

export default {
  name: 'BeanMethodDialog',
  components: {
    MethodSelectDialog,
    UDialog,
    UButton,
    UInput,
    UForm,
    UFormItem
  },
  props: {
    datasources: {
      type: Array,
      default: () => []
    },
    beanId: {
      type: String,
      default: ''
    },
    visible: {
      type: Boolean,
      default: false
    },
    dataset: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      oldName: '',
      formData: {
        name: '',
        method: '',
        clazz: ''
      },
      methodSelectDialogVisible: false,
      rules: {
        name: [{
          required: true,
          message: this.$t('dialog.bean.datasetNameRequired'),
          trigger: 'blur'
        }],
        method: [{
          required: true,
          message: this.$t('dialog.bean.methodRequired'),
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
     * 初始化数据
     */
    initData() {
      this.formData.name = '';
      this.formData.method = '';
      this.formData.clazz = '';
      this.oldName = '';

      if (this.dataset) {
        this.oldName = this.dataset.name;
        this.formData.name = this.dataset.name;
        this.formData.method = this.dataset.method;
        this.formData.clazz = this.dataset.clazz;
      }
    },

    /**
     * 关闭弹窗
     */
    closeDialog() {
      this.$emit('close');
    },

    /**
     * 取消按钮处理
     */
    handleClose() {
      this.closeDialog();
    },

    /**
     * 确认按钮处理
     */
    handleOk() {
      this.save();
    },

    /**
     * 选择方法
     * @param {Event} event 事件对象
     */
    selectMethod(event) {
      if (event) {
        event.preventDefault();
      }
      this.methodSelectDialogVisible = true;
    },

    /**
     * 方法选择回调
     * @param {string} method 选中的方法
     */
    handleMethodSelect(method) {
      this.formData.method = method;
    },

    /**
     * 校验数据集名称是否重复
     * @returns {boolean} 校验结果
     */
    validateName() {
      let check = false;
      if (!this.oldName || this.formData.name !== this.oldName) {
        check = true;
      }

      if (check) {
        for (let datasource of this.datasources) {
          let datasets = datasource.datasets;
          if (!datasets || !Array.isArray(datasets)) {
            continue;
          }

          for (let dataset of datasets) {
            if (dataset.name === this.formData.name) {
              showAlert(`${this.formData.name} ${$t('dialog.bean.datasetExist')}`);
              return false;
            }
          }
        }
      }
      return true;
    },

    /**
     * 保存数据
     */
    async save() {
      const valid = await this.validateForm();
      if (!valid) {
        return;
      }

      if (!this.validateName()) {
        return;
      }

      this.$emit('save', this.formData.name, this.formData.method, this.formData.clazz, this.oldName);

      setDirty();
      this.closeDialog();
    }
  }
};
</script>

<style scoped>
.dialog-content {
  padding: 20px;
}

.input-group {
  display: flex;
  align-items: center;
}

.input-group-btn {
  margin-left: 10px;
}

.btn {
  padding: 6px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  background-color: #f5f5f5;
  cursor: pointer;
}

.btn:hover {
  background-color: #e6e6e6;
}
</style>
