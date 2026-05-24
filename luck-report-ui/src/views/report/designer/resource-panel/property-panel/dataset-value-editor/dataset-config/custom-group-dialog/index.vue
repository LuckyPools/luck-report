<template>
  <UDialog
    :title="$t('dialog.customGroup.title')"
    width="800px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="custom-group-dialog">
      <div class="form-group">
        <!-- 分组项管理 -->
        <div class="group-items-section">
          <div class="button-group">
            <u-button
                type="info"
                icon="icon-plus-circle"
                :title="$t('dialog.customGroup.addGroup')"
                @click="addItem"
            >
            </u-button>
            <u-button
                type="info"
                icon="icon-delete"
                :title="$t('dialog.customGroup.deleteGroup')"
                @click="deleteItem"
            >
            </u-button>
            <u-button
                type="info"
                icon="icon-edit"
                :title="$t('dialog.customGroup.editGroup')"
                @click="editItem"
            >
            </u-button>
          </div>

          <div style="margin-top: 5px" >
            <select
                v-model="selectedItemIndex"
                size="15"
                class="form-control group-select"
                @change="onSelectedItemChange"
            >
              <option v-for="(item, index) in localGroupItems" :key="index" :value="index">
                {{ item.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- 条件管理 -->
        <div class="conditions-section" v-show="selectedItemIndex !== null && selectedItemIndex !== -1">
          <div class="condition-header">
            <label>{{ $t('dialog.customGroup.groupCondition') }}：</label>
            <div class="button-group">
              <u-button
                  type="info"
                  icon="icon-plus-circle"
                  :title="$t('dialog.customGroup.addCondition')"
                  @click="addCondition"
              >
              </u-button>
              <u-button
                  type="info"
                  icon="icon-delete"
                  :title="$t('dialog.customGroup.delTitle')"
                  @click="deleteCondition"
              >
              </u-button>
              <u-button
                  type="info"
                  icon="icon-edit"
                  :title="$t('dialog.customGroup.editTip')"
                  @click="editCondition"
              >
              </u-button>
            </div>
          </div>
          <select
            v-model="selectedConditionIndex"
            size="13"
            class="form-control condition-select"
          >
            <option v-for="(condition, index) in currentConditions" :key="index" :value="index">
              {{ formatConditionText(condition, index) }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- GroupItemDialog 组件 -->
    <GroupItemDialog
      :visible.sync="groupItemDialogVisible"
      :group-item="groupItem"
      :operation="operation"
      @saveAfter="handleGroupItemSave"
    />

    <!-- ConditionDialog 组件 -->
    <ConditionDialog
      :visible.sync="conditionDialogVisible"
      :fields="fields"
      :condition="editingCondition"
      :conditions="currentConditions"
      @saveAfter="handleConditionSave"
    />

    <!-- 底部按钮 -->
    <div slot="footer" style="text-align: right">
      <u-button @click="handleClose" type="info" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
      <u-button @click="handleOk">{{ $t('dialog.common.ok') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import {showAlert, showConfirm} from '@/utils/comnon.js';
import {deepCopy} from '@/components/utils/index.js';
import GroupItemDialogVue
  from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/dataset-config/custom-group-item-dialog/index.vue';
import ConditionDialogVue
  from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/dataset-config/condition-dialog/index.vue';
import UDialog from '@/components/dialog/index.vue';
import UButton from "@/components/button/index.vue";

export default {
  name: 'CustomGroupDialog',
  components: {
    UButton,
    UDialog,
    GroupItemDialog: GroupItemDialogVue,
    ConditionDialog: ConditionDialogVue
  },
  props: {
    groupItems: {
      type: Array,
      default: () => []
    },
    visible: {
      type: Boolean,
      default: false
    },
    fields: {
      type: Array,
      default: null
    }
  },
  data() {
    return {
      localGroupItems: [],
      selectedItemIndex: null,
      selectedConditionIndex: null,
      conditionDialogVisible: false,
      editingCondition: null,
      groupItemDialogVisible: false,
      groupItem: null,
      operation: 'add'
    };
  },
  computed: {
    currentConditions() {
      if (this.selectedItemIndex === null || this.selectedItemIndex === -1) {
        return [];
      }
      return this.localGroupItems[this.selectedItemIndex]?.conditions || [];
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.initData();
      }
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
    /**
     * 初始化本地数据
     */
    initData() {
      const source = Array.isArray(this.groupItems) ? this.groupItems : [];
      this.localGroupItems = deepCopy(source);
      if (this.localGroupItems.length > 0) {
        this.selectedItemIndex = 0;
      }
      this.selectedConditionIndex = null;
    },

    /**
     * 确认保存操作
     */
    handleOk() {
      if (!Array.isArray(this.localGroupItems)) {
        this.localGroupItems = [];
      }
      this.$emit('save', this.localGroupItems);
      this.handleClose();
    },

    handleClose() {
      this.$emit('update:visible', false);
      this.$emit('close');
    },

    // 分组项管理方法
    addItem() {
      this.groupItem = {name: '', conditions: []};
      this.operation = 'add';
      this.groupItemDialogVisible = true;
    },

    deleteItem() {
      if (this.selectedItemIndex === null || this.selectedItemIndex === -1) {
        showAlert(this.$t('dialog.customGroup.deleteTip'));
        return;
      }

      const item = this.localGroupItems[this.selectedItemIndex];
      showConfirm(`${this.$t('dialog.customGroup.deleteConfirm')}[${item.name}]?`).then(() => {
        this.localGroupItems.splice(this.selectedItemIndex, 1);
        this.selectedItemIndex = null;
        this.selectedConditionIndex = null;
      });
    },

    editItem() {
      if (this.selectedItemIndex === null || this.selectedItemIndex === -1) {
        showAlert(this.$t('dialog.customGroup.modTip'));
        return;
      }

      const item = this.localGroupItems[this.selectedItemIndex];
      this.groupItem = { ...item };
      this.operation = 'edit';
      this.groupItemDialogVisible = true;
    },

    onSelectedItemChange() {
      this.selectedConditionIndex = null;
    },

    // 条件管理方法
    addCondition() {
      if (this.selectedItemIndex === null || this.selectedItemIndex === -1) {
        showAlert(this.$t('dialog.customGroup.selectTip'));
        return;
      }

      const currentItem = this.localGroupItems[this.selectedItemIndex];
      this.editingCondition = null;
      this.conditionDialogVisible = true;
    },

    editCondition() {
      if (this.selectedConditionIndex === null || this.selectedConditionIndex === -1) {
        showAlert(this.$t('dialog.customGroup.editConditionTip'));
        return;
      }

      if (this.selectedItemIndex === null || this.selectedItemIndex === -1) {
        showAlert(this.$t('dialog.customGroup.selectTip'));
        return;
      }

      const currentItem = this.localGroupItems[this.selectedItemIndex];
      const conditions = currentItem.conditions || [];
      this.editingCondition = conditions[this.selectedConditionIndex];
      this.conditionDialogVisible = true;
    },

    /**
     * 处理分组项保存事件
     */
    handleGroupItemSave(data) {
      if (!Array.isArray(this.localGroupItems)) {
        this.localGroupItems = [];
      }

      if (data.operation === 'add') {
        this.localGroupItems.push(data.groupItem);
      } else if (data.operation === 'edit' && this.selectedItemIndex >= 0) {
        this.$set(this.localGroupItems, this.selectedItemIndex, data.groupItem);
      }
    },

    /**
     * 处理条件保存事件
     * @param {Object} conditionData - 条件数据
     */
    handleConditionSave(conditionData) {
      if (this.selectedItemIndex === null || this.selectedItemIndex === -1) {
        return;
      }

      const currentItem = this.localGroupItems[this.selectedItemIndex];
      const conditions = currentItem.conditions || [];
      const newCondition = this.buildCondition(conditionData);

      if (conditionData.isEdit && this.selectedConditionIndex >= 0) {
        Object.assign(conditions[this.selectedConditionIndex], newCondition);
      } else {
        conditions.push(newCondition);
      }
    },

    /**
     * 重置所有选择状态
     */
    resetSelection() {
      this.selectedItemIndex = null;
      this.selectedConditionIndex = null;
    },

    /**
     * 构建条件对象
     * @param {Object} data - 原始条件数据
     * @returns {Object} 格式化后的条件对象
     */
    buildCondition(data) {
      return {
        left: data.left,
        operation: data.operation,
        op: data.operation,
        right: data.right,
        join: data.join
      };
    },

    deleteCondition() {
      if (this.selectedConditionIndex === null || this.selectedConditionIndex === -1) {
        showAlert(this.$t('dialog.customGroup.delConditionTip'));
        return;
      }

      if (this.selectedItemIndex === null || this.selectedItemIndex === -1) {
        showAlert(this.$t('dialog.customGroup.selectTip'));
        return;
      }

      const currentItem = this.localGroupItems[this.selectedItemIndex];
      const conditions = currentItem.conditions || [];

      conditions.splice(this.selectedConditionIndex, 1);
      this.selectedConditionIndex = null;
    },

    formatConditionText(condition, index) {
      const op = condition.operation || condition.op;
      let text = `${condition.left} ${op} ${condition.right}`;

      if (index > 0 && condition.join) {
        text = `${condition.join} ${text}`;
      }

      return text;
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
.custom-group-dialog {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.form-group {
  display: flex;
  height: 100%;
}

.group-items-section {
  width: 200px;
  margin-right: 20px;
}

.conditions-section {
  flex: 1;
}

.group-select{
  width: 200px;
  height: 280px;
  display: inline-block;
  outline: none
}

.condition-select{
  height: 280px;
  outline: none;
  margin-top: 5px;
}

.condition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.condition-header label {
  margin-right: 10px;
}

.u-button + .u-button{
  margin-left: 5px;
}
</style>
