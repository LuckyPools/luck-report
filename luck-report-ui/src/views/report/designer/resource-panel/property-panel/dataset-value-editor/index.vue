<template>
  <div class="dataset-value-editor" ref="container">
    <u-tabs v-model="activeTab" type="button">
      <u-tab-pane :label="$t('property.dataset.datasetConfig')" index="dataset">
        <dataset-config
            :datasets="datasets"
            :current-fields="currentFields"
            :cell-def="cellDef"
            :context="context"
            :row-index="rowIndex"
            :col-index="colIndex"
            :row2-index="row2Index"
            :col2-index="col2Index"
            :datasources="datasources"
            :selected-dataset.sync="selectedDataset"
            :selected-property.sync="selectedProperty"
            :selected-aggregate.sync="selectedAggregate"
            :selected-sort.sync="selectedSort"
            :selected-expand.sync="selectedExpand"
            :line-height.sync="lineHeight"
            :wrap-compute.sync="wrapCompute"
            :format.sync="format"
            :fill-blank-rows.sync="fillBlankRows"
            :multiple.sync="multiple"
            :show-sort-options.sync="showSortOptions"
            :show-expand-options.sync="showExpandOptions"
            :condition-property-items.sync="conditionPropertyItems"
            @dataset-change="handleDatasetChange"
            @property-change="handlePropertyChange"
            @aggregate-change="handleAggregateChange"
            @sort-change="handleSortChange"
            @expand-change="handleExpandChange"
            @line-height-change="handleLineHeightChange"
            @wrap-compute-change="handleWrapComputeChange"
            @format-change="handleFormatChange"
            @fill-blank-rows-change="handleFillBlankRowsChange"
            @multiple-change="handleMultipleChange"
            @condition-property-items-change="handleConditionPropertyItemsChange"
        />
      </u-tab-pane>

      <u-tab-pane :label="$t('property.dataset.filterCondition')" index="condition">
        <filter-condition
          :selected-dataset="selectedDataset"
          :conditions.sync="conditions"
          :current-fields="currentFields"
          :cell-def="cellDef"
          @update-cell-def-conditions="handleUpdateCellDefConditions"
        />
      </u-tab-pane>

      <u-tab-pane :label="$t('property.dataset.mapping')" index="mapping">
        <data-mapping
          :cell-def="cellDef"
          :datasources="datasources"
          :datasets="datasets"
          :show-mapping-options="showMappingOptions"
          :mapping-type="mappingType"
          :mapping-items="mappingItems"
          :mapping-dataset="mappingDataset"
          :mapping-key-property="mappingKeyProperty"
          :mapping-value-property="mappingValueProperty"
          @mapping-type-change="_setMappingType"
          @mapping-items-change="_setMappingItems"
          @mapping-dataset-change="_setMappingDataset"
          @mapping-key-property-change="_setMappingKeyProperty"
          @mapping-value-property-change="_setMappingValueProperty"
        />
      </u-tab-pane>
    </u-tabs>
  </div>
</template>

<script>
import { setDirty } from '@/utils/table.js';
import FilterCondition from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/filter-condition/index.vue';
import DataMapping from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/data-mapping/index.vue';
import DatasetConfig from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/dataset-config/index.vue';
import UTabs from '@/components/tabs/index.vue';
import UTabPane from '@/components/tabs/pane.vue';

export default {
  name: 'DatasetValueEditor',
  components: {
    FilterCondition,
    DataMapping,
    DatasetConfig,
    UTabs,
    UTabPane
  },
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      activeTab: 'dataset',
      cellDef: null,
      datasources: [],
      datasets: [],
      currentFields: [],
      rowIndex: 0,
      colIndex: 0,
      row2Index: 0,
      col2Index: 0,
      initialized: false,

      // 数据集配置
      selectedDataset: '',
      selectedProperty: '',
      selectedAggregate: 'select',
      selectedSort: 'none',
      selectedExpand: 'None',
      lineHeight: '',
      wrapCompute: 'custom',
      format: '',
      fillBlankRows: 'custom',
      multiple: 0,

      // 过滤条件
      conditions: [],

      // 其他配置
      showMappingOptions: false,
      showSortOptions: true,
      showExpandOptions: true,

      // 数据映射相关属性（用于传递给子组件）
      mappingType: 'simple',
      mappingItems: [],
      mappingDataset: '',
      mappingKeyProperty: '',
      mappingValueProperty: '',

      // 条件属性项
      conditionPropertyItems: [],
    };
  },
  mounted() {

  },
  methods: {
    /**
     * 显示编辑器
     */
    show(cellDef, rowIndex, colIndex, row2Index, col2Index) {
      this.cellDef = cellDef;
      this.rowIndex = rowIndex;
      this.colIndex = colIndex;
      this.row2Index = row2Index;
      this.col2Index = col2Index;
      this.initialized = false;

      // 加载数据源
      this.datasources = this.context.reportDef.datasources || [];
      this.loadDatasets();

      // 设置初始值
      this.loadInitialValues(cellDef);

      this.$nextTick(() => {
        this.initialized = true;
      });
    },

    /**
     * 加载数据集列表
     */
    loadDatasets() {
      this.datasets = [];
      for (let ds of this.datasources) {
        let datasets = ds.datasets || [];
        for (let dataset of datasets) {
          this.datasets.push(dataset);
        }
      }
    },

    /**
     * 加载初始值
     */
    loadInitialValues(cellDef) {
      // 设置换行计算
      if (cellDef.cellStyle && cellDef.cellStyle.wrapCompute) {
        this.wrapCompute = 'default';
      } else {
        this.wrapCompute = 'custom';
      }

      // 设置行高
      if (cellDef.cellStyle && cellDef.cellStyle.lineHeight) {
        this.lineHeight = cellDef.cellStyle.lineHeight;
      } else {
        this.lineHeight = '';
      }

      // 设置格式
      if (cellDef.cellStyle && cellDef.cellStyle.format) {
        this.format = cellDef.cellStyle.format;
      } else {
        this.format = '';
      }

      // 设置填充空白行
      if (cellDef.fillBlankRows) {
        this.fillBlankRows = 'default';
        this.multiple = cellDef.multiple || 0;
      } else {
        this.fillBlankRows = 'custom';
      }

      // 设置展开方向
      if (cellDef.expand) {
        this.selectedExpand = cellDef.expand;
      } else {
        this.selectedExpand = 'None';
      }

      // 设置数据集值
      const value = cellDef.value;
      if (value) {
        this.selectedDataset = value.datasetName || '';
        this.selectedProperty = value.property || '';
        this.selectedAggregate = value.aggregate || 'select';
        this.selectedSort = value.order || 'none';

        // 设置过滤条件
        this.conditions = value.conditions || [];

        // 设置数据映射
        this.mappingType = value.mappingType || 'simple';
        this.mappingItems = value.mappingItems || [];
        this.mappingDataset = value.mappingDataset || '';
        this.mappingKeyProperty = value.mappingKeyProperty || '';
        this.mappingValueProperty = value.mappingValueProperty || '';
      }

      // 初始化条件属性项
      if (cellDef.conditionPropertyItems) {
        this.conditionPropertyItems = [...cellDef.conditionPropertyItems];
      } else {
        this.conditionPropertyItems = [];
        // 确保cellDef中有conditionPropertyItems属性
        cellDef.conditionPropertyItems = this.conditionPropertyItems;
      }

      if (!cellDef.value.groupItems) {
        this.cellDef.value.groupItems = [];
      }

      // 触发数据集变化事件，加载字段
      this.handleDatasetChange();

      this.handleAggregateChange();
    },

    /**
     * 处理数据集变化
     */
    handleDatasetChange() {
      // 清空当前字段
      this.currentFields = [];

      // 加载选中数据集的字段
      if (this.selectedDataset) {
        for (let ds of this.datasources) {
          let datasets = ds.datasets || [];
          for (let dataset of datasets) {
            if (dataset.name === this.selectedDataset) {
              this.currentFields = dataset.fields || [];
              break;
            }
          }
          if (this.currentFields.length > 0) {
            break;
          }
        }
      }

      // 更新数据集名称，无论是否初始化状态都保存
      this._setDatasetName(this.selectedDataset);
    },

    /**
     * 处理属性变化
     */
    handlePropertyChange() {
      // 更新属性，无论是否初始化状态都保存
      this._setProperty(this.selectedProperty);
    },

    /**
     * 处理聚合类型变化
     */
    handleAggregateChange(params) {
      // 如果是从子组件传递过来的参数，则更新相关状态
      if (params && typeof params === 'object') {
        this.showSortOptions = params.showSortOptions;
        this.showExpandOptions = params.showExpandOptions;
      } else {
        // 兼容直接调用的方式
        if (this.selectedAggregate === 'sum' || this.selectedAggregate === 'count' ||
            this.selectedAggregate === 'max' || this.selectedAggregate === 'min' ||
            this.selectedAggregate === 'avg') {
          this.showSortOptions = false;
          this.showExpandOptions = false;
        } else {
          this.showSortOptions = true;
          this.showExpandOptions = true;
        }
      }

      // 根据聚合类型更新映射选项显示
      if (this.selectedAggregate === 'group' || this.selectedAggregate === 'select') {
        this.showMappingOptions = true;
      } else {
        this.showMappingOptions = false;
      }

      // 更新聚合类型，无论是否初始化状态都保存
      this._setAggregate(this.selectedAggregate);
    },

    /**
     * 处理排序变化
     */
    handleSortChange() {
      // 更新排序，无论是否初始化状态都保存
      this._setOrder(this.selectedSort);
    },

    /**
     * 处理展开方向变化
     */
    handleExpandChange() {
      // 更新展开方向，无论是否初始化状态都保存
      this._setExpand(this.selectedExpand);
    },

    /**
     * 处理行高变化
     */
    handleLineHeightChange() {
      if (this.cellDef && this.cellDef.cellStyle) {
        this.cellDef.cellStyle.lineHeight = this.lineHeight;

        // 更新表格单元格样式
        const hot = this.context.hot;
        if (hot) {
          const td = hot.getCell(this.rowIndex, this.colIndex);
          if (td) {
            if (this.lineHeight === '') {
              td.style.lineHeight = '';
            } else {
              td.style.lineHeight = this.lineHeight;
            }
            hot.render();
          }
        }

        setDirty();
      }
    },

    /**
     * 处理换行计算变化
     */
    handleWrapComputeChange() {
      const wrapComputeValue = this.wrapCompute === 'default';

      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = this.context.hot.context.getCell(i, j);
          if (!cellDef) continue;

          if (!cellDef.cellStyle) {
            cellDef.cellStyle = {};
          }
          cellDef.cellStyle.wrapCompute = wrapComputeValue;
        }
      }
      setDirty();
    },

    /**
     * 处理格式变化
     */
    handleFormatChange() {
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = this.context.hot.context.getCell(i, j);
          if (!cellDef) continue;

          if (!cellDef.cellStyle) {
            cellDef.cellStyle = {};
          }
          cellDef.cellStyle.format = this.format;
        }
      }
      setDirty();
    },

    /**
     * 处理填充空白行变化
     */
    handleFillBlankRowsChange() {
      const fillBlankRowsValue = this.fillBlankRows === 'default';

      // 更新填充空白行，无论是否初始化状态都保存
      this._setFillBlankRows(fillBlankRowsValue);
    },

    /**
     * 处理倍数变化
     */
    handleMultipleChange() {
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = this.context.hot.context.getCell(i, j);
          if (!cellDef) continue;

          cellDef.multiple = this.multiple;
        }
      }
      setDirty();
    },

    /**
     * 处理条件属性项变化
     */
    handleConditionPropertyItemsChange(conditionPropertyItems) {
      // 更新本地数据
      this.conditionPropertyItems = conditionPropertyItems;

      if (this.cellDef) {
        this.cellDef.conditionPropertyItems = conditionPropertyItems;
      }

      setDirty();
    },

    /**
     * 处理cellDef条件更新
     */
    handleUpdateCellDefConditions(conditions) {
      this.conditions = conditions;
      this.cellDef.value.conditions = conditions;
    },

    /**
     * 更新表格数据
     */
    _updateTableData() {
      const hot = this.context.hot;
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = hot.context.getCell(i, j);
          if (!cellDef) {
            continue;
          }
          const value = cellDef.value;
          const valueType = value.type;
          let data = '';
          if (valueType === 'simple') {
            data = value.value;
          } else if (valueType === 'dataset') {
            data = value.datasetName + "." + value.aggregate + "(" + value.property + ")";
          } else if (valueType === 'expression') {
            data = value.value;
          }
          hot.setDataAtCell(cellDef.rowNumber - 1, cellDef.columnNumber - 1, data);
        }
      }
    },

    /**
     * 设置数据集名称
     */
    _setDatasetName(datasetName) {
      const hot = this.context.hot;
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = hot.context.getCell(i, j);
          if (!cellDef) {
            continue;
          }
          const valueType = cellDef.value.type;
          if (valueType === 'dataset') {
            cellDef.value.datasetName = datasetName;
          }
        }
      }
      this._updateTableData();
      setDirty();
    },

    /**
     * 设置属性
     */
    _setProperty(property) {
      const hot = this.context.hot;
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = hot.context.getCell(i, j);
          if (!cellDef) {
            continue;
          }
          const valueType = cellDef.value.type;
          if (valueType === 'dataset') {
            cellDef.value.property = property;
          }
        }
      }
      this._updateTableData();
      setDirty();
    },

    /**
     * 设置聚合类型
     */
    _setAggregate(aggregate) {
      const hot = this.context.hot;
      let none = false;
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = hot.context.getCell(i, j);
          if (!cellDef) {
            continue;
          }
          const valueType = cellDef.value.type;
          if (valueType === 'dataset') {
            cellDef.value.aggregate = aggregate;
            if (aggregate === 'sum' || aggregate === 'count' || aggregate === 'max' ||
                aggregate === 'min' || aggregate === 'avg') {
              cellDef.value.order = 'none';
              cellDef.expand = 'None';
              none = true;
            }
          }
        }
      }
      if (none) {
        this.selectedSort = 'none';
        this.selectedExpand = 'None';
      }
      this._updateTableData();
      hot.render();
      setDirty();
    },

    /**
     * 设置排序
     */
    _setOrder(order) {
      const hot = this.context.hot;
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = hot.context.getCell(i, j);
          if (!cellDef) {
            continue;
          }
          const valueType = cellDef.value.type;
          if (valueType === 'dataset') {
            cellDef.value.order = order;
          }
        }
      }
      setDirty();
    },

    /**
     * 设置展开方向
     */
    _setExpand(expand) {
      // 只更新当前单元格，而不是整个选区
      if (this.cellDef) {
        this.cellDef.expand = expand;
      }

      const hot = this.context.hot;
      hot.render();
      setDirty();
    },

    /**
     * 设置填充空白行
     */
    _setFillBlankRows(value) {
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = this.context.hot.context.getCell(i, j);
          if (!cellDef) {
            continue;
          }
          cellDef.fillBlankRows = value;
          if (!cellDef.multiple) {
            cellDef.multiple = 0;
          }
        }
      }
      setDirty();
    },

    /**
     * 设置映射类型
     */
    _setMappingType(mappingType) {
      this.mappingType = mappingType;
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = this.context.hot.context.getCell(i, j);
          if (!cellDef) {
            continue;
          }
          if (cellDef.value.type === 'dataset') {
            cellDef.value.mappingType = mappingType;
          }
        }
      }
      setDirty();
    },

    /**
     * 设置映射项
     */
    _setMappingItems(mappingItems) {
      this.mappingItems = mappingItems;
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = this.context.hot.context.getCell(i, j);
          if (!cellDef) {
            continue;
          }
          if (cellDef.value.type === 'dataset') {
            cellDef.value.mappingItems = mappingItems;
          }
        }
      }
      setDirty();
    },

    /**
     * 设置映射数据集
     */
    _setMappingDataset(mappingDataset) {
      this.mappingDataset = mappingDataset;
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = this.context.hot.context.getCell(i, j);
          if (!cellDef) {
            continue;
          }
          if (cellDef.value.type === 'dataset') {
            cellDef.value.mappingDataset = mappingDataset;
          }
        }
      }
      setDirty();
    },

    /**
     * 设置映射键属性
     */
    _setMappingKeyProperty(mappingKeyProperty) {
      this.mappingKeyProperty = mappingKeyProperty;
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = this.context.hot.context.getCell(i, j);
          if (!cellDef) {
            continue;
          }
          if (cellDef.value.type === 'dataset') {
            cellDef.value.mappingKeyProperty = mappingKeyProperty;
          }
        }
      }
      setDirty();
    },

    /**
     * 设置映射值属性
     */
    _setMappingValueProperty(mappingValueProperty) {
      this.mappingValueProperty = mappingValueProperty;
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = this.context.hot.context.getCell(i, j);
          if (!cellDef) {
            continue;
          }
          if (cellDef.value.type === 'dataset') {
            cellDef.value.mappingValueProperty = mappingValueProperty;
          }
        }
      }
      setDirty();
    }
  }
};
</script>

<style scoped>
</style>
