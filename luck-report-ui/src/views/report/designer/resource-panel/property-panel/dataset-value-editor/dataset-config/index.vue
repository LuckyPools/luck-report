<template>
  <div>
    <!-- 数据集选择 -->
    <div class="form-group" style="margin-top: 10px">
      <label>{{ $t('property.dataset.dataset') }}：</label>
      <div class="u-inline">
        <u-select
            v-model="internalSelectedDataset"
            :clearable="true"
            style="width:300px"
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

    <!-- 属性选择 -->
    <div class="form-group">
      <label>{{ $t('property.dataset.property') }}：</label>
      <div class="u-inline">
        <u-select
            :value="internalSelectedProperty"
            :clearable="true"
            style="width:300px"
            @change="handlePropertyChange"
        >
          <u-option
              v-for="option in propertyOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
          />
        </u-select>
      </div>
    </div>

    <!-- 聚合类型选择 -->
    <div class="form-group">
      <label>{{ $t('property.dataset.aggregateType') }}：</label>
      <div class="u-inline">
        <u-select
            :value="internalSelectedAggregate"
            :clearable="true"
            style="width:150px"
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
      <u-button
          style="margin-left: 5px"
          v-show="internalSelectedAggregate === 'customgroup'"
          @click="handleCustomGroupConfig"
      >
        {{ $t('property.dataset.configCustomGroup') }}
      </u-button>
    </div>

    <!-- 排序类型选择 -->
    <div class="form-group"  v-show="internalShowSortOptions">
      <label>{{ $t('property.dataset.sortType') }}：</label>
      <div class="u-inline">
        <u-radio-group :value="internalSelectedSort" @change="handleSortChange">
          <u-radio
              v-for="option in sortOptions"
              :key="option.value"
              :label="option.value"
          >
            {{ option.label }}
          </u-radio>
        </u-radio-group>
      </div>
    </div>

    <!-- 展开方向选择 -->
    <div class="form-group" v-show="internalShowExpandOptions">
      <label>{{ $t('property.dataset.expand') }}：</label>
      <div class="u-inline">
        <u-radio-group :value="internalSelectedExpand" @change="handleExpandChange">
          <u-radio
              v-for="option in expandOptions"
              :key="option.value"
              :label="option.value"
          >
            {{ option.label }}
          </u-radio>
        </u-radio-group>
      </div>
    </div>

    <!-- 行高设置 -->
    <div class="form-group">
      <label>{{ $t('property.dataset.lineHeight') }}：</label>
      <div class="u-inline">
        <u-input-number
            :placeholder="$t('property.dataset.lineHeightTip')"
            v-model="internalLineHeight"
            @change="handleLineHeightChange"
        />
      </div>
    </div>

    <!-- 换行计算选项 -->
    <div class="form-group">
      <label>{{ $t('property.base.newLineCompute') }}：</label>
      <div class="u-inline">
        <u-radio-group :value="internalWrapCompute" @change="handleWrapComputeChange">
          <u-radio
              v-for="option in wrapComputeOptions"
              :key="option.value"
              :label="option.value"
          >
            {{ option.label }}
          </u-radio>
        </u-radio-group>
      </div>
    </div>

    <!-- 格式化输入框 -->
    <div class="form-group">
      <label>{{ $t('property.base.format') }}：</label>
      <vue-simple-suggest
          :value="internalFormat"
          :list="suggestionList"
          :filter-by-query="true"
          :placeholder="$t('property.base.formatTip')"
          class="simple-suggest"
          style="display: inline-block"
          @input="handleFormatChange"
      ></vue-simple-suggest>
    </div>

    <!-- 填充空白行选项 -->
    <div class="form-group">
      <label>{{ $t('property.base.fillBlank') }}：</label>
      <div class="u-inline">
        <u-radio-group :value="internalFillBlankRows" @change="handleFillBlankRowsChange">
          <u-radio
              v-for="option in fillBlankRowsOptions"
              :key="option.value"
              :label="option.value"
          >
            {{ option.label }}
          </u-radio>
        </u-radio-group>
      </div>
    </div>

    <!-- 行倍数 -->
    <div class="form-group" v-show="internalFillBlankRows === 'default'">
      <label>{{ $t('property.base.rowTimes') }}：</label>
      <div class="u-inline">
        <u-input-number
            v-model="internalMultiple"
            @change="handleMultipleChange"
        />
      </div>
    </div>

    <!-- 条件属性配置 -->
    <div class="form-group">
      <label>{{ $t('property.base.conditionProp') }}：</label>
      <u-button
          type="info"
          size="mini"
          icon="icon-filter"
          @click="handleConditionPropertyConfig"
      >
        {{ $t('property.base.configCondition') }}
      </u-button>
    </div>

    <!-- 自定义分组对话框组件 -->
    <CustomGroupDialog ref="customGroupDialog" />

    <!-- 属性条件对话框组件 -->
    <PropertyConditionDialog ref="propertyConditionDialog" @saveAfter="handlePropertyConditionSave" />
  </div>
</template>

<script>
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import UInputNumber from '@/components/input-number/index.vue';
import UButton from '@/components/button/index.vue';
import PropertyConditionDialog from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/index.vue';
import CustomGroupDialog from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/dataset-config/custom-group-dialog/index.vue';
import { setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import VueSimpleSuggest from 'vue-simple-suggest'
import 'vue-simple-suggest/dist/styles.css'
export default {
  name: 'DatasetConfigTab',
  components: {
    USelect,
    UOption,
    URadioGroup,
    URadio,
    UInputNumber,
    UButton,
    PropertyConditionDialog,
    CustomGroupDialog,
    VueSimpleSuggest
  },
  props: {
    datasets: {
      type: Array,
      default: () => []
    },
    currentFields: {
      type: Array,
      default: () => []
    },
    cellDef: {
      type: Object,
      default: null
    },
    context: {
      type: Object,
      required: true
    },
    rowIndex: {
      type: Number,
      default: 0
    },
    colIndex: {
      type: Number,
      default: 0
    },
    row2Index: {
      type: Number,
      default: 0
    },
    col2Index: {
      type: Number,
      default: 0
    },
    datasources: {
      type: Array,
      default: () => []
    },
    // 数据集配置相关属性
    selectedDataset: {
      type: String,
      default: ''
    },
    selectedProperty: {
      type: String,
      default: ''
    },
    selectedAggregate: {
      type: String,
      default: 'select'
    },
    selectedSort: {
      type: String,
      default: 'none'
    },
    selectedExpand: {
      type: String,
      default: 'None'
    },
    lineHeight: {
      type: [String, Number],
      default: 10
    },
    wrapCompute: {
      type: String,
      default: 'custom'
    },
    format: {
      type: String,
      default: ''
    },
    fillBlankRows: {
      type: String,
      default: 'custom'
    },
    multiple: {
      type: Number,
      default: 0
    },
    showSortOptions: {
      type: Boolean,
      default: true
    },
    showExpandOptions: {
      type: Boolean,
      default: true
    },
    // 新增属性：条件属性项
    conditionPropertyItems: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      // 内部状态，用于与外部props同步
      internalSelectedDataset: '',
      internalSelectedProperty: '',
      internalSelectedAggregate: 'select',
      internalSelectedSort: 'none',
      internalSelectedExpand: 'None',
      internalLineHeight: 10,
      internalWrapCompute: 'custom',
      internalFormat: '',
      internalFillBlankRows: 'custom',
      internalMultiple: 0,
      internalShowSortOptions: true,
      internalShowExpandOptions: true,
      isInitialized: false,
      suggestionList:[
        "yyyy/MM/dd",
        "yyyy/MM",
        "yyyy-MM",
        "yyyy",
        "yyyy-MM-dd HH:mm:ss",
        "yyyy年MM月dd日 HH:mm:ss",
        "yyyy-MM-dd",
        "yyyy年MM月dd日",
        "HH:mm",
        "HH:mm:ss",
        "#.##",
        "#.00",
        "##.##%",
        "##.00%",
        "##,###.##",
        "￥##,###.##",
        "$##,###.##",
        "0.00E00",
        "##0.0E0"
      ]
    };
  },
  computed: {
    // 为USelect组件准备的数据集选项
    datasetOptions() {
      return this.datasets.map(dataset => ({
        value: dataset.name,
        label: dataset.name
      }));
    },
    // 为USelect组件准备的属性选项
    propertyOptions() {
      return this.currentFields.map(field => ({
        value: field.name,
        label: field.name
      }));
    },
    // 为USelect组件准备的聚合类型选项
    aggregateOptions() {
      return [
        { value: 'select', label: this.$t('property.dataset.select') },
        { value: 'group', label: this.$t('property.dataset.group') },
        { value: 'customgroup', label: this.$t('property.dataset.customGroup') },
        { value: 'sum', label: this.$t('property.dataset.sum') },
        { value: 'count', label: this.$t('property.dataset.count') },
        { value: 'max', label: this.$t('property.dataset.max') },
        { value: 'min', label: this.$t('property.dataset.min') },
        { value: 'avg', label: this.$t('property.dataset.avg') }
      ];
    },
    // 为URadioGroup组件准备的排序类型选项
    sortOptions() {
      return [
        { value: 'none', label: this.$t('property.dataset.notSort') },
        { value: 'asc', label: this.$t('property.dataset.asc') },
        { value: 'desc', label: this.$t('property.dataset.desc') }
      ];
    },
    // 为URadioGroup组件准备的展开方向选项
    expandOptions() {
      return [
        { value: 'Down', label: this.$t('property.dataset.down') },
        { value: 'Right', label: this.$t('property.dataset.right') },
        { value: 'None', label: this.$t('property.dataset.noneExpand') }
      ];
    },
    // 为URadioGroup组件准备的换行计算选项
    wrapComputeOptions() {
      return [
        { value: 'default', label: this.$t('property.base.open'), title: this.$t('property.base.newLineComputeTip') },
        { value: 'custom', label: this.$t('property.base.close') }
      ];
    },
    // 为URadioGroup组件准备的填充空白行选项
    fillBlankRowsOptions() {
      return [
        { value: 'default', label: this.$t('property.base.open') },
        { value: 'custom', label: this.$t('property.base.close') }
      ];
    }
  },
  watch: {
    // 监听外部props变化，同步到内部状态
    selectedDataset(val) {
      this.internalSelectedDataset = val;
    },
    selectedProperty(val) {
      this.internalSelectedProperty = val;
    },
    selectedAggregate(val) {
      this.internalSelectedAggregate = val;
    },
    selectedSort(val) {
      this.internalSelectedSort = val;
    },
    selectedExpand(val) {
      this.internalSelectedExpand = val;
    },
    lineHeight(val) {
      this.internalLineHeight = val;
    },
    wrapCompute(val) {
      this.internalWrapCompute = val;
    },
    format(val) {
      this.internalFormat = val;
    },
    fillBlankRows(val) {
      this.internalFillBlankRows = val;
    },
    multiple(val) {
      this.internalMultiple = val;
    },
    showSortOptions(val) {
      this.internalShowSortOptions = val;
    },
    showExpandOptions(val) {
      this.internalShowExpandOptions = val;
    }
  },
  created() {
    this.initData();
  },
  mounted() {

    // 标记组件已完成初始化
    this.$nextTick(() => {
      this.isInitialized = true;
    });
  },
  methods: {

    /**
     * 初始化数据
     */
    initData(){
      this.internalSelectedDataset = this.selectedDataset;
      this.internalSelectedProperty = this.selectedProperty;
      this.internalSelectedAggregate = this.selectedAggregate;
      this.internalSelectedSort = this.selectedSort;
      this.internalSelectedExpand = this.selectedExpand;
      this.internalLineHeight = this.lineHeight;
      this.internalWrapCompute = this.wrapCompute;
      this.internalFormat = this.format;
      this.internalFillBlankRows = this.fillBlankRows;
      this.internalMultiple = this.multiple;
      this.internalShowSortOptions = this.showSortOptions;
      this.internalShowExpandOptions = this.showExpandOptions;
    },

    /**
     * 处理数据集变化
     */
    handleDatasetChange(value) {
      this.internalSelectedDataset = value;
      // 触发事件，通知父组件
      this.$emit('update:selectedDataset', this.internalSelectedDataset);
      this.$emit('dataset-change', this.internalSelectedDataset);
    },

    /**
     * 处理属性变化
     */
    handlePropertyChange(value) {
      this.internalSelectedProperty = value;
      // 触发事件，通知父组件
      this.$emit('update:selectedProperty', this.internalSelectedProperty);
      this.$emit('property-change', this.internalSelectedProperty);
    },

    /**
     * 处理聚合类型变化
     */
    handleAggregateChange(value) {
      this.internalSelectedAggregate = value;
      if (this.internalSelectedAggregate === 'sum' || this.internalSelectedAggregate === 'count' ||
          this.internalSelectedAggregate === 'max' || this.internalSelectedAggregate === 'min' ||
          this.internalSelectedAggregate === 'avg') {
        this.internalShowSortOptions = false;
        this.internalShowExpandOptions = false;
      } else {
        this.internalShowSortOptions = true;
        this.internalShowExpandOptions = true;
      }

      // 触发事件，通知父组件
      this.$emit('update:selectedAggregate', this.internalSelectedAggregate);
      this.$emit('update:showSortOptions', this.internalShowSortOptions);
      this.$emit('update:showExpandOptions', this.internalShowExpandOptions);
      this.$emit('aggregate-change', {
        aggregate: this.internalSelectedAggregate,
        showSortOptions: this.internalShowSortOptions,
        showExpandOptions: this.internalShowExpandOptions
      });
    },

    /**
     * 处理排序变化
     */
    handleSortChange(value) {
      this.internalSelectedSort = value;
      // 触发事件，通知父组件
      this.$emit('update:selectedSort', this.internalSelectedSort);
      this.$emit('sort-change', this.internalSelectedSort);
    },

    /**
     * 处理展开方向变化
     */
    handleExpandChange(value) {
      this.internalSelectedExpand = value;
      // 触发事件，通知父组件
      this.$emit('update:selectedExpand', this.internalSelectedExpand);
      this.$emit('expand-change', this.internalSelectedExpand);
    },

    /**
     * 处理行高变化
     */
    handleLineHeightChange(value) {
      this.internalLineHeight = value;
      // 触发事件，通知父组件
      this.$emit('update:lineHeight', this.internalLineHeight);
      this.$emit('line-height-change', this.internalLineHeight);
    },

    /**
     * 处理换行计算变化
     */
    handleWrapComputeChange(value) {
      this.internalWrapCompute = value;
      // 触发事件，通知父组件
      this.$emit('update:wrapCompute', this.internalWrapCompute);
      this.$emit('wrap-compute-change', this.internalWrapCompute);
    },

    /**
     * 处理格式变化
     */
    handleFormatChange(value) {
      if (!this.isInitialized) {
        return;
      }
      this.internalFormat = value;
      this.$emit('update:format', this.internalFormat);
      this.$emit('format-change', this.internalFormat);
    },

    /**
     * 处理填充空白行变化
     */
    handleFillBlankRowsChange(value) {
      this.internalFillBlankRows = value;
      // 触发事件，通知父组件
      this.$emit('update:fillBlankRows', this.internalFillBlankRows);
      this.$emit('fill-blank-rows-change', this.internalFillBlankRows);
    },

    /**
     * 处理倍数变化
     */
    handleMultipleChange(value) {
      if (!this.isInitialized) {
        return;
      }
      this.internalMultiple = value;
      // 触发事件，通知父组件
      this.$emit('update:multiple', this.internalMultiple);
      this.$emit('multiple-change', this.internalMultiple);
    },

    /**
     * 处理条件属性配置
     */
    handleConditionPropertyConfig() {
      if (!this.cellDef) return;

      const conditionPropertyItems = this.conditionPropertyItems
        ? JSON.parse(JSON.stringify(this.conditionPropertyItems))
        : [];

      this.$refs.propertyConditionDialog.show(
        this.datasources,
        this.internalSelectedDataset,
        conditionPropertyItems
      );
    },

    /**
     * 处理属性条件保存后的回调
     */
    handlePropertyConditionSave(propertyConditions) {
      // 使用深拷贝确保数据正确更新
      const updatedConditions = JSON.parse(JSON.stringify(propertyConditions));
      // 触发事件，通知父组件更新 conditionPropertyItems
      this.$emit('update:conditionPropertyItems', updatedConditions);
      this.$emit('condition-property-items-change', updatedConditions);
      setDirty();
    },

    /**
     * 处理自定义分组配置
     */
    handleCustomGroupConfig() {
      const fields = this._buildFields();
      this.$refs.customGroupDialog.show(this.cellDef, fields);
      setDirty();
    },

    /**
     * 构建字段列表
     */
    _buildFields() {
      let fields = [];
      if (this.internalSelectedDataset === '') {
        showAlert(this.$t('property.dataset.bindDatasetTip'));
        return null;
      }
      for (let ds of this.datasources) {
        let datasets = ds.datasets || [];
        for (let dataset of datasets) {
          if (dataset.name === this.internalSelectedDataset) {
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

  }
};
</script>

<style scoped>
.simple-suggest /deep/ .default-input{
  width: 268px !important;
  height: 35px;
}
</style>
