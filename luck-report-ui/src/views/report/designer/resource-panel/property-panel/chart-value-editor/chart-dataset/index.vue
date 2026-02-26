<template>
  <fieldset class="fieldset-style">
    <legend class="legend-style">{{ $t('chart.propBindConfig') }}</legend>

    <!-- 数据集选择 -->
    <div class="form-group">
      <label>{{ $t('chart.dataset') }}：</label>
      <div class="u-inline">
        <u-select
            :value="datasetConfig.datasetName"
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
            :value="datasetConfig.categoryProperty"
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
            :value="datasetConfig.valueProperty"
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
        <u-radio-group :value="datasetConfig.seriesType" @change="handleSeriesTypeChange">
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
    <div class="form-group" v-show="datasetConfig.seriesType === 'property'">
      <label>{{ $t('chart.prop') }}：</label>
      <div class="u-inline">
        <u-select
            :value="datasetConfig.seriesProperty"
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
    <div class="form-group" v-show="datasetConfig.seriesType === 'text'">
      <label>{{ $t('chart.staticValue') }}：</label>
      <div class="u-inline">
        <u-input
            style="width:288px;"
            :value="datasetConfig.seriesText"
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
            :value="datasetConfig.collectType"
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
    },
    availableDatasets: {
      type: Array,
      default: () => []
    },
    availableFields: {
      type: Array,
      default: () => []
    }
  },
  computed: {
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
    },
    // 聚合方式选项
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
  methods: {
    /**
     * 处理数据集变化
     */
    handleDatasetChange(value) {
      this.$emit('dataset-change', value);
      setDirty();
    },

    /**
     * 处理分类属性变化
     */
    handleCategoryPropertyChange(value) {
      this.$emit('category-property-change', value);
      setDirty();
    },

    /**
     * 处理值属性变化
     */
    handleValuePropertyChange(value) {
      this.$emit('value-property-change', value);
      setDirty();
    },

    /**
     * 处理系列类型变化
     */
    handleSeriesTypeChange(value) {
      this.$emit('series-type-change', value);
      setDirty();
    },

    /**
     * 处理系列属性变化
     */
    handleSeriesPropertyChange(value) {
      this.$emit('series-property-change', value);
      setDirty();
    },

    /**
     * 处理系列文本变化
     */
    handleSeriesTextChange(value) {
      this.$emit('series-text-change', value);
      setDirty();
    },

    /**
     * 处理聚合方式变化
     */
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
