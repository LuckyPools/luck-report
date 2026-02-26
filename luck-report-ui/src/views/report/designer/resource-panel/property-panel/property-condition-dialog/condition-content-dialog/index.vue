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
              :value="join"
              :clearable="true"
              style="width:300px"
              @change="handleJoinChange"
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
              :value="leftType"
              :clearable="true"
              style="width:300px"
              @change="handleLeftTypeChange"
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
              :value="property"
              :clearable="true"
              style="width:300px"
              @change="handlePropertyChange"
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
              :value="operator"
              :clearable="true"
              style="width:300px"
              @change="handleOperatorChange"
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
  data() {
    return {
      visible: false,
      join: 'and',
      leftType: 'current',
      property: '',
      expression: '',
      operator: '',
      value: '',
      showJoin: false,
      fields: [],
      condition: null,
      conditions: []
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
      return this.fields.map(field => ({
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
  methods: {
    // 处理关系选择变化
    handleJoinChange(value) {
      this.join = value;
    },

    // 处理左值类型选择变化
    handleLeftTypeChange(value) {
      this.leftType = value;
    },

    // 处理属性选择变化
    handlePropertyChange(value) {
      this.property = value;
    },

    // 处理运算符选择变化
    handleOperatorChange(value) {
      this.operator = value;
    },

    show(fields, condition, conditions) {
      this.visible = true;
      this.fields = fields || [];
      this.condition = condition;
      this.conditions = conditions || [];

      // 根据条件决定是否显示关系选择
      if (condition) {
        this.showJoin = !!condition.join;
      } else {
        this.showJoin = this.conditions.length > 0;
      }
      // 初始化表单数据
      if (condition) {
        this.leftType = condition.type || 'current';
        if (this.leftType === 'expression') {
          this.expression = condition.left || '';
        } else if (condition.left) {
          this.property = condition.left;
        }
        if(this.leftType === 'property' && (!this.property || this.property === '')){
          this.leftType = 'current'
        }
        this.operator = condition.operation || condition.op || '';
        this.value = condition.right || '';
        this.join = condition.join || 'and';
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
      if (this.condition) {
        if (this.condition.join) {
          this.$emit('saveAfter', type, property, this.operator, this.value, this.join);
        } else {
          this.$emit('saveAfter', type, property, this.operator, this.value);
        }
      } else if (this.conditions.length > 0) {
        this.$emit('saveAfter', type, property, this.operator, this.value, this.join);
      } else {
        this.$emit('saveAfter', type, property, this.operator, this.value);
      }

      this.handleClose();
    },

    handleClose() {
      this.visible = false;
      setTimeout(() => {
        this.join = 'and';
        this.leftType = 'current';
        this.property = '';
        this.expression = '';
        this.operator = '';
        this.value = '';
        this.showJoin = false;
        this.fields = [];
        this.condition = null;
        this.conditions = [];
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
