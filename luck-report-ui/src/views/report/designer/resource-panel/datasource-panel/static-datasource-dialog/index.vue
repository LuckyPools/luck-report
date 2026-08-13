<template>
  <UDialog
      :title="$t('dialog.staticDatasource.title')"
      width="500px"
      :visible="visible"
      @close="closeDialog"
  >
    <div>
      <u-form
          ref="form"
          :model="formData"
          :rules="rules"
          class="static-ds-form"
      >
        <u-form-item :label="$t('dialog.staticDatasource.name')" prop="dsName" :label-width="120">
          <u-input
              v-model="formData.dsName"
              :placeholder="$t('dialog.staticDatasource.namePlaceholder')"
              maxlength="50"
              show-word-limit
          />
        </u-form-item>
      </u-form>
    </div>

    <div slot="footer" class="dialog-footer">
      <u-button type="info" @click="closeDialog">{{ $t('dialog.common.cancel') }}</u-button>
      <u-button type="primary" :loading="saving" @click="handleOk">
        {{ $t('dialog.common.ok') }}
      </u-button>
    </div>
  </UDialog>
</template>

<script>
import { setDirty } from '@/utils/table';
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
    const validateDsName = (rule, value, callback) => {
      if (!value || !value.trim()) {
        callback(new Error(this.$t('dialog.staticDatasource.nameTip')));
      } else if (this.checkDuplicateName(value.trim())) {
        callback();
      } else {
        callback(
            new Error(
                `${this.$t('dialog.datasource.datasource')}[${value}]${this.$t('dialog.datasource.existTip')}`
            )
        );
      }
    };

    return {
      formData: {
        dsName: ''
      },
      oldName: null,
      saving: false,
      rules: {
        dsName: [
          { required: true, validator: validateDsName, trigger: 'blur' }
        ]
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
      this.saving = false;
    },

    initData() {
      this.oldName = this.datasource?.name ?? null;
      this.formData = {
        dsName: this.datasource?.name ?? ''
      };
    },

    closeDialog() {
      this.$emit('close');
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

    checkDuplicateName(name) {
      if (!this.oldName || name !== this.oldName) {
        return !this.datasources.some((source) => source.name === name);
      }
      return true;
    },

    async save() {
      if (this.saving) return;

      const valid = await this.validateForm();
      if (!valid) return;

      this.saving = true;
      try {
        this.$emit('save', {
          name: this.formData.dsName.trim(),
          type: 'staticDs',
          oldName: this.oldName
        });
        setDirty();
        this.closeDialog();
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>

<style scoped>
.static-ds-form {
  padding: 8px 0;
}

.dialog-footer {
  text-align: right;
}

.dialog-footer .u-button + .u-button {
  margin-left: 10px;
}
</style>
