<template>
  <div class="data-mapping-tab">
    <u-form :label-width="100" labelPosition="left">
      <div style="padding-top: 10px">
        <div v-if="!showMappingOptions" class="alert alert-info" style="margin-bottom: 10px;">
        </div>

        <u-form-item :label="$t('property.dataset.mappingType')" v-show="showMappingOptions">
          <u-radio-group
              v-model="localMappingType"
              @change="handleMappingTypeChange">
            <u-radio
              v-for="option in mappingTypeOptions"
              :key="option.value"
              :label="option.value"
            >
            {{ option.label }}
            </u-radio>
          </u-radio-group>
        </u-form-item>

        <div v-show="showMappingOptions && localMappingType === 'simple'" class="form-group table-wrapper">
          <div class="top-button">
            <u-button
                type="info"
                :title="$t('property.dataset.addMappping')"
                @click="handleAddMapping"
                icon="icon-plus-circle"
            >
            </u-button>
          </div>
          <table class="table-container" style="margin-top: 10px">
            <thead>
              <tr>
                <th style="width: 130px;"><span>{{ $t('property.dataset.realValue') }}</span></th>
                <th style="width: 150px;"><span>{{ $t('property.dataset.displayValue') }}</span></th>
                <th style="width: 80px;"><span>{{ $t('property.dataset.op') }}</span></th>
              </tr>
            </thead>
            <tbody style="font-size: 12px">
              <tr v-for="(item, index) in localMappingItems" :key="index" style="height: 30px">
                <td><span>{{ item.value }}</span></td>
                <td><span>{{ item.label }}</span></td>
                <td>
                  <u-button
                      type="info"
                      icon="icon-edit"
                      :title="$t('dialog.urlParam.edit')"
                      @click="handleEditMapping(index)"
                      style="border: none">
                  </u-button>
                  <u-button
                      type="info"
                      icon="icon-delete"
                      :title="$t('dialog.urlParam.delete')"
                      @click="handleDeleteMapping(index)"
                      style="border: none;color: red">
                  </u-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-show="showMappingOptions && localMappingType === 'dataset'">
          <u-form-item :label="$t('property.dataset.dataset')">
            <u-select
              v-model="localMappingDataset"
              :clearable="true"
              @change="handleMappingDatasetChange"
            >
              <u-option
                v-for="option in datasetOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
              />
            </u-select>
          </u-form-item>

          <u-form-item :label="$t('property.dataset.realValueProp')">
            <u-select
              v-model="localMappingKeyProperty"
              :clearable="true"
              @change="handleMappingKeyPropertyChange"
            >
              <u-option
                v-for="option in mappingFieldOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
              />
            </u-select>
          </u-form-item>

          <u-form-item :label="$t('property.dataset.displayValueProp')">
            <u-select
              v-model="localMappingValueProperty"
              :clearable="true"
              @change="handleMappingValuePropertyChange"
            >
              <u-option
                v-for="option in mappingFieldOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
              />
            </u-select>
          </u-form-item>
        </div>
      </div>
    </u-form>
    <!-- 映射对话框 -->
    <mapping-dialog
      :visible.sync="dialogVisible"
      :mapping-item="currentMappingItem"
      :operation="dialogOperation"
      @save="handleMappingSave"
    ></mapping-dialog>
  </div>
</template>

<script>
import { setDirty } from '@/utils/table.js';
import { showAlert, showConfirm } from '@/utils/comnon.js';
import MappingDialog from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/mapping-dialog/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import UButton from '@/components/button/index.vue';
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import { mapGetters } from 'vuex';

export default {
  name: 'DataMappingTab',
  components: {
    MappingDialog,
    USelect,
    UOption,
    URadioGroup,
    URadio,
    UButton,
    UForm,
    UFormItem
  },
  props: {
    datasets: {
      type: Array,
      default: () => []
    },
    showMappingOptions: {
      type: Boolean,
      default: false
    },
    mappingType: {
      type: String,
      default: 'simple'
    },
    mappingItems: {
      type: Array,
      default: () => []
    },
    mappingDataset: {
      type: String,
      default: ''
    },
    mappingKeyProperty: {
      type: String,
      default: ''
    },
    mappingValueProperty: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      mappingFields: [],
      dialogVisible: false,
      dialogOperation: 'add',
      currentMappingItem: {
        value: '',
        label: ''
      },
      editingIndex: -1,
      // 本地数据属性，用于存储props的值
      localMappingType: this.mappingType,
      localMappingItems: [...this.mappingItems],
      localMappingDataset: this.mappingDataset,
      localMappingKeyProperty: this.mappingKeyProperty,
      localMappingValueProperty: this.mappingValueProperty
    };
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    },
    datasources() {
      return this.context.reportDef.datasources || [];
    },
    // 为USelect组件准备的数据集选项
    datasetOptions() {
      return this.datasets.map(dataset => ({
        value: dataset.name,
        label: dataset.name
      }));
    },
    // 为USelect组件准备的字段选项
    mappingFieldOptions() {
      return this.mappingFields.map(field => ({
        value: field.name,
        label: field.name
      }));
    },
    // 为URadioGroup组件准备的映射类型选项
    mappingTypeOptions() {
      return [
        { value: 'simple', label: this.$t('property.dataset.simple') },
        { value: 'dataset', label: this.$t('property.dataset.ds') }
      ];
    }
  },
  watch: {
    // 监听props变化，更新本地数据
    mappingType(newVal) {
      this.localMappingType = newVal;
      this.$emit('mapping-type-change', newVal);
    },
    mappingItems(newVal) {
      this.localMappingItems = [...newVal];
      this.$emit('mapping-items-change', newVal);
    },
    mappingDataset(newVal) {
      this.localMappingDataset = newVal;
      this.$emit('mapping-dataset-change', newVal);
    },
    mappingKeyProperty(newVal) {
      this.localMappingKeyProperty = newVal;
      this.$emit('mapping-key-property-change', newVal);
    },
    mappingValueProperty(newVal) {
      this.localMappingValueProperty = newVal;
      this.$emit('mapping-value-property-change', newVal);
    },
    localMappingDataset: {
      handler() {
        this.loadMappingFields();
      },
      immediate: true
    }
  },
  methods: {
    /**
     * 加载映射数据集的字段
     */
    loadMappingFields() {
      // 清空当前字段
      this.mappingFields = [];

      // 加载选中数据集的字段
      if (this.localMappingDataset) {
        for (let ds of this.datasources) {
          let datasets = ds.datasets || [];
          for (let dataset of datasets) {
            if (dataset.name === this.localMappingDataset) {
              this.mappingFields = dataset.fields || [];
              break;
            }
          }
          if (this.mappingFields.length > 0) {
            break;
          }
        }
      }
    },

    /**
     * 处理映射类型变化
     */
    handleMappingTypeChange() {
      this.$emit('mapping-type-change', this.localMappingType);
      setDirty();
    },

    /**
     * 处理添加映射
     */
    handleAddMapping() {
      this.currentMappingItem = { value: '', label: '' };
      this.dialogOperation = 'add';
      this.editingIndex = -1;
      this.dialogVisible = true;
    },

    /**
     * 处理编辑映射
     */
    handleEditMapping(index) {
      const item = this.localMappingItems[index];
      this.currentMappingItem = {
        value: item.value,
        label: item.label
      };
      this.dialogOperation = 'edit';
      this.editingIndex = index;
      this.dialogVisible = true;
    },

    /**
     * 处理映射保存
     */
    handleMappingSave(data) {
      if (this.dialogOperation === 'add') {
        this.localMappingItems.push(data);
      } else {
        if (this.editingIndex >= 0) {
          this.localMappingItems[this.editingIndex] = data;
        }
      }
      this.$emit('mapping-items-change', this.localMappingItems);
      setDirty();
    },

    /**
     * 处理删除映射
     */
    handleDeleteMapping(index) {
      const item = this.localMappingItems[index];
      showConfirm(this.$t('property.dataset.delConfirm')).then(() => {
        const newMappingItems = [...this.localMappingItems];
        const itemIndex = newMappingItems.indexOf(item);

        if (itemIndex !== -1) {
          newMappingItems.splice(itemIndex, 1);
          this.localMappingItems = newMappingItems;
          this.$emit('mapping-items-change', newMappingItems);
          setDirty();
        }
      });
    },

    /**
     * 处理映射数据集变化
     */
    handleMappingDatasetChange() {
      this.$emit('mapping-dataset-change', this.localMappingDataset);
      setDirty();
    },

    /**
     * 处理映射键属性变化
     */
    handleMappingKeyPropertyChange() {
      this.$emit('mapping-key-property-change', this.localMappingKeyProperty);
      setDirty();
    },

    /**
     * 处理映射值属性变化
     */
    handleMappingValuePropertyChange() {
      this.$emit('mapping-value-property-change', this.localMappingValueProperty);
      setDirty();
    }
  }
};
</script>
<style scoped>
.top-button{
  display: flex;
  justify-content: end;
}

</style>
