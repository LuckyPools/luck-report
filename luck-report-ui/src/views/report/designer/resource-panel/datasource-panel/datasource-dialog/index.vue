<template>
    <UDialog
        :title="$t('dialog.datasource.title')"
        width="800px"
        :visible="visible"
        @close="closeDialog"
    >
        <div class="dialog-content">
            <u-form ref="form" :label-width="120">
                <u-form-item :label="$t('dialog.datasource.name')">
                    <u-input v-model="dsName" style="width: 600px" />
                </u-form-item>

                <u-form-item :label="$t('dialog.datasource.username')">
                    <u-input v-model="username" style="width: 600px" />
                </u-form-item>

                <u-form-item :label="$t('dialog.datasource.password')">
                    <u-input type="password" v-model="password" style="width: 600px" />
                </u-form-item>

                <u-form-item :label="$t('dialog.datasource.driver')">
                    <u-input v-model="driver" style="width: 600px" />
                </u-form-item>

                <u-form-item :label="$t('dialog.datasource.url')">
                    <u-input v-model="url" style="width: 600px" />
                </u-form-item>
            </u-form>
        </div>

        <div slot="footer" style="text-align: right">
            <u-button @click="handleTestConnection" type="info" style="margin-right: 10px;">{{ $t('dialog.datasource.test') }}</u-button>
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
    }
  },
  data() {
    return {
      visible: false,
      dsName: '',
      username: '',
      password: '',
      driver: '',
      url: '',
      oldName: null,
      backdrop: null
    };
  },
  methods: {
    show(ds) {
      // 重置表单
      this.dsName = '';
      this.username = '';
      this.password = '';
      this.driver = '';
      this.url = '';
      this.oldName = null;

      // 如果提供了数据源，填充表单
      if (ds) {
        this.oldName = ds.name;
        this.dsName = ds.name;
        this.username = ds.username || '';
        this.password = ds.password || '';
        this.driver = ds.driver || '';
        this.url = ds.url || '';
      }

      // 显示对话框
      this.visible = true;

    },

    closeDialog() {
      this.visible = false;
    },

    handleClose() {
      this.closeDialog();
    },

    handleOk() {
      this.save();
    },

    async handleTestConnection() {
      const result = await this.testConnection();
      if (result.success) {
        showAlert(this.$t('dialog.datasource.testSuccess'));
      }
    },

    validateForm() {
      if (this.dsName === '') {
        showAlert(this.$t('dialog.datasource.nameTip'));
        return false;
      }
      if (this.username === '') {
        showAlert(this.$t('dialog.datasource.usernameTip'));
        return false;
      }
      if (this.driver === '') {
        showAlert(this.$t('dialog.datasource.driverTip'));
        return false;
      }
      if (this.url === '') {
        showAlert(this.$t('dialog.datasource.urlTip'));
        return false;
      }
      return true;
    },

    checkDuplicateName() {
      let check = false;
      if (!this.oldName || this.dsName !== this.oldName) {
        check = true;
      }

      if (check) {
        for (let source of this.datasources) {
          if (source.name === this.dsName) {
            showAlert(`${this.$t('dialog.datasource.datasource')}[${this.dsName}]${this.$t('dialog.datasource.existTip')}`);
            return false;
          }
        }
      }
      return true;
    },

    buildFormData() {
      let formData = new FormData();
      formData.append('username', this.username);
      formData.append('password', this.password);
      formData.append('driver', this.driver);
      formData.append('url', this.url);
      return formData;
    },

    async testConnection() {
      if (!this.validateForm()) {
        return {success: false};
      }
      if (!this.checkDuplicateName()) {
        return {success: false};
      }

      const formData = this.buildFormData();
      try {
        const data = await testConnection(formData);
        if (data.result) {
          showAlert(this.$t('dialog.datasource.testSuccess'));
          return {success: true, data: data};
        } else {
          showAlert(`${this.$t('dialog.datasource.testFail')}${data.error || ''}`);
          return {success: false, error: data.error};
        }
      } catch (error) {
        console.error('Error testing connection:', error);
        showAlert(`${this.$t('dialog.datasource.failTip')}${error.message || ''}`);
        return {success: false, error: error.message};
      }
    },

    async save() {
      if (!this.validateForm()) {
        return;
      }
      if (!this.checkDuplicateName()) {
        return;
      }

      const formData = this.buildFormData();
      try {
        const data = await testConnection(formData);
        if (data.result) {
          this.$emit('save', {
            name: this.dsName,
            username: this.username,
            password: this.password,
            driver: this.driver,
            url: this.url,
            oldName: this.oldName,
            type: 'jdbc'
          });
          setDirty();
          this.closeDialog();
        } else {
          showAlert(`${this.$t('dialog.datasource.testFail')}${data.error || ''}`);
        }
      } catch (error) {
        console.error('Error testing connection:', error);
        showAlert(`${this.$t('dialog.datasource.failTip')}${error.message || ''}`);
      }
    }
  }
}
</script>

<style scoped>
/* 样式可以根据需要自定义 */
</style>
