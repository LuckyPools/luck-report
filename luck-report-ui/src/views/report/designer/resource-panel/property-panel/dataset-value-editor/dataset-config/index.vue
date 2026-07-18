<template>
  <div>
    <u-form :label-width="100" labelPosition="left">
      <u-form-item class="property-label" :label="$t('property.dataset.dataset')" style="margin-top: 10px">
        <u-select
            v-model="localDataset"
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
            v-model="localProperty"
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
            v-model="localAggregate"
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
      </u-form-item>

      <u-form-item class="property-label" v-show="localAggregate === 'customgroup'">
        <u-button
            type="info"
            @click="handleCustomGroupConfig"
        >
          {{ $t('property.dataset.configCustomGroup') }}
        </u-button>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.dataset.sortType')" v-show="localShowSortOptions">
        <u-radio-group v-model="localSort" @change="handleSortChange">
          <u-radio
              v-for="option in sortOptions"
              :key="option.value"
              :label="option.value"
          >
            {{ option.label }}
          </u-radio>
        </u-radio-group>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.dataset.expand')" v-show="localShowExpandOptions">
        <u-radio-group v-model="localExpand" @change="handleExpandChange">
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
            v-model="localLineHeight"
            :min="1"
            @change="handleLineHeightChange"
        />
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.base.newLineCompute')">
        <u-radio-group v-model="localWrapCompute" @change="handleWrapComputeChange">
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
            v-model="localFormat"
            :list="suggestionList"
            :filter-by-query="true"
            :placeholder="$t('property.base.formatTip')"
            class="simple-suggest"
            @blur="handleFormatChange"
        ></vue-simple-suggest>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.base.fillBlank')">
        <u-radio-group v-model="localFillBlankRows" @change="handleFillBlankRowsChange">
          <u-radio
              v-for="option in fillBlankRowsOptions"
              :key="option.value"
              :label="option.value"
          >
            {{ option.label }}
          </u-radio>
        </u-radio-group>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.base.rowTimes')" v-show="localFillBlankRows === 'default'">
        <u-input-number
            v-model="localMultiple"
            :min="1"
            @change="handleMultipleChange"
        />
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.base.conditionProp')">
        <u-button
            type="info"
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
      :fields="fields"
      @save="handleCustomGroupSave"
    />

    <!-- 属性条件对话框组件 -->
    <PropertyConditionDialog
        ref="propertyConditionDialog"
        :visible.sync="propertyConditionDialogVisible"
        :fields="fields"
        :conditionGroups="conditionGroups"
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
    fields: {
      type: Array,
      default: () => []
    },
    groupItems: {
      type: Array,
      default: () => []
    },
    // 数据集配置相关属性
    dataset: {
      type: String,
      default: ''
    },
    property: {
      type: String,
      default: ''
    },
    aggregate: {
      type: String,
      default: 'select'
    },
    sort: {
      type: String,
      default: 'none'
    },
    expand: {
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
    conditionGroups: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      localDataset: '',
      localProperty: '',
      localAggregate: 'select',
      localSort: 'none',
      localExpand: 'None',
      localLineHeight: 10,
      localWrapCompute: 'custom',
      localFormat: '',
      localFillBlankRows: 'custom',
      localMultiple: 0,
      localShowSortOptions: true,
      localShowExpandOptions: true,
      isInitialized: false,
      propertyConditionDialogVisible: false,
      customGroupDialogVisible: false,
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
    datasetOptions() {
      return this.datasets.map(dataset => ({
        value: dataset.name,
        label: dataset.name
      }));
    },
    propertyOptions() {
      return this.fields.map(field => ({
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
    dataset(val) {
      this.localDataset = val;
    },
    property(val) {
      this.localProperty = val;
    },
    aggregate(val) {
      this.localAggregate = val;
    },
    sort(val) {
      this.localSort = val;
    },
    expand(val) {
      this.localExpand = val;
    },
    lineHeight(val) {
      this.localLineHeight = val;
    },
    wrapCompute(val) {
      this.localWrapCompute = val;
    },
    format(val) {
      this.localFormat = val;
    },
    fillBlankRows(val) {
      this.localFillBlankRows = val;
    },
    multiple(val) {
      this.localMultiple = val;
    },
    showSortOptions(val) {
      this.localShowSortOptions = val;
    },
    showExpandOptions(val) {
      this.localShowExpandOptions = val;
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
      this.localDataset = this.dataset;
      this.localProperty = this.property;
      this.localAggregate = this.aggregate;
      this.localSort = this.sort;
      this.localExpand = this.expand;
      this.localLineHeight = this.lineHeight;
      this.localWrapCompute = this.wrapCompute;
      this.localFormat = this.format;
      this.localFillBlankRows = this.fillBlankRows;
      this.localMultiple = this.multiple;
      this.localShowSortOptions = this.showSortOptions;
      this.localShowExpandOptions = this.showExpandOptions;
    },

    /**
     * 处理数据集变化
     */
    handleDatasetChange(value) {
      this.localDataset = value;
      // 触发事件，通知父组件
      this.$emit('update:dataset', this.localDataset);
      this.$emit('dataset-change', this.localDataset);
    },

    /**
     * 处理属性变化
     */
    handlePropertyChange() {
      // 触发事件，通知父组件
      this.$emit('update:property', this.localProperty);
      this.$emit('property-change', this.localProperty);
    },

    /**
     * 处理聚合类型变化
     */
    handleAggregateChange() {
      if (this.localAggregate === 'sum' || this.localAggregate === 'count' ||
          this.localAggregate === 'max' || this.localAggregate === 'min' ||
          this.localAggregate === 'avg') {
        this.localShowSortOptions = false;
        this.localShowExpandOptions = false;
      } else {
        this.localShowSortOptions = true;
        this.localShowExpandOptions = true;
      }

      // 触发事件，通知父组件
      this.$emit('update:aggregate', this.localAggregate);
      this.$emit('update:showSortOptions', this.localShowSortOptions);
      this.$emit('update:showExpandOptions', this.localShowExpandOptions);
      this.$emit('aggregate-change', {
        aggregate: this.localAggregate,
        showSortOptions: this.localShowSortOptions,
        showExpandOptions: this.localShowExpandOptions
      });
    },

    /**
     * 处理排序变化
     */
    handleSortChange(value) {
      this.localSort = value;
      // 触发事件，通知父组件
      this.$emit('update:sort', this.localSort);
      this.$emit('sort-change', this.localSort);
    },

    /**
     * 处理展开方向变化
     */
    handleExpandChange(value) {
      this.localExpand = value;
      // 触发事件，通知父组件
      this.$emit('update:expand', this.localExpand);
      this.$emit('expand-change', this.localExpand);
    },

    /**
     * 处理行高变化
     */
    handleLineHeightChange(value) {
      this.localLineHeight = value;
      // 触发事件，通知父组件
      this.$emit('update:lineHeight', this.localLineHeight);
      this.$emit('line-height-change', this.localLineHeight);
    },

    /**
     * 处理换行计算变化
     */
    handleWrapComputeChange() {
      this.$emit('update:wrapCompute', this.localWrapCompute);
      this.$emit('wrap-compute-change', this.localWrapCompute);
    },

    /**
     * 处理格式变化
     */
    handleFormatChange() {
      if (!this.isInitialized) {
        return;
      }
      this.$emit('update:format', this.localFormat);
      this.$emit('format-change', this.localFormat);
    },

    /**
     * 处理填充空白行变化
     */
    handleFillBlankRowsChange() {
      // 触发事件，通知父组件
      this.$emit('update:fillBlankRows', this.localFillBlankRows);
      this.$emit('fill-blank-rows-change', this.localFillBlankRows);
    },

    /**
     * 处理倍数变化
     */
    handleMultipleChange() {
      if (!this.isInitialized) {
        return;
      }
      // 触发事件，通知父组件
      this.$emit('update:multiple', this.localMultiple);
      this.$emit('multiple-change', this.localMultiple);
    },

    /**
     * 处理条件属性配置
     */
    handleConditionPropertyConfig() {
      this.propertyConditionDialogVisible = true;
    },

    /**
     * 处理属性条件保存后的回调
     */
    handlePropertyConditionSave(conditionGroups) {
      this.$emit('update:conditionGroups', conditionGroups);
      this.$emit('condition-groups-change', conditionGroups);
      setDirty();
    },

    /**
     * 处理自定义分组配置
     */
    handleCustomGroupConfig() {
      if (this.fields.length === 0) {
        showAlert(this.$t('property.dataset.bindDatasetTip'));
        return;
      }
      this.customGroupDialogVisible = true;
      setDirty();
    },

    /**
     * 处理自定义分组保存
     */
    handleCustomGroupSave(groupItems) {
      this.$emit('update-custom-group', groupItems);
      setDirty();
    }

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
