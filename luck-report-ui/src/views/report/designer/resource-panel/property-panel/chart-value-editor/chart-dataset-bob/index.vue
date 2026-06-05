<template>
  <div class="chart-dataset-bob">

    <u-form :label-width="100" labelPosition="left">
      <u-form-item class="property-label" :label="$t('chart.dataset')">
        <u-select
          v-model="localDatasetName"
          @change="handleDatasetChange"
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
      </u-form-item>

      <u-form-item class="property-label" :label="$t('chart.xProperty')">
        <u-select
          v-model="localXProperty"
          @change="handleXPropertyChange"
        >
          <u-option
            v-for="option in fieldOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('chart.yProperty')">
        <u-select
          v-model="localYProperty"
          @change="handleYPropertyChange"
        >
          <u-option
            v-for="option in fieldOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </u-form-item>

      <u-form-item class="property-label" v-if="showRProperty" :label="$t('chart.rProperty')">
        <u-select
          v-model="localRProperty"
          @change="handleRPropertyChange"
        >
          <u-option
            v-for="option in fieldOptions"
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
import {setDirty} from '@/utils/table.js';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UFormItem from "@/components/form-item/index.vue";
import UForm from "@/components/form/index.vue";

export default {
  name: 'ChartDataConfig',
  components: {
    UForm,
    UFormItem,
    USelect,
    UOption
  },
  props: {
    datasetName: {
      type: String,
      default: ''
    },
    categoryProperty: {
      type: String,
      default: ''
    },
    xProperty: {
      type: String,
      default: ''
    },
    yProperty: {
      type: String,
      default: ''
    },
    rProperty: {
      type: String,
      default: ''
    },
    showRProperty: {
      type: Boolean,
      default: true
    },
    datasets: {
      type: Array,
      default: () => []
    },
    fields: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      localDatasetName: '',
      localCategoryProperty: '',
      localXProperty: '',
      localYProperty: '',
      localRProperty: ''
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
    }
  },
  watch: {
    datasetName: {
      handler(newVal) {
        this.localDatasetName = newVal || '';
      },
      immediate: true
    },
    categoryProperty: {
      handler(newVal) {
        this.localCategoryProperty = newVal || '';
      },
      immediate: true
    },
    xProperty: {
      handler(newVal) {
        this.localXProperty = newVal || '';
      },
      immediate: true
    },
    yProperty: {
      handler(newVal) {
        this.localYProperty = newVal || '';
      },
      immediate: true
    },
    rProperty: {
      handler(newVal) {
        this.localRProperty = newVal || '';
      },
      immediate: true
    }
  },
  methods: {
    // 处理数据集变化
    handleDatasetChange() {

      // 清空属性选择
      this.localCategoryProperty = '';
      this.localXProperty = '';
      this.localYProperty = '';
      this.localRProperty = '';

      // 通知父组件更新配置
      this.$emit('update-dataset', {
        datasetName: this.localDatasetName,
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
.chart-dataset-bob{
  margin-top: 10px;
}
</style>
