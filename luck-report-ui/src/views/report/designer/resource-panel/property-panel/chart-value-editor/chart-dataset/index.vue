<template>
  <div class="chart-dataset">

    <u-form :label-width="100" labelPosition="left">
      <u-form-item class="property-label" :label="$t('chart.dataset')">
        <u-select
            v-model="localDatasetConfig.datasetName"
            :clearable="true"
            @change="handleDatasetChange"
            style="width: 250px"
        >
          <u-option
            v-for="option in datasetOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('chart.categoryProperty')">
        <u-select
            v-model="localDatasetConfig.categoryProperty"
            :clearable="true"
            style="width: 250px"
            @change="handleCategoryPropertyChange"
        >
          <u-option
            v-for="option in fieldOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('chart.valueProperty')">
        <u-select
            v-model="localDatasetConfig.valueProperty"
            :clearable="true"
            style="width: 250px"
            @change="handleValuePropertyChange"
        >
          <u-option
            v-for="option in fieldOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('chart.seriesProperty')">
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
      </u-form-item>

      <u-form-item class="property-label" v-show="localDatasetConfig.seriesType === 'property'" :label="$t('chart.prop')">
        <u-select
            v-model="localDatasetConfig.seriesProperty"
            :clearable="true"
            style="width: 250px"
            @change="handleSeriesPropertyChange"
        >
          <u-option
            v-for="option in fieldOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </u-form-item>

      <u-form-item class="property-label" v-show="localDatasetConfig.seriesType === 'text'" :label="$t('chart.staticValue')">
        <u-input
            style="width: 250px;"
            v-model="localDatasetConfig.seriesText"
            @change="handleSeriesTextChange"
        >
        </u-input>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('chart.aggregate')">
        <u-select
            v-model="localDatasetConfig.collectType"
            :clearable="true"
            style="width: 250px"
            @change="handleAggregateChange"
        >
          <u-option
            v-for="option in aggregateOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </u-form-item>
    </u-form>
  </div>
</template>

<script>
import {setDirty} from '@/utils/table';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UInput from '@/components/input/index.vue';
import UForm from "@/components/form/index.vue";
import UFormItem from "@/components/form-item/index.vue";

export default {
  name: 'ChartDataset',
  components: {
    UForm,
    UFormItem,
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
    fields: {
      type: Array,
      default: () => []
    },
    datasets: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
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
    datasetOptions() {
      return this.datasets.map(dataset => ({
        value: dataset.name,
        label: dataset.name
      }));
    },
    fieldOptions() {
      return this.fields.map(field => ({
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
    }
  },
  methods: {
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
.chart-dataset {
  margin-top: 10px;
}
</style>
