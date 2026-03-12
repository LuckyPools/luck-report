<template>
  <div>
    <div>
      <u-button
          type="info"
          icon="icon-plus-circle"
          :title="$t('dialog.propCondition.addItem')"
          @click="addItem"
      >
      </u-button>
      <u-button
          type="info"
          icon="icon-edit"
          :title="$t('dialog.propCondition.editItem')"
          @click="editItem"
      >
      </u-button>
      <u-button
          type="info"
          icon="icon-delete"
          :title="$t('dialog.propCondition.delItem')"
          @click="deleteItem"
      >
      </u-button>
    </div>

    <div style="margin-top: 10px;">
      <select
        ref="itemSelect"
        size="10"
        class="form-control item-select"
        :value="selectedItemIndex"
        @change="onItemSelectChange"
      >
      <option
          v-for="(item, index) in propertyConditions"
          :key="item.id"
          :value="index"
      >
        {{ item.name }}
      </option>
    </select>
    </div>

    <property-condition-item-dialog
        :visible="dialogVisible"
        :conditionItem="currentConditionItem"
        :operation="currentOperation"
        :propertyConditions="propertyConditions"
        @saveAfter="handleSaveAfter"
        @close="handleDialogClose"
    />
  </div>
</template>

<script>
import { showAlert, showConfirm } from '@/utils/comnon.js';
import { setDirty } from '@/utils/table.js';
import { v1 as uuid } from 'uuid';
import PropertyConditionItemDialog from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/condition-item-dialog/index.vue';
import UButton from '@/components/button/index.vue';

export default {
  name: 'ConditionItem',
  components: {
    PropertyConditionItemDialog,
    UButton
  },
  props: {
    propertyConditions: {
      type: Array,
      default: () => []
    },
    selectedItemIndex: {
      type: Number,
      default: -1
    }
  },
  data() {
    return {
      selectedItem: null,
      dialogVisible: false,
      currentConditionItem: null,
      currentOperation: 'add'
    };
  },
  watch: {
    selectedItemIndex: {
      handler(newVal) {
        if (newVal < 0 || newVal >= this.propertyConditions.length) {
          this.selectedItem = null;
          this.$emit('item-selected', null);
        } else {
          this.selectedItem = this.propertyConditions[newVal];
          this.$emit('item-selected', this.selectedItem);
        }
      },
      immediate: true
    }
  },
  methods: {
    addItem() {
      const newItem = { name: '', id: uuid() };
      this.currentConditionItem = newItem;
      this.currentOperation = 'add';
      this.dialogVisible = true;
    },
    editItem() {
      if (this.selectedItemIndex < 0 || this.selectedItemIndex >= this.propertyConditions.length) {
        showAlert(this.$t('dialog.propCondition.editTip'));
        return;
      }

      const item = this.propertyConditions[this.selectedItemIndex];
      this.currentConditionItem = item;
      this.currentOperation = 'edit';
      this.dialogVisible = true;
    },
    deleteItem() {
      if (this.selectedItemIndex < 0 || this.selectedItemIndex >= this.propertyConditions.length) {
        showAlert(this.$t('dialog.propCondition.delTip'));
        return;
      }

      const item = this.propertyConditions[this.selectedItemIndex];
      const itemName = item.name || '';

      showConfirm(`${this.$t('dialog.propCondition.delConfirm')}[${itemName}]?`).then(() => {
        this.$emit('item-deleted', this.selectedItemIndex);
        setDirty();
      });
    },
    onItemSelectChange(event) {
      const newIndex = parseInt(event.target.value);
      this.$emit('item-index-changed', newIndex);
      setDirty();
    },
    handleSaveAfter({ item, operation }) {
      if (operation === 'add') {
        this.currentConditionItem.name = item.name;
        this.$emit('item-added', this.currentConditionItem);
        const newIndex = this.propertyConditions.length - 1;
        this.$emit('item-index-changed', newIndex);
      } else if (operation === 'edit') {
        this.currentConditionItem.name = item.name;
        this.$emit('item-updated', this.currentConditionItem);
      }
      setDirty();
    },
    // 处理弹窗关闭事件
    handleDialogClose() {
      this.dialogVisible = false;
      setTimeout(() => {
        this.currentConditionItem = null;
        this.currentOperation = 'add';
      }, 300);
    },
  }
};
</script>

<style scoped>
.u-button + .u-button{
  margin-left: 5px;
}

.item-select{
  height: 500px;
  outline: none;
}
</style>
