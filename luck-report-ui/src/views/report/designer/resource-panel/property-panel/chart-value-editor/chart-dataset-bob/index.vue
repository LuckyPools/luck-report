<template>
  <fieldset class="chart-fieldset">
    <legend>{{ $t('chart.propBindConfig') }}</legend>

    <!-- 数据集选择 -->
    <div class="form-group">
      <label>{{ $t('chart.dataset') }}：</label>
      <div class="u-inline">
        <u-select
          v-model="localDataset"
          :clearable="true"
          @change="handleDatasetChange"
        >
          <u-option
            v-for="option in datasetOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </div>
    </div>

    <!-- 类别属性选择 -->
    <div class="form-group">
      <label>{{ $t('chart.categoryProperty') }}：</label>
      <div class="u-inline">
        <u-select
          v-model="localCategoryProperty"
          :clearable="true"
          @change="handleCategoryPropertyChange"
        >
          <u-option
            v-for="option in fieldOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </div>
    </div>

    <!-- X轴属性选择 -->
    <div class="form-group">
      <label>{{ $t('chart.xProperty') }}：</label>
      <div class="u-inline">
        <u-select
          v-model="localXProperty"
          :clearable="true"
          @change="handleXPropertyChange"
        >
          <u-option
            v-for="option in fieldOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </div>
    </div>

    <!-- Y轴属性选择 -->
    <div class="form-group">
      <label>{{ $t('chart.yProperty') }}：</label>
      <div class="u-inline">
        <u-select
          v-model="localYProperty"
          :clearable="true"
          @change="handleYPropertyChange"
        >
          <u-option
            v-for="option in fieldOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </div>
    </div>

    <!-- R轴属性选择 -->
    <div class="form-group" v-if="showRProperty">
      <label>{{ $t('chart.rProperty') }}：</label>
      <div class="u-inline">
        <u-select
          v-model="localRProperty"
          :clearable="true"
          @change="handleRPropertyChange"
        >
          <u-option
            v-for="option in fieldOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </div>
    </div>
  </fieldset>
</template>

<script>
import {setDirty} from '@/utils/table.js';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import { mapGetters } from 'vuex';

export default {
  name: 'ChartDataConfig',
  components: {
    USelect,
    UOption
  },
  props: {
    selectedDataset: {
      type: String,
      default: ''
    },
    selectedCategoryProperty: {
      type: String,
      default: ''
    },
    selectedXProperty: {
      type: String,
      default: ''
    },
    selectedYProperty: {
      type: String,
      default: ''
    },
    selectedRProperty: {
      type: String,
      default: ''
    },
    showRProperty: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      availableFields: [],
      // 本地数据，从props复制而来
      localDataset: '',
      localCategoryProperty: '',
      localXProperty: '',
      localYProperty: '',
      localRProperty: ''
    };
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    },
    datasources() {
      return this.context?.reportDef?.datasources || [];
    },
    availableDatasets() {
      if (!this.datasources) return [];

      const datasets = [];
      for (const ds of this.datasources) {
        const dsDatasets = ds.datasets || [];
        for (const dataset of dsDatasets) {
          datasets.push(dataset);
        }
      }
      return datasets;
    },
    // 为USelect组件准备的数据集选项
    datasetOptions() {
      return this.availableDatasets.map(dataset => ({
        value: dataset.name,
        label: dataset.name
      }));
    },
    // 为USelect组件准备的字段选项
    fieldOptions() {
      return this.availableFields.map(field => ({
        value: field.name,
        label: field.name
      }));
    }
  },
  watch: {
    selectedDataset(newVal) {
      this.localDataset = newVal;
    },
    selectedCategoryProperty(newVal) {
      this.localCategoryProperty = newVal;
    },
    selectedXProperty(newVal) {
      this.localXProperty = newVal;
    },
    selectedYProperty(newVal) {
      this.localYProperty = newVal;
    },
    selectedRProperty(newVal) {
      this.localRProperty = newVal;
    },
    localDataset() {
      this.updateAvailableFields();
    },
    datasources: {
      handler() {
        this.updateAvailableFields();
      },
      immediate: true
    }
  },
  mounted() {
    // 确保组件挂载后更新可用字段
    this.updateAvailableFields();
    // 初始化本地数据
    this.initLocalData();
  },
  methods: {
    // 初始化本地数据
    initLocalData() {
      this.localDataset = this.selectedDataset || '';
      this.localCategoryProperty = this.selectedCategoryProperty || '';
      this.localXProperty = this.selectedXProperty || '';
      this.localYProperty = this.selectedYProperty || '';
      this.localRProperty = this.selectedRProperty || '';
    },

    // 更新可用字段
    updateAvailableFields() {
      if (!this.localDataset || !this.datasources) {
        this.availableFields = [];
        return;
      }

      let fields = [];
      for (const ds of this.datasources) {
        const datasets = ds.datasets || [];
        for (const dataset of datasets) {
          if (dataset.name === this.localDataset) {
            fields = dataset.fields || [];
            break;
          }
        }
        if (fields.length > 0) break;
      }

      // 使用$nextTick确保DOM更新
      this.$nextTick(() => {
        this.availableFields = fields;
      });
    },

    // 处理数据集变化
    handleDatasetChange() {

      // 清空属性选择
      this.localCategoryProperty = '';
      this.localXProperty = '';
      this.localYProperty = '';
      this.localRProperty = '';

      // 通知父组件更新配置
      this.$emit('update-dataset', {
        datasetName: this.localDataset,
        categoryProperty: '',
        xProperty: '',
        yProperty: '',
        rProperty: ''
      });

      setDirty();
    },

    // 处理类别属性变化
    handleCategoryPropertyChange() {
      this.$emit('update-dataset', { categoryProperty: this.localCategoryProperty });
      setDirty();
    },

    // 处理X属性变化
    handleXPropertyChange() {
      this.$emit('update-dataset', { xProperty: this.localXProperty });
      setDirty();
    },

    // 处理Y属性变化
    handleYPropertyChange() {
      this.$emit('update-dataset', { yProperty: this.localYProperty });
      setDirty();
    },

    // 处理R属性变化
    handleRPropertyChange() {
      this.$emit('update-dataset', { rProperty: this.localRProperty });
      setDirty();
    }
  }
};
</script>

<style scoped>
.chart-fieldset {
  padding: 10px;
  border: solid 1px #dddddd;
  border-radius: 8px;
  margin-bottom: 10px;
  margin-top: 10px;
}

.chart-fieldset legend {
  width: auto;
  margin-bottom: 1px;
  border-bottom: none;
  font-size: inherit;
  color: #4b4b4b;
}

</style>
