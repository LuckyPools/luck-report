<template>
  <div>
    <div>
      <u-button
          type="info"
          icon="icon-plus-circle"
          :title="$t('dialog.propCondition.addGroup')"
          @click="addGroup"
      >
      </u-button>
      <u-button
          type="info"
          icon="icon-edit"
          :title="$t('dialog.propCondition.editGroup')"
          @click="editGroup"
      >
      </u-button>
      <u-button
          type="info"
          icon="icon-delete"
          :title="$t('dialog.propCondition.delGroup')"
          @click="deleteGroup"
      >
      </u-button>
    </div>

    <div style="margin-top: 10px;">
      <select
        ref="groupSelect"
        size="10"
        class="form-control group-select"
        :value="selectedGroupIndex"
        @change="onGroupSelectChange"
      >
      <option
          v-for="(group, index) in conditionGroups"
          :key="group.id"
          :value="index"
      >
        {{ group.name }}
      </option>
    </select>
    </div>

    <property-condition-group-dialog
        :visible="dialogVisible"
        :conditionGroup="currentConditionGroup"
        :operation="currentOperation"
        :conditionGroups="conditionGroups"
        @saveAfter="handleSaveAfter"
        @close="handleDialogClose"
    />
  </div>
</template>

<script>
import {showAlert, showConfirm} from '@/utils/comnon.js';
import {setDirty} from '@/utils/table.js';
import PropertyConditionGroupDialog
  from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/condition-group-dialog/index.vue';
import UButton from '@/components/button/index.vue';

export default {
  name: 'ConditionGroup',
  components: {
    PropertyConditionGroupDialog,
    UButton
  },
  props: {
    conditionGroups: {
      type: Array,
      default: () => []
    },
    selectedGroupIndex: {
      type: Number,
      default: -1
    }
  },
  data() {
    return {
      selectedGroup: null,
      dialogVisible: false,
      currentConditionGroup: null,
      currentOperation: 'add'
    };
  },
  watch: {
    selectedGroupIndex: {
      handler(newVal) {
        if (newVal < 0 || newVal >= this.conditionGroups.length) {
          this.selectedGroup = null;
          this.$emit('group-selected', null);
        } else {
          this.selectedGroup = this.conditionGroups[newVal];
          this.$emit('group-selected', this.selectedGroup);
        }
      },
      immediate: true
    }
  },
  methods: {
    addGroup() {
      this.currentConditionGroup = {name: ''};
      this.currentOperation = 'add';
      this.dialogVisible = true;
    },
    editGroup() {
      if (this.selectedGroupIndex < 0 || this.selectedGroupIndex >= this.conditionGroups.length) {
        showAlert(this.$t('dialog.propCondition.editTip'));
        return;
      }

      this.currentConditionGroup = this.conditionGroups[this.selectedGroupIndex];
      this.currentOperation = 'edit';
      this.dialogVisible = true;
    },
    deleteGroup() {
      if (this.selectedGroupIndex < 0 || this.selectedGroupIndex >= this.conditionGroups.length) {
        showAlert(this.$t('dialog.propCondition.delTip'));
        return;
      }

      const group = this.conditionGroups[this.selectedGroupIndex];
      const groupName = group.name || '';

      showConfirm(`${this.$t('dialog.propCondition.delConfirm')}[${groupName}]?`).then(() => {
        this.$emit('group-deleted', this.selectedGroupIndex);
        setDirty();
      });
    },
    onGroupSelectChange(event) {
      const newIndex = parseInt(event.target.value);
      this.$emit('group-index-changed', newIndex);
      setDirty();
    },
    handleSaveAfter({ group, operation }) {
      if (operation === 'add') {
        this.currentConditionGroup.name = group.name;
        this.$emit('group-added', this.currentConditionGroup);
        const newIndex = this.conditionGroups.length - 1;
        this.$emit('group-index-changed', newIndex);
      } else if (operation === 'edit') {
        this.currentConditionGroup.name = group.name;
        this.$emit('group-updated', this.selectedGroupIndex, this.currentConditionGroup);
      }
      setDirty();
    },
    // 处理弹窗关闭事件
    handleDialogClose() {
      this.dialogVisible = false;
      setTimeout(() => {
        this.currentConditionGroup = null;
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

.group-select{
  height: 400px;
  outline: none;
}
</style>
