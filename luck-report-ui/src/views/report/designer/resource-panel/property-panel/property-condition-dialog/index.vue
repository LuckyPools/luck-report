<template>
  <UDialog
    :title="$t('dialog.propCondition.title')"
    width="1020px"
    top="50px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="condition-body-container">
      <fieldset class="fieldset-small">
        <legend class="legend-style">{{ $t('dialog.propCondition.config') }}</legend>
        <condition-group
            :property-conditions="localPropertyConditions"
            :selected-group-index="selectedGroupIndex"
            @group-added="onGroupAdded"
            @group-updated="onGroupUpdated"
            @group-deleted="onGroupDeleted"
            @group-selected="onGroupSelected"
            @group-index-changed="onGroupIndexChanged"
        />
      </fieldset>

      <fieldset class="fieldset-medium">
        <legend class="legend-style">{{ $t('dialog.propCondition.conditionConfig') }}</legend>
        <condition-item
          :property-conditions="localPropertyConditions"
          :selected-group="selectedGroup"
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
          :selected-group="selectedGroup"
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
import ConditionGroup from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/condition-group/index.vue';
import ConditionItem from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/condition-item/index.vue';
import ConditionConfig from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/condition-config/index.vue';
import UDialog from '@/components/dialog/index.vue';
import UButton from "@/components/button/index.vue";
import { mapGetters } from 'vuex';

export default {
  name: 'ConditionBody',
  components: {
    UButton,
    ConditionGroup,
    ConditionItem,
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
      selectedGroup: null,
      selectedGroupIndex: -1,
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
        this.conditionPropertyItems.forEach(group => {
          this.localPropertyConditions.push(group);
        });

        if (this.localPropertyConditions.length > 0) {
          this.selectFirstGroup();
        } else {
          this.clearSelection();
        }
      }
    }
  },
  methods: {

    onGroupAdded(newGroup) {
      this.localPropertyConditions.push(newGroup);
      setDirty();
    },

    onGroupUpdated(index, group) {
      if (index >= 0 && index < this.localPropertyConditions.length) {
        this.$set(this.localPropertyConditions, index, group);
      }
      setDirty();
    },

    onGroupDeleted(index) {
      if (index >= 0 && index < this.localPropertyConditions.length) {
        this.localPropertyConditions.splice(index, 1);

        if (this.selectedGroupIndex === index) {
          if (this.localPropertyConditions.length > 0) {
            this.$nextTick(() => {
              this.selectedGroupIndex = 0;
            });
          } else {
            this.selectedGroup = null;
            this.selectedGroupIndex = -1;
            this.showPropertyGroup = false;
            this.currentConditions = [];
            this.resetConditionSelection = true;
          }
        }

        setDirty();
      }
    },

    onGroupSelected(group) {
      this.selectedGroup = group;

      if (!group) {
        this.showPropertyGroup = false;
        this.currentConditions = [];
        this.resetConditionSelection = true;
        return;
      }
      this.showPropertyGroup = true;

      if (!group.conditions) {
        group.conditions = [];
      }
      this.currentConditions = [...group.conditions];
      this.resetConditionSelection = false;
      setDirty();
    },

    onPropertyChanged(updatedGroup) {
      if (updatedGroup && this.selectedGroup) {
        Object.keys(updatedGroup).forEach(key => {
          if (key !== 'conditions' && key !== 'id') {
            this.$set(this.selectedGroup, key, updatedGroup[key]);
          }
        });
      }
      setDirty();
    },

    onConditionAdded(newCondition) {
      if (this.selectedGroup) {
        if (!this.selectedGroup.conditions) {
          this.selectedGroup.conditions = [];
        }
        this.selectedGroup.conditions.push(newCondition);
        this.currentConditions = [...this.selectedGroup.conditions];
      }
      setDirty();
    },

    onConditionUpdated(index, updatedCondition) {
      if (this.selectedGroup && this.selectedGroup.conditions) {
        if (index >= 0 && index < this.selectedGroup.conditions.length) {
          this.selectedGroup.conditions.splice(index, 1, updatedCondition);
          this.currentConditions = [...this.selectedGroup.conditions];
        }
      }
      setDirty();
    },

    onConditionDeleted(index) {
      if (this.selectedGroup && this.selectedGroup.conditions) {
        if (index >= 0 && index < this.selectedGroup.conditions.length) {
          this.selectedGroup.conditions.splice(index, 1);
          this.currentConditions = [...this.selectedGroup.conditions];
        }
      }
      setDirty();
    },

    onGroupIndexChanged(index) {
      this.selectedGroupIndex = index;
    },

    selectFirstGroup() {
      if (this.localPropertyConditions.length > 0) {
        this.selectedGroupIndex = 0;
      }
    },

    clearSelection() {
      this.selectedGroup = null;
      this.selectedGroupIndex = -1;
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

      const conditionsToReturn = this.localPropertyConditions.map(group => {
        return JSON.parse(JSON.stringify(group));
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
  width: 450px;
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
