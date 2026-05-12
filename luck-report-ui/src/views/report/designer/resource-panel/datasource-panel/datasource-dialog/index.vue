<template>
    <UDialog
        :title="$t('dialog.datasource.title')"
        width="800px"
        :visible="visible"
        @close="closeDialog"
    >
        <div class="dialog-content">
            <u-form ref="form" :model="formData" :rules="rules" :label-width="120">
                <u-form-item :label="$t('dialog.datasource.name')" prop="dsName">
                    <u-input v-model="formData.dsName" style="width: 600px" />
                </u-form-item>

                <u-form-item :label="$t('dialog.datasource.username')" prop="username">
                    <u-input v-model="formData.username" style="width: 600px" />
                </u-form-item>

                <u-form-item :label="$t('dialog.datasource.password')" prop="password">
                    <u-input type="password" v-model="formData.password" style="width: 600px" />
                </u-form-item>

                <u-form-item :label="$t('dialog.datasource.driver')" prop="driver">
                    <u-input v-model="formData.driver" style="width: 600px" />
                </u-form-item>

                <u-form-item :label="$t('dialog.datasource.url')" prop="url">
                    <u-input v-model="formData.url" style="width: 600px" />
                </u-form-item>
            </u-form>
        </div>

        <div slot="footer" style="text-align: right">
            <u-button @click="testConnection(true)" type="info" style="margin-right: 10px;">{{ $t('dialog.datasource.test') }}</u-button>
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
  name: 'DatasourceDialog',
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
        callback(new Error(this.$t('dialog.datasource.nameTip')));
      } else if (this.checkDuplicateName(value)) {
        callback();
      } else {
        callback(new Error(`${this.$t('dialog.datasource.datasource')}[${value}]${this.$t('dialog.datasource.existTip')}`));
      }
    };
    return {
      formData: {
        dsName: '',
        username: '',
        password: '',
        driver: '',
        url: ''
      },
      oldName: null,
      backdrop: null,
      rules: {
        dsName: [{
          required: true,
          validator: validateDsName,
          trigger: 'blur'
        }],
        username: [{
          required: true,
          message: this.$t('dialog.datasource.usernameTip'),
          trigger: 'blur'
        }],
        password: [{
          required: true,
          message: this.$t('dialog.datasource.passwordTip'),
          trigger: 'blur'
        }],
        driver: [{
          required: true,
          message: this.$t('dialog.datasource.driverTip'),
          trigger: 'blur'
        }],
        url: [{
          required: true,
          message: this.$t('dialog.datasource.urlTip'),
          trigger: 'blur'
        }]
      }
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        if (this.datasource) {
          this.fillForm(this.datasource);
        this.resetForm();
        }
      }
    }
  },
  methods: {
    resetForm() {
      let that = this;
      that.$refs.form && that.$refs.form.resetFields();
      this.oldName = null;
    },

    fillForm(ds) {
      if (ds) {
        this.oldName = ds.name;
        this.formData.dsName = ds.name;
        this.formData.username = ds.username || '';
        this.formData.password = ds.password || '';
        this.formData.driver = ds.driver || '';
        this.formData.url = ds.url || '';
      }
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

    async testConnection(showSuccessTips) {
      const valid = await this.validateForm();
      if (!valid) {
        return false;
      }

      let formData = new FormData();
      formData.append('username', this.formData.username);
      formData.append('password', this.formData.password);
      formData.append('driver', this.formData.driver);
      formData.append('url', this.formData.url);

      try {
        const data = await testConnection(formData);
        if (data.result && showSuccessTips) {
          showAlert(this.$t('dialog.datasource.testSuccess'));
        }
        return true;
      } catch (error) {
        console.error('Error testing connection:', error);
        if (error.msg) {
          showAlert(this.$t('dialog.datasource.failTip') + this.$t('colon') + error.msg, { useHTMLString: true });
        } else {
          showAlert(this.$t('dialog.datasource.failTip'));
        }
      }
      return false;
    },

    async save() {
      const valid = await this.validateForm();
      if (!valid) {
        return;
      }

      const success = await this.testConnection(false);
      if (success) {
        this.$emit('save', {
          name: this.formData.dsName,
          username: this.formData.username,
          password: this.formData.password,
          driver: this.formData.driver,
          url: this.formData.url,
          oldName: this.oldName,
          type: 'jdbc'
        });
        setDirty();
        this.closeDialog();
      }
    }
  }
}
</script>

<style scoped>
/* 样式可以根据需要自定义 */
</style>
