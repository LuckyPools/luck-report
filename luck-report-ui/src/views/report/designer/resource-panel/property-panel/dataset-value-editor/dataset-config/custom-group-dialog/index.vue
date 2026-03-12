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
      :group-item="groupItemDialogItem"
      :operation="groupItemDialogOperation"
      @saveAfter="handleGroupItemSave"
    />

    <!-- ConditionDialog 组件 -->
    <ConditionDialog
      :visible.sync="conditionDialogVisible"
      :fields="conditionDialogFields"
      :condition="conditionDialogCondition"
      :conditions="conditionDialogConditions"
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
import { showAlert, showConfirm } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import GroupItemDialogVue from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/dataset-config/custom-group-item-dialog/index.vue';
import ConditionDialogVue from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/dataset-config/condition-dialog/index.vue';
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
      currentConditionIndex: null,
      currentItemIndex: null,
      conditionDialogVisible: false,
      conditionDialogFields: [],
      conditionDialogCondition: null,
      conditionDialogConditions: [],
      groupItemDialogVisible: false,
      groupItemDialogItem: null,
      groupItemDialogOperation: 'add'
    };
  },
  computed: {
    currentConditions() {
      if (this.selectedItemIndex === null || this.selectedItemIndex === -1) {
        return [];
      }
      return this.localGroupItems[this.selectedItemIndex].conditions || [];
    }
  },
  watch: {
    groupItems: {
      handler(newVal) {
        this.localGroupItems = deepCopy(newVal);
      },
      immediate: true,
      deep: true
    },
    visible: {
      handler(newVal) {
        if (newVal) {
          this.localGroupItems = deepCopy(this.groupItems);
          this.selectedItemIndex = null;
          this.selectedConditionIndex = null;
        }
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
    handleOk() {
      this.$emit('save', this.localGroupItems);
      this.handleClose();
    },

    handleClose() {
      this.$emit('update:visible', false);
      this.$emit('close');
    },

    // 分组项管理方法
    addItem() {
      const newItem = { name: '', conditions: [] };
      this.groupItemDialogItem = newItem;
      this.groupItemDialogOperation = 'add';
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
      this.groupItemDialogItem = item;
      this.groupItemDialogOperation = 'edit';
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
      const conditions = currentItem.conditions || [];

      this.conditionDialogConditions = conditions;
      this.currentConditionIndex = -1;
      this.currentItemIndex = this.selectedItemIndex;
      this.conditionDialogFields = this.fields;
      this.conditionDialogCondition = null;
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
      const condition = conditions[this.selectedConditionIndex];

      this.conditionDialogConditions = conditions;
      this.currentConditionIndex = this.selectedConditionIndex;
      this.currentItemIndex = this.selectedItemIndex;
      this.conditionDialogFields = this.fields;
      this.conditionDialogCondition = condition;
      this.conditionDialogVisible = true;
    },

    handleGroupItemSave(data) {
      if (data.operation === 'add') {
        this.localGroupItems.push(data.groupItem);
      }
    },

    /**
     * 处理条件保存事件
     */
    handleConditionSave(conditionData) {
      if (this.currentItemIndex === null || this.currentItemIndex === -1) {
        return;
      }

      const currentItem = this.localGroupItems[this.currentItemIndex];
      const conditions = currentItem.conditions || [];

      if (conditionData.isEdit && this.currentConditionIndex >= 0) {
        const condition = conditions[this.currentConditionIndex];
        if (condition) {
          condition.left = conditionData.left;
          condition.operation = conditionData.operation;
          condition.op = conditionData.operation;
          condition.right = conditionData.right;
          condition.join = conditionData.join;
        }
      } else {
        const condition = {
          left: conditionData.left,
          operation: conditionData.operation,
          op: conditionData.operation,
          right: conditionData.right,
          join: conditionData.join,
          id: this.generateId()
        };
        conditions.push(condition);
      }
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

    generateId() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
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
  width: 250px;
  margin-right: 20px;
}

.conditions-section {
  flex: 1;
}

.group-select{
  width: 200px;
  height: 285px;
  display: inline-block;
  outline: none
}

.condition-select{
  height: 250px;
  outline: none;
}

.condition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.condition-header label {
  margin-right: 10px;
}

.u-button + .u-button{
  margin-left: 5px;
}
</style>
