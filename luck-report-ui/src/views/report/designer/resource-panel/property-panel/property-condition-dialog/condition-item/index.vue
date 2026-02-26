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
        v-model="selectedItemIndex"
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
        ref="conditionItemDialog"
        :propertyConditions="propertyConditions"
        @saveAfter="handleSaveAfter"
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
    }
  },
  data() {
    return {
      selectedItemIndex: -1,
      selectedItem: null
    };
  },
  methods: {
    addItem() {
      const newItem = { name: '', id: uuid() };
      this.$refs.conditionItemDialog.show(newItem, 'add');
    },
    editItem() {
      if (this.selectedItemIndex < 0 || this.selectedItemIndex >= this.propertyConditions.length) {
        showAlert(this.$t('dialog.propCondition.editTip'));
        return;
      }

      const item = this.propertyConditions[this.selectedItemIndex];
      this.$refs.conditionItemDialog.show(item, 'edit');
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

        const newLength = this.propertyConditions.length - 1;

        // 如果删除后数组为空，重置选中状态
        if (newLength <= 0) {
          this.selectedItemIndex = -1;
          this.selectedItem = null;
          this.$emit('item-selected', null);
        } else {
          // 如果删除的是最后一个项目，则选中前一个项目
          if (this.selectedItemIndex >= newLength) {
            this.selectedItemIndex = newLength - 1;
          }
          // 如果删除的不是最后一个项目，保持当前索引不变（因为数组会自动调整）

          // 确保索引在有效范围内
          if (this.selectedItemIndex < 0) {
            this.selectedItemIndex = 0;
          }

          // 更新选中的项目
          this.selectedItem = this.propertyConditions[this.selectedItemIndex];
          this.$emit('item-selected', this.selectedItem);
        }

        setDirty();
      });
    },
    onItemSelectChange() {
      if (this.selectedItemIndex < 0 || this.selectedItemIndex >= this.propertyConditions.length) {
        this.selectedItem = null;
        this.$emit('item-selected', null);
        return;
      }

      this.selectedItem = this.propertyConditions[this.selectedItemIndex];
      this.$emit('item-selected', this.selectedItem);
      setDirty();
    },
    // 提供给外部调用的方法
    selectFirstItem() {
      if (this.propertyConditions.length > 0) {
        this.selectedItemIndex = 0;
        this.onItemSelectChange();
      }
    },
    clearSelection() {
      this.selectedItemIndex = -1;
      this.selectedItem = null;
      this.$emit('item-selected', null);
    },
    // 处理保存后事件
    handleSaveAfter({ item, operation }) {
      if (operation === 'add') {
        this.$emit('item-added', item);
        this.selectedItemIndex = this.propertyConditions.length - 1;
        this.onItemSelectChange();
      } else if (operation === 'edit') {
        this.$emit('item-updated', item);
      }
      setDirty();
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
