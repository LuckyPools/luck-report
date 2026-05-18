<template>
  <UDialog
      :title="$t('dialog.editPropCondition.title')"
      width="550px"
      :visible="visible"
      :z-index="20002"
      @close="handleClose"
  >
    <div class="dialog-content">
      <u-form ref="form" :model="formData" :rules="rules" :label-width="120">
        <!-- 关系选择 -->
        <u-form-item v-if="showJoin" :label="$t('dialog.editPropCondition.relation')">
          <u-select
              v-model="formData.join"
              style="width:300px"
          >
            <u-option
                v-for="option in joinOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </u-form-item>

        <!-- 左值类型选择 -->
        <u-form-item :label="$t('dialog.editPropCondition.leftValue')">
          <u-select
              v-model="formData.leftType"
              style="width:300px"
          >
            <u-option
                v-for="option in leftTypeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </u-form-item>

        <!-- 属性名选择 -->
        <u-form-item v-if="formData.leftType === 'property'" :label="$t('dialog.editPropCondition.propName')" prop="property">
          <u-select
              v-model="formData.property"
              :clearable="true"
              style="width:300px"
          >
            <u-option
                v-for="option in fieldOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </u-form-item>

        <!-- 表达式输入 -->
        <u-form-item v-if="formData.leftType === 'expression'" :label="$t('dialog.editPropCondition.expr')" prop="expression">
          <u-input
            v-model="formData.expression"
            style="width: 300px;"
           />
        </u-form-item>

        <!-- 运算符选择 -->
        <u-form-item :label="$t('dialog.editPropCondition.operator')" prop="operator">
          <u-select
              v-model="formData.operator"
              :clearable="true"
              style="width:300px"
          >
            <u-option
                v-for="option in operatorOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </u-form-item>

        <!-- 值表达式输入 -->
        <u-form-item :label="$t('dialog.editPropCondition.valueExpr')" prop="value">
          <u-input
            v-model="formData.value"
            style="width: 300px;"
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
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import { conditionScriptValidation } from '@/api/designer';
import UButton from "@/components/button/index.vue";
import UInput from '@/components/input/index.vue';
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';

export default {
  name: 'EditPropertyConditionDialog',
  components: {
    UButton,
    UDialog,
    USelect,
    UOption,
    UInput,
    UForm,
    UFormItem
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    dialogFields: {
      type: Array,
      default: () => []
    },
    dialogCondition: {
      type: Object,
      default: null
    },
    dialogConditions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    const validateProperty = (rule, value, callback) => {
      if (this.formData.leftType === 'property' && !value) {
        callback(new Error(this.$t('dialog.editPropCondition.selectProp')));
      } else {
        callback();
      }
    };

    const validateExpression = (rule, value, callback) => {
      if (this.formData.leftType !== 'expression') {
        callback();
        return;
      }
      if (!value) {
        callback(new Error(this.$t('dialog.editPropCondition.leftValueExpr')));
        return;
      }
      conditionScriptValidation(value).then(errors => {
        if (errors && errors.length > 0) {
          callback(new Error(`${value} ${this.$t('dialog.editPropCondition.syntaxError')}`));
        } else {
          callback();
        }
      }).catch(error => {
        console.error('验证表达式失败:', error);
        callback(new Error(this.$t('dialog.editPropCondition.syntaxError')));
      });
    };

    const validateValue = (rule, value, callback) => {
      if (!value) {
        callback(new Error(this.$t('dialog.editPropCondition.inputExpr')));
        return;
      }
      conditionScriptValidation(value).then(errors => {
        if (errors && errors.length > 0) {
          callback(new Error(`${value} ${this.$t('dialog.editPropCondition.syntaxError')}`));
        } else {
          callback();
        }
      }).catch(error => {
        console.error('验证值表达式失败:', error);
        callback(new Error(this.$t('dialog.editPropCondition.syntaxError')));
      });
    };

    return {
      showJoin: false,
      formData: {
        join: 'and',
        leftType: 'current',
        property: '',
        expression: '',
        operator: '',
        value: ''
      },
      rules: {
        property: [{
          required: true,
          validator: validateProperty,
          trigger: 'blur'
        }],
        expression: [{
          required: true,
          validator: validateExpression,
          trigger: 'blur'
        }],
        operator: [{
          required: true,
          message: this.$t('dialog.editPropCondition.selectOperator'),
          trigger: 'blur'
        }],
        value: [{
          required: true,
          validator: validateValue,
          trigger: 'blur'
        }]
      }
    };
  },
  computed: {
    joinOptions() {
      return [
        { value: 'and', label: this.$t('dialog.editPropCondition.and') },
        { value: 'or', label: this.$t('dialog.editPropCondition.or') }
      ];
    },
    leftTypeOptions() {
      return [
        { value: 'current', label: this.$t('dialog.editPropCondition.currentValue') },
        { value: 'property', label: this.$t('dialog.editPropCondition.property') },
        { value: 'expression', label: this.$t('dialog.editPropCondition.expression') }
      ];
    },
    fieldOptions() {
      return this.dialogFields.map(field => ({
        value: field.name,
        label: field.name
      }));
    },
    operatorOptions() {
      return [
        { value: '>', label: this.$t('dialog.editPropCondition.greater') },
        { value: '>=', label: this.$t('dialog.editPropCondition.greaterEquals') },
        { value: '<', label: this.$t('dialog.editPropCondition.less') },
        { value: '<=', label: this.$t('dialog.editPropCondition.lessEquals') },
        { value: '==', label: this.$t('dialog.editPropCondition.equals') },
        { value: '!=', label: this.$t('dialog.editPropCondition.notEquals') },
        { value: 'in', label: this.$t('dialog.editPropCondition.in') },
        { value: 'like', label: this.$t('dialog.editPropCondition.like') }
      ];
    }
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown);
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.initFormData();
      }
    }
  },
  methods: {

    initFormData() {
      if (this.dialogCondition) {
        this.showJoin = !!this.dialogCondition.join;
      } else {
        this.showJoin = this.dialogConditions.length > 0;
      }

      if (this.dialogCondition) {
        this.formData.leftType = this.dialogCondition.type || 'current';
        if (this.formData.leftType === 'expression') {
          this.formData.expression = this.dialogCondition.left || '';
        } else if (this.dialogCondition.left) {
          this.formData.property = this.dialogCondition.left;
        }
        if(this.formData.leftType === 'property' && (!this.formData.property || this.formData.property === '')){
          this.formData.leftType = 'current'
        }
        this.formData.operator = this.dialogCondition.operation || this.dialogCondition.op || '';
        this.formData.value = this.dialogCondition.right || '';
        this.formData.join = this.dialogCondition.join || 'and';
      } else {
        this.formData.leftType = 'current';
        this.formData.property = '';
        this.formData.expression = '';
        this.formData.operator = '';
        this.formData.value = '';
        this.formData.join = 'and';
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

      let property = this.formData.property;
      if (this.formData.leftType === 'expression') {
        property = this.formData.expression;
      } else if (this.formData.leftType === 'current') {
        property = null;
      }

      let type = this.formData.leftType;
      if (type === 'current') {
        type = 'property';
      }

      if (this.dialogCondition) {
        if (this.dialogCondition.join) {
          this.$emit('saveAfter', type, property, this.formData.operator, this.formData.value, this.formData.join);
        } else {
          this.$emit('saveAfter', type, property, this.formData.operator, this.formData.value);
        }
      } else if (this.dialogConditions.length > 0) {
        this.$emit('saveAfter', type, property, this.formData.operator, this.formData.value, this.formData.join);
      } else {
        this.$emit('saveAfter', type, property, this.formData.operator, this.formData.value);
      }

      this.handleClose();
    },

    handleClose() {
      this.$refs.form && this.$refs.form.resetFields();
      this.showJoin = false;
      this.$emit('close');
    },

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
