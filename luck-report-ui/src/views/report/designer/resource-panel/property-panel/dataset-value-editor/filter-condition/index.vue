<template>
  <div class="form-group" style="padding-top: 10px">
    <!-- 当没有选择数据集时显示提示 -->
    <div v-if="!selectedDataset" class="empty-tip-container">
      <i class="iconfont icon-warning empty-tip-icon"></i>
      <div class="empty-tip-content">
        <div class="empty-tip-title">{{ $t('property.dataset.noDatasetSelected') }}</div>
        <div class="empty-tip-desc">{{ $t('property.dataset.bindDatasetTip') }}</div>
      </div>
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
    <ConditionDialog
      :visible.sync="conditionDialogVisible"
      :fields="conditionDialogFields"
      :condition="conditionDialogCondition"
      @saveAfter="handleConditionSave"
    />
  </div>
</template>

<script>
import { showAlert, showConfirm } from '@/utils/comnon.js';
import { setDirty } from '@/utils/table.js';
import { v1 as uuidv1 } from 'uuid';
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
    }
  },
  data() {
    return {
      selectedConditionIndex: -1,
      currentConditionIndex: -1,
      conditionDialogVisible: false,
      conditionDialogFields: [],
      conditionDialogCondition: null
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
      this.conditionDialogFields = this.currentFields;
      this.conditionDialogCondition = null;
      this.conditionDialogVisible = true;
    },

    handleEditCondition() {
      if (this.selectedConditionIndex < 0) {
        showAlert(this.$t('property.dataset.selectFilterConditionTip'));
        return;
      }

      this.currentConditionIndex = this.selectedConditionIndex;
      const condition = this.conditions[this.selectedConditionIndex];
      this.conditionDialogFields = this.currentFields;
      this.conditionDialogCondition = condition;
      this.conditionDialogVisible = true;
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
          id: uuidv1()
        };
        conditions.push(condition);
      }

      this.$emit('update:conditions', conditions);
      this.$emit('update-filter-conditions', conditions);
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
          this.$emit('update-filter-conditions', conditions);
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

.empty-tip-container {
  display: flex;
  align-items: flex-start;
  padding: 20px;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.empty-tip-container:hover {
  border-color: #217346;
  box-shadow: 0 2px 12px rgba(33, 115, 70, 0.15);
}

.empty-tip-icon {
  flex-shrink: 0;
  font-size: 32px;
  color: #217346;
  margin-right: 16px;
}

.empty-tip-content {
  flex: 1;
  min-width: 0;
}

.empty-tip-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
  line-height: 1.4;
}

.empty-tip-desc {
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}
</style>
