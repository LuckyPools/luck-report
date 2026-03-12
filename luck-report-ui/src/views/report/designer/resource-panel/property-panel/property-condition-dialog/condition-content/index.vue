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
      :visible="dialogVisible"
      :dialog-fields="dialogFields"
      :dialog-condition="dialogCondition"
      :dialog-conditions="dialogConditions"
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
    datasetName: {
      type: String,
      default: ''
    },
    conditions: {
      type: Array,
      default: () => []
    },
    resetSelection: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      selectedConditionIndex: -1,
      isAddingCondition: false,
      dialogVisible: false,
      dialogFields: [],
      dialogCondition: null,
      dialogConditions: []
    };
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext || {};
    },
    datasources() {
      return this.context.reportDef?.datasources || [];
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
    },
    selectedItem: {
      handler(newVal) {
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
      if (!this.selectedItem) {
        showAlert(this.$t('dialog.propCondition.selectItem'));
        return;
      }

      const fields = this.buildFields();
      const conditions = this.selectedItem.conditions || [];

      this.isAddingCondition = true;
      this.dialogFields = fields;
      this.dialogCondition = null;
      this.dialogConditions = conditions;
      this.dialogVisible = true;
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

      this.isAddingCondition = false;
      this.dialogFields = fields;
      this.dialogCondition = condition;
      this.dialogConditions = conditions;
      this.dialogVisible = true;
    },

    handleSaveAfter(type, left, op, right, join) {
      if (!this.selectedItem) {
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
            join
          };
          this.$emit('condition-updated', updatedCondition);
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

      if (!this.selectedItem) {
        showAlert(this.$t('dialog.propCondition.selectDelCondition'));
        return;
      }

      const condition = this.conditions[this.selectedConditionIndex];
      this.$emit('condition-deleted', condition);
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
  height: 500px;
  padding: 3px;
  outline: none;
}
</style>
