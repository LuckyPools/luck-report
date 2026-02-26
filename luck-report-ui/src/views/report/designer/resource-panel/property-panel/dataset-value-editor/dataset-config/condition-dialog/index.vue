<template>
  <UDialog
    :title="$t('dialog.condition.config')"
    width="500px"
    :visible="visible"
    :z-index="20000"
    @close="handleClose"
  >
    <div class="dialog-content" >
      <div class="form-group" v-show="showJoinGroup">
        <label>{{ $t('dialog.condition.relationship') }}：</label>
        <u-select
          :value="joinValue"
          :clearable="true"
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

      <div class="form-group">
        <label>{{ $t('dialog.condition.propertyName') }}：</label>
        <u-select
          :value="propertyValue"
          :clearable="true"
          @change="handlePropertyChange"
        >
          <u-option
            v-for="option in propertyOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </div>

      <div class="form-group">
        <label>{{ $t('dialog.condition.op') }}：</label>
        <u-select
          :value="operatorValue"
          :clearable="true"
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

      <div class="form-group">
        <label>{{ $t('dialog.condition.valueExpr') }}：</label>
        <div class="u-inline">
          <u-input
            v-model="valueExpr"
            style="width:240px;"
            @change="validateExpression"
          >
          </u-input>
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
import UButton from '@/components/button/index.vue';
import UInput from '@/components/input/index.vue';
import { conditionScriptValidation } from '@/api/designer';

export default {
  name: 'ConditionDialog',
  components: {
    UDialog,
    USelect,
    UOption,
    UButton,
    UInput
  },
  data() {
    return {
      visible: false,
      showJoinGroup: false,
      fields: [],
      joinValue: 'and',
      propertyValue: '',
      operatorValue: '==',
      valueExpr: '',
      condition: null,
      conditions: []
    };
  },
  computed: {
    // 关系选项
    joinOptions() {
      return [
        { value: 'and', label: this.$t('dialog.condition.and') },
        { value: 'or', label: this.$t('dialog.condition.or') }
      ];
    },
    // 属性选项
    propertyOptions() {
      return this.fields.map(field => ({
        value: field.name,
        label: field.name
      }));
    },
    // 操作符选项
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
    // 处理关系选择变化
    handleJoinChange(value) {
      this.joinValue = value;
    },
    // 处理属性选择变化
    handlePropertyChange(value) {
      this.propertyValue = value;
    },
    // 处理操作符选择变化
    handleOperatorChange(value) {
      this.operatorValue = value;
    },
    show(fields, condition) {
      this.visible = true;
      this.fields = fields || [];
      this.condition = condition;

      // 设置是否显示关系选择组
      if (condition) {
        this.showJoinGroup = !!condition.join;
      } else {
        this.showJoinGroup = this.conditions && this.conditions.length > 0;
      }

      // 设置默认值
      if (condition) {
        this.joinValue = condition.join || 'and';
        this.propertyValue = condition.left || '';
        this.operatorValue = condition.operation || condition.op || '==';
        this.valueExpr = condition.right || '';
      } else {
        this.joinValue = 'and';
        this.propertyValue = fields && fields.length > 0 ? fields[0].name : '';
        this.operatorValue = '==';
        this.valueExpr = '';
      }
    },
    handleOk() {
      if (!this.propertyValue) {
        showAlert(this.$t('dialog.condition.selectProperty'));
        return;
      }

      if (!this.operatorValue) {
        showAlert(this.$t('dialog.condition.selectOp'));
        return;
      }

      if (!this.valueExpr) {
        showAlert(this.$t('dialog.condition.inputExpr'));
        return;
      }

      const conditionData = {
        left: this.propertyValue,
        operation: this.operatorValue,
        right: this.valueExpr,
        join: this.showJoinGroup ? this.joinValue : null,
        isEdit: !!this.condition
      };

      this.$emit('saveAfter', conditionData);
      this.handleClose();
    },
    handleClose() {
      this.visible = false;
      setTimeout(() => {
        this.fields = [];
        this.condition = null;
      }, 300);
    },
    async validateExpression() {
      if (!this.valueExpr) return;
      const val = this.valueExpr;
      try {
        const errors = await conditionScriptValidation(val);
        if (errors && errors.length > 0) {
          await showAlert(`${val} ${this.$t('dialog.condition.exprError')}`);
        }
      } catch (error) {
        console.error('Error validating expression:', error);
      }
    }
  }
};
</script>

<style scoped>
</style>
