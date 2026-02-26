<template>
  <UDialog
    :title="$t('dialog.propCondition.title')"
    width="1200px"
    top="50px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="condition-body-container">
      <fieldset class="fieldset-small">
        <legend class="legend-style">{{ $t('dialog.propCondition.config') }}</legend>
        <condition-item
            ref="conditionItem"
            :property-conditions="localPropertyConditions"
            @item-added="onItemAdded"
            @item-updated="onItemUpdated"
            @item-deleted="onItemDeleted"
            @item-selected="onItemSelected"
        />
      </fieldset>

      <fieldset class="fieldset-medium">
        <legend class="legend-style">{{ $t('dialog.propCondition.conditionConfig') }}</legend>
        <condition-content
          ref="conditionBar"
          :property-conditions="localPropertyConditions"
          :selected-item="selectedItem"
          :datasources="localDatasources"
          :dataset-name="localDatasetName"
        />
      </fieldset>

      <fieldset
        ref="propGroup"
        class="fieldset-large"
        v-show="showPropertyGroup"
      >
        <legend class="legend-style">{{ $t('dialog.propCondition.propConfig') }}</legend>
        <condition-config
          ref="propertyConfig"
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
    propertyConditions: {
      type: Array,
      default: () => []
    },
    datasources: {
      type: Array,
      default: () => []
    },
    datasetName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      visible: false,
      selectedItem: null,
      showPropertyGroup: false,
      localPropertyConditions: [],
      localDatasources: [],
      localDatasetName: ''
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
    datasources: {
      handler(newVal) {
        this.localDatasources = [...newVal];
      },
      deep: true,
      immediate: true
    },
    datasetName: {
      handler(newVal) {
        this.localDatasetName = newVal;
      },
      immediate: true
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

    onItemUpdated(item) {
      // 找到对应的项目并更新
      const index = this.localPropertyConditions.findIndex(existingItem => existingItem.id === item.id);
      if (index !== -1) {
        // 使用Vue.set或直接替换整个对象以确保响应性
        this.$set(this.localPropertyConditions, index, item);
      }
      // 向上传递事件
      this.$emit('item-updated', item);
      setDirty();
    },

    onItemDeleted(index) {
      // 从本地数据副本中删除项目，使用传入的索引
      if (index >= 0 && index < this.localPropertyConditions.length) {
        const deletedItem = this.localPropertyConditions[index];
        this.localPropertyConditions.splice(index, 1);

        // 向上传递事件，传递索引而非item对象
        this.$emit('item-deleted', index);

        // 如果删除的是当前选中的项目，需要更新选中状态
        if (this.selectedItem && this.selectedItem.id === deletedItem.id) {
          // 如果还有其他项目，选中第一个
          if (this.localPropertyConditions.length > 0) {
            // 延迟执行，确保DOM更新完成
            this.$nextTick(() => {
              this.selectedItem = this.localPropertyConditions[0];
              this.$refs.conditionItem.selectedItemIndex = 0;
              this.$refs.conditionItem.selectedItem = this.selectedItem;
              this.$refs.conditionItem.$emit('item-selected', this.selectedItem);

              // 更新条件列表
              if (!this.selectedItem.conditions) {
                this.selectedItem.conditions = [];
              }
              this.$refs.conditionBar.updateConditions(this.selectedItem.conditions, false);
            });
          } else {
            // 如果没有项目了，清空选中状态
            this.selectedItem = null;
            this.showPropertyGroup = false;
            this.$refs.conditionBar.updateConditions([]);
          }
        }

        setDirty();
      }
    },

    onItemSelected(item) {
      this.selectedItem = item;

      this.$refs.propertyConfig.updateConfig(item);
      if (!item) {
        this.showPropertyGroup = false;
        this.$refs.conditionBar.updateConditions([]);
        return;
      }
      this.showPropertyGroup = true;

      if (!item.conditions) {
        item.conditions = [];
      }
      this.$refs.conditionBar.updateConditions(item.conditions, false);
      setDirty();
    },

    onPropertyChanged(updatedItem) {
      if (updatedItem) {
        const index = this.localPropertyConditions.findIndex(item => item.name === updatedItem.name);
        if (index !== -1) {
          const currentConditions = this.selectedItem ? this.selectedItem.conditions : [];

          this.$set(this.localPropertyConditions, index, updatedItem);

          this.selectedItem = updatedItem;
          if (this.selectedItem && !this.selectedItem.conditions) {
            this.selectedItem.conditions = [];
          }

          // 如果conditions数组存在且不为空，则保持当前选中的条件
          if (currentConditions && currentConditions.length > 0) {
            this.selectedItem.conditions = currentConditions;
            // 通知condition-content组件更新条件列表，但不重置选中状态
            if (this.$refs.conditionBar) {
              this.$refs.conditionBar.updateConditions(currentConditions);
            }
          }
        }
      }
      setDirty();
    },

    // 提供给外部调用的方法
    selectFirstItem() {
      if (this.$refs.conditionItem) {
        this.$refs.conditionItem.selectFirstItem();
      }
    },

    clearSelection() {
      this.selectedItem = null;
      this.showPropertyGroup = false;
      if (this.$refs.conditionItem) {
        this.$refs.conditionItem.clearSelection();
      }
      if(this.$refs.conditionBar){
        this.$refs.conditionBar.updateConditions([]);
      }
    },

    // 对话框控制方法
    show(datasources, datasetName, propertyConditions) {
      // 更新本地数据，而不是直接修改props
      this.localDatasources = [...datasources];
      this.localDatasetName = datasetName;

      // 清空并重新设置localPropertyConditions数组，确保响应性
      this.localPropertyConditions.splice(0, this.localPropertyConditions.length);
      propertyConditions.forEach(item => {
        this.localPropertyConditions.push(item);
      });

      this.visible = true;

      // 如果有条件项，默认选择第一个
      if(propertyConditions.length > 0){
        this.selectFirstItem();
      } else {
        this.clearSelection();
      }
    },

    handleClose() {
      this.visible = false;
    },

    handleOk() {
      this.visible = false;

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
  height: 560px;
  overflow: auto;
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
  width: 325px;
  display: inline-block;
  height: 550px;
  vertical-align: top;
  margin-left: 10px;
}

.fieldset-large {
  padding: 10px;
  border: solid 1px #dddddd;
  border-radius: 8px;
  width: 550px;
  display: inline-block;
  height: 550px;
  vertical-align: top;
  margin-left: 10px;
  overflow-y: scroll;
}

.legend-style {
  width: auto;
  margin-bottom: 1px;
  border-bottom: none;
  font-size: inherit;
  color: #4b4b4b;
}
</style>
