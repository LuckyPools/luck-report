<template>
  <UDialog
      :title="$t('dialog.editPropCondition.title')"
      width="550px"
      :visible="visible"
      :z-index="20002"
      @close="handleClose"
  >
    <div class="dialog-content" v-loading="loading">
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
import { LoadingDirective } from '@/components/loading/instance.js';

export default {
  name: 'PropertyConditionItemDialog',
  components: {
    UButton,
    UDialog,
    USelect,
    UOption,
    UInput,
    UForm,
    UFormItem
  },
  directives: {
    loading: LoadingDirective
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
      loading: false,
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
      return this.fields.map(field => ({
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
      if (this.condition) {
        this.showJoin = !!this.condition.join;
      } else {
        this.showJoin = this.conditions.length > 0;
      }

      if (this.condition) {
        this.formData.leftType = this.condition.type || 'current';
        if (this.formData.leftType === 'expression') {
          this.formData.expression = this.condition.left || '';
        } else if (this.condition.left) {
          this.formData.property = this.condition.left;
        }
        if(this.formData.leftType === 'property' && (!this.formData.property || this.formData.property === '')){
          this.formData.leftType = 'current'
        }
        this.formData.operator = this.condition.operation || this.condition.op || '';
        this.formData.value = this.condition.right || '';
        this.formData.join = this.condition.join || 'and';
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
      if (this.loading) {
        return;
      }

      this.loading = true;
      try {
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

        if (this.condition) {
          if (this.condition.join) {
            this.$emit('saveAfter', type, property, this.formData.operator, this.formData.value, this.formData.join);
          } else {
            this.$emit('saveAfter', type, property, this.formData.operator, this.formData.value);
          }
        } else if (this.conditions.length > 0) {
          this.$emit('saveAfter', type, property, this.formData.operator, this.formData.value, this.formData.join);
        } else {
          this.$emit('saveAfter', type, property, this.formData.operator, this.formData.value);
        }

        this.handleClose();
      } finally {
        this.loading = false;
      }
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
