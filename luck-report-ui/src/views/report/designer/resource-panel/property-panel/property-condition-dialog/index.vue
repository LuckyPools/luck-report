<template>
  <UDialog
    :title="$t('dialog.propCondition.title')"
    width="1120px"
    top="50px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="condition-body-container">
      <fieldset class="fieldset-small">
        <legend class="legend-style">{{ $t('dialog.propCondition.config') }}</legend>
        <condition-item
            :property-conditions="localPropertyConditions"
            :selected-item-index="selectedItemIndex"
            @item-added="onItemAdded"
            @item-updated="onItemUpdated"
            @item-deleted="onItemDeleted"
            @item-selected="onItemSelected"
            @item-index-changed="onItemIndexChanged"
        />
      </fieldset>

      <fieldset class="fieldset-medium">
        <legend class="legend-style">{{ $t('dialog.propCondition.conditionConfig') }}</legend>
        <condition-content
          :property-conditions="localPropertyConditions"
          :selected-item="selectedItem"
          :dataset-name="localDatasetName"
          :conditions="currentConditions"
          :reset-selection="resetConditionSelection"
          @condition-added="onConditionAdded"
          @condition-updated="onConditionUpdated"
          @condition-deleted="onConditionDeleted"
        />
      </fieldset>

      <fieldset class="fieldset-large" v-show="showPropertyGroup">
        <legend class="legend-style">{{ $t('dialog.propCondition.propConfig') }}</legend>
        <condition-config
          :item="selectedItem"
          @property-changed="onPropertyChanged"
        />
      </fieldset>
    </div>
    <div slot="footer" style="text-align: right">
      <u-button @click="handleClose" type="info" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
      <u-button @click="handleOk">{{ $t('dialog.common.ok') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import { setDirty } from '@/utils/table.js';
import ConditionItem from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/condition-item/index.vue';
import ConditionContent from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/condition-content/index.vue';
import ConditionConfig from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/condition-config/index.vue';
import UDialog from '@/components/dialog/index.vue';
import UButton from "@/components/button/index.vue";
import { mapGetters } from 'vuex';

export default {
  name: 'ConditionBody',
  components: {
    UButton,
    ConditionItem,
    ConditionContent,
    ConditionConfig,
    UDialog
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    datasetName: {
      type: String,
      default: ''
    },
    conditionPropertyItems: {
      type: Array,
      default: () => []
    },
    propertyConditions: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    }
  },
  data() {
    return {
      selectedItem: null,
      selectedItemIndex: -1,
      showPropertyGroup: false,
      localPropertyConditions: [],
      localDatasetName: '',
      currentConditions: [],
      resetConditionSelection: true
    };
  },
  watch: {
    propertyConditions: {
      handler(newVal) {
        this.localPropertyConditions = [...newVal];
      },
      deep: true,
      immediate: true
    },
    visible(newVal) {
      if (newVal) {
        this.localDatasetName = this.datasetName;
        this.localPropertyConditions.splice(0, this.localPropertyConditions.length);
        this.conditionPropertyItems.forEach(item => {
          this.localPropertyConditions.push(item);
        });

        if (this.localPropertyConditions.length > 0) {
          this.selectFirstItem();
        } else {
          this.clearSelection();
        }
      }
    }
  },
  methods: {

    onItemAdded(newItem) {
      // 将新项添加到本地数据副本中
      this.localPropertyConditions.push(newItem);
      // 向上传递事件
      this.$emit('item-added', newItem);
      setDirty();
    },

    onItemUpdated(index, item) {
      if (index >= 0 && index < this.localPropertyConditions.length) {
        this.$set(this.localPropertyConditions, index, item);
      }
      this.$emit('item-updated', item);
      setDirty();
    },

    onItemDeleted(index) {
      if (index >= 0 && index < this.localPropertyConditions.length) {
        this.localPropertyConditions.splice(index, 1);

        this.$emit('item-deleted', index);

        if (this.selectedItemIndex === index) {
          if (this.localPropertyConditions.length > 0) {
            this.$nextTick(() => {
              this.selectedItemIndex = 0;
            });
          } else {
            this.selectedItem = null;
            this.selectedItemIndex = -1;
            this.showPropertyGroup = false;
            this.currentConditions = [];
            this.resetConditionSelection = true;
          }
        }

        setDirty();
      }
    },

    onItemSelected(item) {
      this.selectedItem = item;

      if (!item) {
        this.showPropertyGroup = false;
        this.currentConditions = [];
        this.resetConditionSelection = true;
        return;
      }
      this.showPropertyGroup = true;

      if (!item.conditions) {
        item.conditions = [];
      }
      this.currentConditions = [...item.conditions];
      this.resetConditionSelection = false;
      setDirty();
    },

    onPropertyChanged(updatedItem) {
      if (updatedItem && this.selectedItem) {
        Object.keys(updatedItem).forEach(key => {
          if (key !== 'conditions' && key !== 'id') {
            this.$set(this.selectedItem, key, updatedItem[key]);
          }
        });
      }
      setDirty();
    },

    onConditionAdded(newCondition) {
      if (this.selectedItem) {
        if (!this.selectedItem.conditions) {
          this.selectedItem.conditions = [];
        }
        this.selectedItem.conditions.push(newCondition);
        this.currentConditions = [...this.selectedItem.conditions];
      }
      setDirty();
    },

    onConditionUpdated(index, updatedCondition) {
      if (this.selectedItem && this.selectedItem.conditions) {
        if (index >= 0 && index < this.selectedItem.conditions.length) {
          this.selectedItem.conditions.splice(index, 1, updatedCondition);
          this.currentConditions = [...this.selectedItem.conditions];
        }
      }
      setDirty();
    },

    onConditionDeleted(index) {
      if (this.selectedItem && this.selectedItem.conditions) {
        if (index >= 0 && index < this.selectedItem.conditions.length) {
          this.selectedItem.conditions.splice(index, 1);
          this.currentConditions = [...this.selectedItem.conditions];
        }
      }
      setDirty();
    },

    onItemIndexChanged(index) {
      this.selectedItemIndex = index;
    },

    selectFirstItem() {
      if (this.localPropertyConditions.length > 0) {
        this.selectedItemIndex = 0;
      }
    },

    clearSelection() {
      this.selectedItem = null;
      this.selectedItemIndex = -1;
      this.showPropertyGroup = false;
      this.currentConditions = [];
      this.resetConditionSelection = true;
    },

    // 对话框控制方法
    handleClose() {
      this.$emit('update:visible', false);
    },

    handleOk() {
      this.$emit('update:visible', false);

      const conditionsToReturn = this.localPropertyConditions.map(item => {
        return JSON.parse(JSON.stringify(item));
      });

      this.$emit('saveAfter', conditionsToReturn);
    }
  }
};
</script>

<style scoped>
.condition-body-container {
  padding: 10px;
}

.fieldset-small {
  padding: 10px;
  border: solid 1px #dddddd;
  border-radius: 8px;
  width: 160px;
  display: inline-block;
}

.fieldset-medium {
  padding: 10px;
  border: solid 1px #dddddd;
  border-radius: 8px;
  width: 250px;
  display: inline-block;
  vertical-align: top;
  margin-left: 10px;
}

.fieldset-large {
  padding: 10px;
  border: solid 1px #dddddd;
  border-radius: 8px;
  width: 550px;
  display: inline-block;
  vertical-align: top;
  margin-left: 10px;
}

.legend-style {
  width: auto;
  margin-bottom: 1px;
  border-bottom: none;
  font-size: inherit;
  color: #4b4b4b;
}
</style>
