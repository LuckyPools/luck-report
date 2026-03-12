<template>
  <UDialog
      :title="$t('dialog.editPropCondition.title')"
      width="550px"
      :visible="visible"
      :z-index="20002"
      @close="handleClose"
  >
    <div class="dialog-content">
      <!-- 关系选择 -->
      <div v-if="showJoin" class="form-group">
        <label>{{ $t('dialog.editPropCondition.relation') }}：</label>
        <div class="u-inline">
          <u-select
              v-model="join"
              :clearable="true"
              style="width:300px"
          >
            <u-option
                v-for="option in joinOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
      </div>

      <!-- 左值类型选择 -->
      <div class="form-group">
        <label>{{ $t('dialog.editPropCondition.leftValue') }}：</label>
        <div class="u-inline">
          <u-select
              v-model="leftType"
              :clearable="true"
              style="width:300px"
          >
            <u-option
                v-for="option in leftTypeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
      </div>

      <!-- 属性名选择 -->
      <div v-if="leftType === 'property'" class="form-group">
        <label>{{ $t('dialog.editPropCondition.propName') }}：</label>
        <div class="u-inline">
          <u-select
              v-model="property"
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
        </div>
      </div>

      <!-- 表达式输入 -->
      <div v-if="leftType === 'expression'" class="form-group">
        <label>{{ $t('dialog.editPropCondition.expr') }}：</label>
        <div class="u-inline">
          <u-input
            v-model="expression"
            style="width: 300px;"
            @blur="validateExpression"
           />
        </div>
      </div>

      <!-- 运算符选择 -->
      <div class="form-group">
        <label>{{ $t('dialog.editPropCondition.operator') }}：</label>
        <div class="u-inline">
          <u-select
              v-model="operator"
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
        </div>
      </div>

      <!-- 值表达式输入 -->
      <div class="form-group">
        <label>{{ $t('dialog.editPropCondition.valueExpr') }}：</label>
        <div class="u-inline">
          <u-input
            v-model="value"
            style="width: 300px;"
            @blur="validateValueExpression"
          />
        </div>
      </div>
    </div>
    <div slot="footer" style="text-align: right">
      <u-button @click="handleClose" type="info" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
      <u-button @click="handleOk">{{ $t('dialog.common.ok') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import { showAlert } from '@/utils/comnon.js';
import UDialog from '@/components/dialog/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import { conditionScriptValidation } from '@/api/designer';
import UButton from "@/components/button/index.vue";
import UInput from '@/components/input/index.vue';

export default {
  name: 'EditPropertyConditionDialog',
  components: {
    UButton,
    UDialog,
    USelect,
    UOption,
    UInput
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
    return {
      join: 'and',
      leftType: 'current',
      property: '',
      expression: '',
      operator: '',
      value: '',
      showJoin: false
    };
  },
  computed: {
    // 关系选项
    joinOptions() {
      return [
        { value: 'and', label: this.$t('dialog.editPropCondition.and') },
        { value: 'or', label: this.$t('dialog.editPropCondition.or') }
      ];
    },
    // 左值类型选项
    leftTypeOptions() {
      return [
        { value: 'current', label: this.$t('dialog.editPropCondition.currentValue') },
        { value: 'property', label: this.$t('dialog.editPropCondition.property') },
        { value: 'expression', label: this.$t('dialog.editPropCondition.expression') }
      ];
    },
    // 字段选项
    fieldOptions() {
      return this.dialogFields.map(field => ({
        value: field.name,
        label: field.name
      }));
    },
    // 运算符选项
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
    // 添加键盘事件监听
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeDestroy() {
    // 移除事件监听
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
      // 根据条件决定是否显示关系选择
      if (this.dialogCondition) {
        this.showJoin = !!this.dialogCondition.join;
      } else {
        this.showJoin = this.dialogConditions.length > 0;
      }

      // 初始化表单数据
      if (this.dialogCondition) {
        this.leftType = this.dialogCondition.type || 'current';
        if (this.leftType === 'expression') {
          this.expression = this.dialogCondition.left || '';
        } else if (this.dialogCondition.left) {
          this.property = this.dialogCondition.left;
        }
        if(this.leftType === 'property' && (!this.property || this.property === '')){
          this.leftType = 'current'
        }
        this.operator = this.dialogCondition.operation || this.dialogCondition.op || '';
        this.value = this.dialogCondition.right || '';
        this.join = this.dialogCondition.join || 'and';
      } else {
        this.leftType = 'current';
        this.property = '';
        this.expression = '';
        this.operator = '';
        this.value = '';
        this.join = 'and';
      }
    },

    handleOk() {
      if (this.leftType === 'property' && !this.property) {
        showAlert(this.$t('dialog.editPropCondition.selectProp'));
        return;
      }

      if (this.leftType === 'expression' && !this.expression) {
        showAlert(this.$t('dialog.editPropCondition.leftValueExpr'));
        return;
      }

      if (!this.operator) {
        showAlert(this.$t('dialog.editPropCondition.selectOperator'));
        return;
      }

      if (!this.value) {
        showAlert(this.$t('dialog.editPropCondition.inputExpr'));
        return;
      }

      // 准备参数
      let property = this.property;
      if (this.leftType === 'expression') {
        property = this.expression;
      } else if (this.leftType === 'current') {
        property = null;
      }

      let type = this.leftType;
      if (type === 'current') {
        type = 'property';
      }

      // 触发保存后事件
      if (this.dialogCondition) {
        if (this.dialogCondition.join) {
          this.$emit('saveAfter', type, property, this.operator, this.value, this.join);
        } else {
          this.$emit('saveAfter', type, property, this.operator, this.value);
        }
      } else if (this.dialogConditions.length > 0) {
        this.$emit('saveAfter', type, property, this.operator, this.value, this.join);
      } else {
        this.$emit('saveAfter', type, property, this.operator, this.value);
      }

      this.handleClose();
    },

    handleClose() {
      this.$emit('close');
      setTimeout(() => {
        this.join = 'and';
        this.leftType = 'current';
        this.property = '';
        this.expression = '';
        this.operator = '';
        this.value = '';
        this.showJoin = false;
      }, 300);
    },

    // 验证表达式
    async validateExpression() {
      if (!this.expression) return;
      try {
        const errors = await conditionScriptValidation(this.expression);
        if (errors && errors.length > 0) {
          showAlert(`${this.expression} ${this.$t('dialog.editPropCondition.syntaxError')}`);
        }
      } catch (error) {
        console.error('验证表达式失败:', error);
      }
    },

    async validateValueExpression() {
      if (!this.value) return;
      try {
        const errors = await conditionScriptValidation(this.value);
        if (errors && errors.length > 0) {
          showAlert(`${this.value} ${this.$t('dialog.editPropCondition.syntaxError')}`);
        }
      } catch (error) {
        console.error('验证值表达式失败:', error);
        // 错误处理
      }
    },

    // 键盘事件处理
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
