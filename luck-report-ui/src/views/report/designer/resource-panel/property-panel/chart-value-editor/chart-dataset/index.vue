<template>
  <fieldset class="fieldset-style">
    <legend class="legend-style">{{ $t('chart.propBindConfig') }}</legend>

    <!-- 数据集选择 -->
    <div class="form-group">
      <label>{{ $t('chart.dataset') }}：</label>
      <div class="u-inline">
        <u-select
            v-model="localDatasetConfig.datasetName"
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

    <!-- 分类属性 -->
    <div class="form-group">
      <label>{{ $t('chart.categoryProperty') }}：</label>
      <div class="u-inline">
        <u-select
            v-model="localDatasetConfig.categoryProperty"
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

    <!-- 值属性 -->
    <div class="form-group">
      <label>{{ $t('chart.valueProperty') }}：</label>
      <div class="u-inline">
        <u-select
            v-model="localDatasetConfig.valueProperty"
            :clearable="true"
            @change="handleValuePropertyChange"
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

    <!-- 系列属性 -->
    <div class="form-group" >
      <label>{{ $t('chart.seriesProperty') }}：</label>
      <div class="u-inline">
        <u-radio-group v-model="localDatasetConfig.seriesType" @change="handleSeriesTypeChange">
          <u-radio
            v-for="option in [
              { label: $t('chart.property'), value: 'property' },
              { label: $t('chart.static'), value: 'text' }
            ]"
            :key="option.value"
            :label="option.value"
          >
            {{ option.label }}
          </u-radio>
        </u-radio-group>
      </div>
    </div>

    <!-- 系列属性选择 -->
    <div class="form-group" v-show="localDatasetConfig.seriesType === 'property'">
      <label>{{ $t('chart.prop') }}：</label>
      <div class="u-inline">
        <u-select
            v-model="localDatasetConfig.seriesProperty"
            :clearable="true"
            @change="handleSeriesPropertyChange"
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

    <!-- 系列静态值 -->
    <div class="form-group" v-show="localDatasetConfig.seriesType === 'text'">
      <label>{{ $t('chart.staticValue') }}：</label>
      <div class="u-inline">
        <u-input
            style="width:220px;"
            v-model="localDatasetConfig.seriesText"
            @change="handleSeriesTextChange"
        >
        </u-input>
      </div>
    </div>

    <!-- 聚合方式 -->
    <div class="form-group" >
      <label>{{ $t('chart.aggregate') }}：</label>
      <div class="u-inline">
        <u-select
            v-model="localDatasetConfig.collectType"
            :clearable="true"
            @change="handleAggregateChange"
        >
          <u-option
            v-for="option in aggregateOptions"
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
import {setDirty} from '@/utils/table';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UInput from '@/components/input/index.vue';
import { mapGetters } from 'vuex';

export default {
  name: 'ChartDataset',
  components: {
    URadioGroup,
    URadio,
    USelect,
    UOption,
    UInput
  },
  props: {
    datasetConfig: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      availableDatasets: [],
      availableFields: [],
      localDatasetConfig: {
        datasetName: '',
        categoryProperty: '',
        valueProperty: '',
        seriesType: 'text',
        seriesProperty: '',
        seriesText: '',
        collectType: '',
        format: ''
      }
    };
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    },
    datasetOptions() {
      return this.availableDatasets.map(dataset => ({
        value: dataset.name,
        label: dataset.name
      }));
    },
    fieldOptions() {
      return this.availableFields.map(field => ({
        value: field.name,
        label: field.name
      }));
    },
    aggregateOptions() {
      return [
        { value: 'select', label: this.$t('chart.select') },
        { value: 'sum', label: this.$t('chart.sum') },
        { value: 'count', label: this.$t('chart.count') },
        { value: 'max', label: this.$t('chart.max') },
        { value: 'min', label: this.$t('chart.min') },
        { value: 'avg', label: this.$t('chart.avg') }
      ];
    }
  },
  watch: {
    datasetConfig: {
      handler(newVal) {
        if (newVal) {
          this.localDatasetConfig = { ...this.localDatasetConfig, ...newVal };
        }
      },
      deep: true,
      immediate: true
    },
    'localDatasetConfig.datasetName': {
      handler(newVal) {
        if (newVal) {
          this.loadAvailableFields();
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.loadAvailableDatasets();
  },
  methods: {
    loadAvailableDatasets() {
      this.availableDatasets = [];
      for (let ds of this.context.reportDef.datasources) {
        let datasets = ds.datasets || [];
        for (let dataset of datasets) {
          this.availableDatasets.push(dataset);
        }
      }
    },
    loadAvailableFields() {
      this.availableFields = [];
      const datasetName = this.datasetConfig.datasetName;

      if (!datasetName) return;

      for (let ds of this.context.reportDef.datasources) {
        let datasets = ds.datasets || [];
        for (let dataset of datasets) {
          if (dataset.name === datasetName) {
            this.availableFields = dataset.fields || [];
            break;
          }
        }
        if (this.availableFields.length > 0) {
          break;
        }
      }
    },
    handleDatasetChange(value) {
      this.$emit('dataset-change', value);
      setDirty();
    },
    handleCategoryPropertyChange(value) {
      this.$emit('category-property-change', value);
      setDirty();
    },
    handleValuePropertyChange(value) {
      this.$emit('value-property-change', value);
      setDirty();
    },
    handleSeriesTypeChange(value) {
      this.$emit('series-type-change', value);
      setDirty();
    },
    handleSeriesPropertyChange(value) {
      this.$emit('series-property-change', value);
      setDirty();
    },
    handleSeriesTextChange(value) {
      this.$emit('series-text-change', value);
      setDirty();
    },
    handleAggregateChange(value) {
      this.$emit('aggregate-change', value);
      setDirty();
    }
  }
};
</script>

<style scoped>

.fieldset-style {
  padding: 10px;
  border: solid 1px #dddddd;
  border-radius: 8px;
  margin-bottom: 10px;
  margin-top: 10px;
}

.legend-style {
  width: auto;
  margin-bottom: 1px;
  border-bottom: none;
  font-size: inherit;
  color: #4b4b4b;
}
</style>
