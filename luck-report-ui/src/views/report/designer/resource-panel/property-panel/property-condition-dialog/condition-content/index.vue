<template>
  <div>
    <div class="top-button">
      <u-button
        type="info"
        icon="icon-plus-circle"
        :title="$t('dialog.propCondition.addValue')"
        @click="addCondition"
      >
      </u-button>
      <u-button
        type="info"
        icon="icon-edit"
        :title="$t('dialog.propCondition.editConditionItem')"
        @click="editCondition"
      >
      </u-button>
      <u-button
        type="info"
        icon="icon-delete"
        :title="$t('dialog.propCondition.delCondition')"
        @click="deleteCondition"
      >
      </u-button>
    </div>

    <div style="margin-top: 10px;">
      <select
          ref="conditionList"
          class="form-control condition-select"
          size="100"
          v-model="selectedConditionIndex"
          @change="onConditionSelectChange"
      >
        <option
            v-for="(condition, index) in conditions"
            :key="condition.id"
            :value="index"
        >
          {{ getConditionText(condition) }}
        </option>
      </select>
    </div>

    <condition-content-dialog
      ref="conditionDialog"
      @saveAfter="handleSaveAfter"
    />
  </div>
</template>

<script>
import { showAlert } from '@/utils/comnon.js';
import { setDirty } from '@/utils/table.js';
import { v1 as uuid } from 'uuid';
import ConditionContentDialog from '../condition-content-dialog/index.vue';
import UButton from '@/components/button/index.vue';

export default {
  name: 'ConditionContent',
  components: {
    ConditionContentDialog,
    UButton
  },
  props: {
    propertyConditions: {
      type: Array,
      default: () => []
    },
    selectedItem: {
      type: Object,
      default: null
    },
    datasources: {
      type: Array,
      default: () => []
    },
    datasetName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      conditions: [],
      selectedConditionIndex: -1,
      // 添加一个标志来控制是否需要重置选中索引
      shouldResetSelection: true
    };
  },
  watch: {
    selectedItem: {
      handler(newVal) {
        if (newVal && newVal.conditions) {
          this.conditions = [...newVal.conditions];
        } else {
          this.conditions = [];
        }
        // 只有在shouldResetSelection为true时才重置选中索引
        if (this.shouldResetSelection) {
          this.selectedConditionIndex = -1;
        }
        // 重置标志
        this.shouldResetSelection = true;
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    getSelectedItemOption() {
      // 使用父组件提供的方法获取选中的项目
      if (typeof this.getSelectedItemOptionFn === 'function') {
        return this.getSelectedItemOptionFn()
      }
      return null
    },
    getConditionText(condition) {
      let text = condition.left + ' ' + condition.operation + ' ' + condition.right;
      if (condition.type === 'property' && (!condition.left || condition.left === '')) {
        text = this.$t('dialog.propCondition.currentValue') + ' ' + condition.operation + ' ' + (condition.right || condition.expr);
      }
      if (condition.join && this.conditions.indexOf(condition) > 0) {
        text = condition.join + ' ' + text;
      }
      return text;
    },
    addCondition() {
      if (!this.selectedItem) {
        showAlert(this.$t('dialog.propCondition.selectItem'));
        return;
      }

      const fields = this.buildFields();
      const conditions = this.selectedItem.conditions || [];

      this.$refs.conditionDialog.show(fields, null, conditions);
    },
    editCondition() {
      if (this.selectedConditionIndex < 0 || this.selectedConditionIndex >= this.conditions.length) {
        showAlert(this.$t('dialog.propCondition.editConditionTip'));
        return;
      }

      if (!this.selectedItem) {
        showAlert(this.$t('dialog.propCondition.selectConditionItem'));
        return;
      }

      const fields = this.buildFields();
      const condition = this.conditions[this.selectedConditionIndex];
      const conditions = this.selectedItem.conditions || [];

      this.$refs.conditionDialog.show(fields, condition, conditions);
    },

    handleSaveAfter(type, left, op, right, join) {
      if (!this.selectedItem) {
        return;
      }

      const conditions = this.selectedItem.conditions || [];

      if (this.selectedConditionIndex >= 0 && this.selectedConditionIndex < this.conditions.length) {
        const condition = this.conditions[this.selectedConditionIndex];
        const updatedCondition = {
          ...condition,
          type,
          left,
          operation: op,
          right,
          join
        };

        // 更新条件数组中的条件
        const index = conditions.findIndex(c => c.id === condition.id);
        if (index !== -1) {
          conditions.splice(index, 1, updatedCondition);
        }

        // 更新本地条件数组
        this.conditions.splice(this.selectedConditionIndex, 1, updatedCondition);
      } else {
        // 添加新条件
        const newCondition = {
          type,
          left,
          operation: op,
          right,
          join,
          id: uuid()
        };
        conditions.push(newCondition);
        this.conditions = [...conditions];
        this.selectedConditionIndex = this.conditions.length - 1;
      }

      setDirty();
    },
    deleteCondition() {
      if (this.selectedConditionIndex < 0 || this.selectedConditionIndex >= this.conditions.length) {
        showAlert(this.$t('dialog.propCondition.delConditionTip'));
        return;
      }

      if (!this.selectedItem) {
        showAlert(this.$t('dialog.propCondition.selectDelCondition'));
        return;
      }

      const condition = this.conditions[this.selectedConditionIndex];
      const conditions = this.selectedItem.conditions || [];
      const index = conditions.findIndex(c => c.id === condition.id);

      if (index !== -1) {
        conditions.splice(index, 1);
      }

      this.conditions.splice(this.selectedConditionIndex, 1);
      this.selectedConditionIndex = -1;
      setDirty();
    },
    buildFields() {
      let fields = [];
      if (!this.datasetName || this.datasetName === '') {
        return fields;
      }

      for (let ds of this.datasources) {
        let datasets = ds.datasets || [];
        for (let dataset of datasets) {
          if (dataset.name === this.datasetName) {
            fields = dataset.fields || [];
            break;
          }
        }
        if (fields.length > 0) {
          break;
        }
      }
      return fields;
    },
    clearConditions() {
      this.conditions = [];
      this.selectedConditionIndex = -1;
    },
    updateConditions(conditions, resetSelection = true) {
      // 设置是否需要重置选中索引的标志
      this.shouldResetSelection = resetSelection;

      this.conditions = [...(conditions || [])];
      if (resetSelection) {
        this.selectedConditionIndex = -1;
      }
    },
    onConditionSelectChange() {
      // 处理条件选择变化，确保UI正确更新
      this.$nextTick(() => {
        if (this.selectedConditionIndex >= 0 && this.selectedConditionIndex < this.conditions.length) {
          const selectedCondition = this.conditions[this.selectedConditionIndex];
          this.$emit('condition-selected', selectedCondition);
        }
      });
    }
  }
};
</script>

<style scoped>
.u-button + .u-button{
  margin-left: 5px;
}

.top-button{
  display: flex;
  justify-content: end;
}

.condition-select{
  height: 500px;
  padding: 3px;
  outline: none;
}
</style>
