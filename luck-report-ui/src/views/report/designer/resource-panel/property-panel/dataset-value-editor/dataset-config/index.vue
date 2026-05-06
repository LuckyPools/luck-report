<template>
  <div>
    <u-form :label-width="100" labelPosition="left">
      <u-form-item class="property-label" :label="$t('property.dataset.dataset')" style="margin-top: 10px">
        <u-select
            v-model="internalSelectedDataset"
            :clearable="true"
            style="width:250px"
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

      <u-form-item class="property-label" :label="$t('property.dataset.property')">
        <u-select
            v-model="internalSelectedProperty"
            :clearable="true"
            style="width:250px"
            @change="handlePropertyChange"
        >
          <u-option
              v-for="option in propertyOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
          />
        </u-select>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.dataset.aggregateType')">
        <u-select
            v-model="internalSelectedAggregate"
            :clearable="true"
            style="width:250px"
            @change="handleAggregateChange"
        >
          <u-option
              v-for="option in aggregateOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
          />
        </u-select>
        <u-button
            style="margin-left: 5px"
            v-show="internalSelectedAggregate === 'customgroup'"
            @click="handleCustomGroupConfig"
        >
          {{ $t('property.dataset.configCustomGroup') }}
        </u-button>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.dataset.sortType')" v-show="internalShowSortOptions">
        <u-radio-group v-model="internalSelectedSort" @change="handleSortChange">
          <u-radio
              v-for="option in sortOptions"
              :key="option.value"
              :label="option.value"
          >
            {{ option.label }}
          </u-radio>
        </u-radio-group>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.dataset.expand')" v-show="internalShowExpandOptions">
        <u-radio-group :value="internalSelectedExpand" @change="handleExpandChange">
          <u-radio
              v-for="option in expandOptions"
              :key="option.value"
              :label="option.value"
          >
            {{ option.label }}
          </u-radio>
        </u-radio-group>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.dataset.lineHeight')">
        <u-input-number
            :placeholder="$t('property.dataset.lineHeightTip')"
            v-model="internalLineHeight"
            @change="handleLineHeightChange"
        />
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.base.newLineCompute')">
        <u-radio-group v-model="internalWrapCompute" @change="handleWrapComputeChange">
          <u-radio
              v-for="option in wrapComputeOptions"
              :key="option.value"
              :label="option.value"
          >
            {{ option.label }}
          </u-radio>
        </u-radio-group>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.base.format')">
        <vue-simple-suggest
            :value="internalFormat"
            :list="suggestionList"
            :filter-by-query="true"
            :placeholder="$t('property.base.formatTip')"
            class="simple-suggest"
            @input="handleFormatChange"
        ></vue-simple-suggest>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.base.fillBlank')">
        <u-radio-group v-model="internalFillBlankRows" @change="handleFillBlankRowsChange">
          <u-radio
              v-for="option in fillBlankRowsOptions"
              :key="option.value"
              :label="option.value"
          >
            {{ option.label }}
          </u-radio>
        </u-radio-group>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.base.rowTimes')" v-show="internalFillBlankRows === 'default'">
        <u-input-number
            v-model="internalMultiple"
            @change="handleMultipleChange"
        />
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.base.conditionProp')">
        <u-button
            type="info"
            size="mini"
            icon="icon-filter"
            @click="handleConditionPropertyConfig"
        >
          {{ $t('property.base.configCondition') }}
        </u-button>
      </u-form-item>
    </u-form>

    <!-- 自定义分组对话框组件 -->
    <CustomGroupDialog
      :visible.sync="customGroupDialogVisible"
      :group-items="groupItems"
      :fields="customGroupDialogFields"
      @save="handleCustomGroupSave"
    />

    <!-- 属性条件对话框组件 -->
    <PropertyConditionDialog
        ref="propertyConditionDialog"
        :visible.sync="propertyConditionDialogVisible"
        :dataset-name="propertyConditionDialogDatasetName"
        :condition-property-items="propertyConditionDialogItems"
        @saveAfter="handlePropertyConditionSave"
    />
  </div>
</template>

<script>
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import UInputNumber from '@/components/input-number/index.vue';
import UButton from '@/components/button/index.vue';
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import PropertyConditionDialog from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/index.vue';
import CustomGroupDialog from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/dataset-config/custom-group-dialog/index.vue';
import { setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import VueSimpleSuggest from 'vue-simple-suggest'
import 'vue-simple-suggest/dist/styles.css'
import { mapGetters } from 'vuex';

export default {
  name: 'DatasetConfigTab',
  components: {
    USelect,
    UOption,
    URadioGroup,
    URadio,
    UInputNumber,
    UButton,
    UForm,
    UFormItem,
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
    groupItems: {
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
      propertyConditionDialogVisible: false,
      propertyConditionDialogDatasetName: '',
      propertyConditionDialogItems: [],
      customGroupDialogVisible: false,
      customGroupDialogFields: null,
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
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    },
    datasources() {
      return this.context.reportDef.datasources || [];
    },
    datasetOptions() {
      return this.datasets.map(dataset => ({
        value: dataset.name,
        label: dataset.name
      }));
    },
    propertyOptions() {
      return this.currentFields.map(field => ({
        value: field.name,
        label: field.name
      }));
    },
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
    sortOptions() {
      return [
        { value: 'none', label: this.$t('property.dataset.notSort') },
        { value: 'asc', label: this.$t('property.dataset.asc') },
        { value: 'desc', label: this.$t('property.dataset.desc') }
      ];
    },
    expandOptions() {
      return [
        { value: 'Down', label: this.$t('property.dataset.down') },
        { value: 'Right', label: this.$t('property.dataset.right') },
        { value: 'None', label: this.$t('property.dataset.noneExpand') }
      ];
    },
    wrapComputeOptions() {
      return [
        { value: 'default', label: this.$t('property.base.open'), title: this.$t('property.base.newLineComputeTip') },
        { value: 'custom', label: this.$t('property.base.close') }
      ];
    },
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
    handlePropertyChange() {
      // 触发事件，通知父组件
      this.$emit('update:selectedProperty', this.internalSelectedProperty);
      this.$emit('property-change', this.internalSelectedProperty);
    },

    /**
     * 处理聚合类型变化
     */
    handleAggregateChange() {
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
    handleWrapComputeChange() {
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
    handleFillBlankRowsChange() {
      // 触发事件，通知父组件
      this.$emit('update:fillBlankRows', this.internalFillBlankRows);
      this.$emit('fill-blank-rows-change', this.internalFillBlankRows);
    },

    /**
     * 处理倍数变化
     */
    handleMultipleChange() {
      if (!this.isInitialized) {
        return;
      }
      // 触发事件，通知父组件
      this.$emit('update:multiple', this.internalMultiple);
      this.$emit('multiple-change', this.internalMultiple);
    },

    /**
     * 处理条件属性配置
     */
    handleConditionPropertyConfig() {
      const conditionPropertyItems = this.conditionPropertyItems
        ? deepCopy(this.conditionPropertyItems)
        : [];

      this.propertyConditionDialogDatasetName = this.internalSelectedDataset;
      this.propertyConditionDialogItems = conditionPropertyItems;
      this.propertyConditionDialogVisible = true;
    },

    /**
     * 处理属性条件保存后的回调
     */
    handlePropertyConditionSave(propertyConditions) {
      const updatedConditions = deepCopy(propertyConditions);
      this.$emit('update:conditionPropertyItems', updatedConditions);
      this.$emit('condition-property-items-change', updatedConditions);
      setDirty();
    },

    /**
     * 处理自定义分组配置
     */
    handleCustomGroupConfig() {
      const fields = this._buildFields();
      if (fields) {
        this.customGroupDialogFields = fields;
        this.customGroupDialogVisible = true;
      }
      setDirty();
    },

    /**
     * 处理自定义分组保存
     */
    handleCustomGroupSave(groupItems) {
      this.$emit('update-custom-group', groupItems);
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
  width: 250px !important;
  height: 35px;
  display: inline-block;
}
</style>
