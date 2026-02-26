<template>
  <div class="form-group" style="padding-top: 10px">
    <!-- 当没有选择数据集时显示提示 -->
    <div v-if="!selectedDataset" class="alert alert-info" style="margin-bottom: 10px;">
      {{ $t('property.dataset.bindDatasetTip') }}
    </div>

    <!-- 条件列表和操作按钮 -->
    <div v-show="selectedDataset" class="form-group" style="margin-bottom: 10px;">
      <div class="top-button">
        <u-button
            type="info"
            icon="icon-plus-circle"
            :title="$t('property.dataset.addFilterCondition')"
            @click="handleAddCondition"
        >
        </u-button>
        <u-button
            type="info"
            icon="icon-edit"
            :title="$t('property.dataset.editFilterCondition')"
            @click="handleEditCondition"
        >
        </u-button>
        <u-button
            type="info"
            icon="icon-delete"
            :title="$t('property.dataset.delFilterCondition')"
            @click="handleDeleteCondition"
        >
        </u-button>
      </div>

      <div style="margin-top: 10px;">
        <select
            class="form-control condition-select"
            size="5"
            v-model="selectedConditionIndex"
        >
          <option
              v-for="(condition, index) in conditions"
              :key="condition.id"
              :value="index"
          >
            {{ formatConditionText(condition) }}
          </option>
        </select>
      </div>
    </div>

    <!-- 条件对话框组件 -->
    <ConditionDialog ref="conditionDialog" @saveAfter="handleConditionSave" />
  </div>
</template>

<script>
import { showAlert } from '@/utils/comnon.js';
import { setDirty } from '@/utils/table.js';
import uuid from 'node-uuid';
import ConditionDialog from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/dataset-config/condition-dialog/index.vue';
import UButton from "@/components/button/index.vue";

export default {
  name: 'FilterConditionTab',
  components: {
    UButton,
    ConditionDialog
  },
  props: {
    selectedDataset: {
      type: String,
      default: ''
    },
    conditions: {
      type: Array,
      default: () => []
    },
    currentFields: {
      type: Array,
      default: () => []
    },
    cellDef: {
      type: Object,
      default: () => ({})
    },
  },
  data() {
    return {
      selectedConditionIndex: -1,
      currentConditionIndex: -1 // 用于跟踪当前操作的条件索引
    };
  },
  methods: {
    /**
     * 处理添加过滤条件
     */
    handleAddCondition() {
      if (!this.selectedDataset) {
        showAlert(this.$t('property.dataset.bindDatasetTip'));
        return;
      }

      this.currentConditionIndex = -1;
      this.$refs.conditionDialog.show(this.currentFields);
    },

    handleEditCondition() {
      if (this.selectedConditionIndex < 0) {
        showAlert(this.$t('property.dataset.selectFilterConditionTip'));
        return;
      }

      this.currentConditionIndex = this.selectedConditionIndex; // 保存当前编辑的条件索引
      const condition = this.conditions[this.selectedConditionIndex];
      this.$refs.conditionDialog.show(this.currentFields, condition);
    },

    /**
     * 处理条件保存事件
     */
    handleConditionSave(conditionData) {
      const conditions = [...this.conditions];

      if (conditionData.isEdit && this.currentConditionIndex >= 0) {
        // 编辑现有条件
        const targetCondition = conditions[this.currentConditionIndex];
        if (targetCondition) {
          targetCondition.left = conditionData.left;
          targetCondition.operation = conditionData.operation;
          targetCondition.right = conditionData.right;
          targetCondition.join = conditionData.join;
        }
      } else {
        // 添加新条件
        const condition = {
          left: conditionData.left,
          operation: conditionData.operation,
          right: conditionData.right,
          join: conditionData.join,
          id: uuid.v1()
        };
        conditions.push(condition);
      }

      this.$emit('update:conditions', conditions);
      this.$emit('update-cell-def-conditions', conditions);
      setDirty();
    },

    /**
     * 处理删除过滤条件
     */
    handleDeleteCondition() {
      if (this.selectedConditionIndex < 0) {
        showAlert(this.$t('property.dataset.delFilterConditionTip'));
        return;
      }

      const condition = this.conditions[this.selectedConditionIndex];
      showConfirm(this.$t('property.dataset.delConfirm')).then(() => {
        const conditions = [...this.conditions];
        const index = conditions.findIndex(c => c.id === condition.id);

        if (index !== -1) {
          conditions.splice(index, 1);
          this.$emit('update:conditions', conditions);
          this.$emit('update-cell-def-conditions', conditions);
          this.selectedConditionIndex = -1;
          setDirty();
        }
      });
    },

    /**
     * 格式化条件文本
     */
    formatConditionText(condition) {
      let text = `${condition.left} ${condition.operation} ${condition.right}`;
      if (condition.join) {
        text = `${condition.join} ${text}`;
      }
      return text;
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
  height: 100px;
  outline: none;
}
</style>
