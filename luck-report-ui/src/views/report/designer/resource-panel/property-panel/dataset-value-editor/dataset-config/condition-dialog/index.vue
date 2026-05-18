<template>
  <UDialog
    :title="$t('dialog.condition.config')"
    width="500px"
    :visible="visible"
    :z-index="20000"
    @close="handleClose"
  >
    <div class="dialog-content" >
      <u-form ref="form" :model="formData" :rules="rules" :label-width="120">
        <u-form-item :label="$t('dialog.condition.relationship')" v-show="showJoinGroup">
          <u-select
            v-model="formData.joinValue"
          >
            <u-option
              v-for="option in joinOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </u-select>
        </u-form-item>

        <u-form-item :label="$t('dialog.condition.propertyName')" prop="propertyValue">
          <u-select
            v-model="formData.propertyValue"
            :clearable="true"
          >
            <u-option
              v-for="option in propertyOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </u-select>
        </u-form-item>

        <u-form-item :label="$t('dialog.condition.op')" prop="operatorValue">
          <u-select
            v-model="formData.operatorValue"
            :clearable="true"
          >
            <u-option
              v-for="option in operatorOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </u-select>
        </u-form-item>

        <u-form-item :label="$t('dialog.condition.valueExpr')" prop="valueExpr">
          <u-input
            v-model="formData.valueExpr"
          >
          </u-input>
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
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UButton from '@/components/button/index.vue';
import UInput from '@/components/input/index.vue';
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import { conditionScriptValidation } from '@/api/designer';

export default {
  name: 'ConditionDialog',
  components: {
    UDialog,
    USelect,
    UOption,
    UButton,
    UInput,
    UForm,
    UFormItem
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    fields: {
      type: Array,
      default: () => []
    },
    condition: {
      type: Object,
      default: null
    },
    conditions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    const validateValueExpr = (rule, value, callback) => {
      if (!value) {
        callback(new Error(this.$t('dialog.condition.inputExpr')));
        return;
      }
      conditionScriptValidation(value).then(errors => {
        if (errors && errors.length > 0) {
          callback(new Error(`${value} ${this.$t('dialog.condition.exprError')}`));
        } else {
          callback();
        }
      }).catch(error => {
        console.error('Error validating expression:', error);
        callback(new Error(this.$t('dialog.condition.exprError')));
      });
    };

    return {
      showJoinGroup: false,
      formData: {
        joinValue: 'and',
        propertyValue: '',
        operatorValue: '==',
        valueExpr: ''
      },
      rules: {
        propertyValue: [{
          required: true,
          message: this.$t('dialog.condition.selectProperty'),
          trigger: 'change'
        }],
        operatorValue: [{
          required: true,
          message: this.$t('dialog.condition.selectOp'),
          trigger: 'change'
        }],
        valueExpr: [{
          required: true,
          validator: validateValueExpr,
          trigger: 'blur'
        }]
      }
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.initDialogData();
      }
    },
    condition: {
      handler() {
        if (this.visible) {
          this.initDialogData();
        }
      },
      deep: true
    },
    fields: {
      handler() {
        if (this.visible) {
          this.initDialogData();
        }
      },
      deep: true
    },
    conditions: {
      handler() {
        if (this.visible) {
          this.initDialogData();
        }
      },
      deep: true
    }
  },
  computed: {
    joinOptions() {
      return [
        { value: 'and', label: this.$t('dialog.condition.and') },
        { value: 'or', label: this.$t('dialog.condition.or') }
      ];
    },
    propertyOptions() {
      return this.fields.map(field => ({
        value: field.name,
        label: field.name
      }));
    },
    operatorOptions() {
      return [
        { value: '>', label: this.$t('dialog.condition.greatThen') },
        { value: '>=', label: this.$t('dialog.condition.greatEquals') },
        { value: '<', label: this.$t('dialog.condition.lessThen') },
        { value: '<=', label: this.$t('dialog.condition.lessEquals') },
        { value: '==', label: this.$t('dialog.condition.equals') },
        { value: '!=', label: this.$t('dialog.condition.notEquals') },
        { value: 'in', label: this.$t('dialog.condition.in') },
        { value: 'like', label: this.$t('dialog.condition.like') }
      ];
    }
  },
  methods: {
    initDialogData() {
      const fields = this.fields || [];
      const condition = this.condition;

      if (condition) {
        this.showJoinGroup = !!condition.join;
      } else {
        this.showJoinGroup = this.conditions && this.conditions.length > 0;
      }

      if (condition) {
        this.formData.joinValue = condition.join || 'and';
        this.formData.propertyValue = condition.left || '';
        this.formData.operatorValue = condition.operation || condition.op || '==';
        this.formData.valueExpr = condition.right || '';
      } else {
        this.formData.joinValue = 'and';
        this.formData.propertyValue = fields && fields.length > 0 ? fields[0].name : '';
        this.formData.operatorValue = '==';
        this.formData.valueExpr = '';
      }
    },

    /**
     * 校验表单
     * @returns {Promise<boolean>} 校验是否通过
     */
    validateForm() {
      return new Promise((resolve) => {
        this.$refs.form.validate((valid) => {
          resolve(valid);
        });
      });
    },

    async handleOk() {
      const valid = await this.validateForm();
      if (!valid) {
        return;
      }

      const conditionData = {
        left: this.formData.propertyValue,
        operation: this.formData.operatorValue,
        right: this.formData.valueExpr,
        join: this.showJoinGroup ? this.formData.joinValue : null,
        isEdit: !!this.condition,
        id: this.condition?.id || null
      };

      this.$emit('saveAfter', conditionData);
      this.handleClose();
    },

    handleClose() {
      this.$refs.form && this.$refs.form.resetFields();
      this.$emit('update:visible', false);
    }
  }
};
</script>

<style scoped>
</style>
