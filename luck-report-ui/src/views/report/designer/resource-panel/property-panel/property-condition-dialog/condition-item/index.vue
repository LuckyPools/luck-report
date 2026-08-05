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
            :key="index"
            :value="index"
        >
          {{ getConditionText(condition) }}
        </option>
      </select>
    </div>

    <condition-item-dialog
      :visible="dialogVisible"
      :fields="fields"
      :condition="condition"
      :conditions="localConditions"
      :cell-type="cellType"
      @saveAfter="handleSaveAfter"
      @close="dialogVisible = false"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { showAlert } from '@/utils/comnon.js';
import { setDirty } from '@/utils/table.js';
import { v1 as uuid } from 'uuid';
import ConditionItemDialog from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/condition-item-dialog/index.vue';
import UButton from '@/components/button/index.vue';

export default {
  name: 'ConditionItem',
  components: {
    ConditionItemDialog,
    UButton
  },
  props: {
    selectedGroup: {
      type: Object,
      default: null
    },
    fields: {
      type: Array,
      default: () => []
    },
    conditions: {
      type: Array,
      default: () => []
    },
    resetSelection: {
      type: Boolean,
      default: true
    },
    cellType: {
      type: String,
      default: 'simple'
    }
  },
  data() {
    return {
      selectedConditionIndex: -1,
      isAddingCondition: false,
      dialogVisible: false,
      condition: null,
      localConditions: []
    };
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext || {};
    }
  },
  watch: {
    resetSelection(newVal) {
      if (newVal) {
        this.selectedConditionIndex = -1;
      }
    },
    conditions: {
      handler(newVal) {
        if (newVal) {
          this.selectedConditionIndex = -1;
        }
      },
      immediate: true
    }
  },
  methods: {
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
      if (!this.selectedGroup) {
        showAlert(this.$t('dialog.propCondition.selectItem'));
        return;
      }

      const conditions = this.selectedGroup.conditions || [];

      this.isAddingCondition = true;
      this.condition = null;
      this.localConditions = conditions;
      this.dialogVisible = true;
    },
    editCondition() {
      if (this.selectedConditionIndex < 0 || this.selectedConditionIndex >= this.conditions.length) {
        showAlert(this.$t('dialog.propCondition.editConditionTip'));
        return;
      }

      if (!this.selectedGroup) {
        showAlert(this.$t('dialog.propCondition.selectConditionItem'));
        return;
      }

      const condition = this.conditions[this.selectedConditionIndex];
      const conditions = this.selectedGroup.conditions || [];

      this.isAddingCondition = false;
      this.condition = condition;
      this.localConditions = conditions;
      this.dialogVisible = true;
    },

    handleSaveAfter(type, left, op, right, join) {
      if (!this.selectedGroup) {
        return;
      }

      if (this.isAddingCondition) {
        const newCondition = {
          type,
          left,
          operation: op,
          right,
          join,
          id: uuid()
        };
        this.$emit('condition-added', newCondition);
        this.isAddingCondition = false;
      } else {
        if (this.selectedConditionIndex >= 0 && this.selectedConditionIndex < this.conditions.length) {
          const condition = this.conditions[this.selectedConditionIndex];
          const updatedCondition = {
            ...condition,
            type,
            left,
            operation: op,
            right,
            join,
            id: condition.id || uuid()
          };
          this.$emit('condition-updated', this.selectedConditionIndex, updatedCondition);
        }
        this.isAddingCondition = false;
      }

      setDirty();
    },
    deleteCondition() {
      if (this.selectedConditionIndex < 0 || this.selectedConditionIndex >= this.conditions.length) {
        showAlert(this.$t('dialog.propCondition.delConditionTip'));
        return;
      }

      if (!this.selectedGroup) {
        showAlert(this.$t('dialog.propCondition.selectDelCondition'));
        return;
      }

      this.$emit('condition-deleted', this.selectedConditionIndex);
      this.selectedConditionIndex = -1;
      setDirty();
    },
    onConditionSelectChange() {
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
  height: 400px;
  padding: 3px;
  outline: none;
}
</style>
