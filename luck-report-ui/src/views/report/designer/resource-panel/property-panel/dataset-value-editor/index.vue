<template>
  <div class="dataset-value-editor" ref="container">

    <u-tabs v-model="activeTab" type="button">
      <u-tab-pane :label="$t('property.dataset.datasetConfig')" index="dataset">
        <dataset-config
            :datasets="datasets"
            :current-fields="currentFields"
            :group-items="groupItems"
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
            @update-custom-group="handleUpdateCustomGroup"
        />
      </u-tab-pane>

      <u-tab-pane :label="$t('property.dataset.filterCondition')" index="condition">
        <filter-condition
          :selected-dataset="selectedDataset"
          :conditions.sync="conditions"
          :current-fields="currentFields"
          @update-filter-conditions="handleUpdateFilterConditions"
        />
      </u-tab-pane>

      <u-tab-pane :label="$t('property.dataset.mapping')" index="mapping">
        <data-mapping
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
import { deepCopy } from '@/components/utils/index.js';
import FilterCondition from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/filter-condition/index.vue';
import DataMapping from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/data-mapping/index.vue';
import DatasetConfig from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/dataset-config/index.vue';
import UTabs from '@/components/tabs/index.vue';
import UTabPane from '@/components/tabs/pane.vue';
import { mapGetters } from 'vuex';
import {getCell, setCell} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager.js';

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
    }
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    }
  },
  data() {
    return {
      activeTab: 'dataset',
      datasets: [],
      currentFields: [],
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

      // 自定义分组项
      groupItems: [],
    };
  },
  watch: {
    rowIndex: {
      immediate: true,
      handler() {
        this.loadCellData();
      }
    },
    colIndex: {
      immediate: true,
      handler() {
        this.loadCellData();
      }
    }
  },
  mounted() {
    this.loadCellData();
  },
  methods: {
    /**
     * 加载单元格数据
     */
    loadCellData() {
      this.initialized = false;

      const cellDef = getCell(this.rowIndex, this.colIndex);

      this.loadDatasets();

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
      const datasources = this.context.reportDef.datasources || [];
      for (let ds of datasources) {
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
      }

      // 初始化自定义分组项
      if (cellDef.value.groupItems) {
        this.groupItems = [...cellDef.value.groupItems];
      } else {
        this.groupItems = [];
      }

      // 触发数据集变化事件，加载字段
      this.handleDatasetChange();

      this.handleAggregateChange();
    },

    /**
     * 处理数据集变化
     */
    handleDatasetChange() {
      this.currentFields = [];

      if (this.selectedDataset) {
        const datasources = this.context.reportDef.datasources || [];
        for (let ds of datasources) {
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

      if (this.initialized) {
        this._setDatasetName(this.selectedDataset);
      }
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
      if (params && typeof params === 'object') {
        this.showSortOptions = params.showSortOptions;
        this.showExpandOptions = params.showExpandOptions;
      } else {
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

      if (this.selectedAggregate === 'group' || this.selectedAggregate === 'select') {
        this.showMappingOptions = true;
      } else {
        this.showMappingOptions = false;
      }

      if (this.initialized) {
        this._setAggregate(this.selectedAggregate);
      }
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
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (cellDef && cellDef.cellStyle) {
        const newCellDef = deepCopy(cellDef);
        newCellDef.cellStyle.lineHeight = this.lineHeight;

        const hot = TableManager.get();
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

        for (let i = this.rowIndex; i <= this.row2Index; i++) {
          for (let j = this.colIndex; j <= this.col2Index; j++) {
            const originalCellDef = getCell(i, j);
            if (originalCellDef) {
              const updatedCellDef = deepCopy(originalCellDef);
              updatedCellDef.cellStyle.lineHeight = this.lineHeight;
              setCell(i, j, updatedCellDef );
            }
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
      const hot = TableManager.get();

      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) continue;

          const newCellDef = deepCopy(cellDef);
          if (!newCellDef.cellStyle) {
            newCellDef.cellStyle = {};
          }
          newCellDef.cellStyle.wrapCompute = wrapComputeValue;
          setCell( i, j, newCellDef );
        }
      }
      setDirty();
    },

    /**
     * 处理格式变化
     */
    handleFormatChange() {
      const hot = TableManager.get();
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) continue;

          const newCellDef = deepCopy(cellDef);
          if (!newCellDef.cellStyle) {
            newCellDef.cellStyle = {};
          }
          newCellDef.cellStyle.format = this.format;
          setCell( i, j, newCellDef );
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
          const cellDef = getCell(i, j);
          if (!cellDef) continue;

          const newCellDef = deepCopy(cellDef);
          newCellDef.multiple = this.multiple;
          setCell( i, j, newCellDef );
        }
      }
      setDirty();
    },

    /**
     * 处理条件属性项变化
     */
    handleConditionPropertyItemsChange(conditionPropertyItems) {
      this.conditionPropertyItems = conditionPropertyItems;

      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const originalCellDef = getCell(i, j);
          if (originalCellDef) {
            const updatedCellDef = deepCopy(originalCellDef);
            updatedCellDef.conditionPropertyItems = conditionPropertyItems;
            setCell(i, j, updatedCellDef );
          }
        }
      }

      setDirty();
    },

    /**
     * 处理 cellDef 条件更新
     */
    handleUpdateFilterConditions(conditions) {
      this.conditions = conditions;

      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const originalCellDef = getCell(i, j);
          if (originalCellDef) {
            const updatedCellDef = deepCopy(originalCellDef);
            updatedCellDef.value.conditions = conditions;
            setCell(i, j, updatedCellDef );
          }
        }
      }
    },

    /**
     * 处理自定义分组更新
     */
    handleUpdateCustomGroup(groupItems) {
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const originalCellDef = getCell(i, j);
          if (originalCellDef) {
            const updatedCellDef = deepCopy(originalCellDef);
            updatedCellDef.value.groupItems = groupItems;
            setCell(i, j, updatedCellDef );
          }
        }
      }
    },

    /**
     * 更新表格数据
     */
    _updateTableData() {
      const hot = TableManager.get();
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = getCell(i, j);
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
          if (hot) {
            hot.setDataAtCell(cellDef.rowNumber - 1, cellDef.columnNumber - 1, data);
          }
        }
      }
    },

    /**
     * 设置数据集名称
     */
    _setDatasetName(datasetName) {
      const hot = TableManager.get();
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }
          const valueType = cellDef.value.type;
          if (valueType === 'dataset') {
            const newCellDef = deepCopy(cellDef);
            newCellDef.value.datasetName = datasetName;
            setCell( i, j, newCellDef );
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
      const hot = TableManager.get();
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }
          const valueType = cellDef.value.type;
          if (valueType === 'dataset') {
            const newCellDef = deepCopy(cellDef);
            newCellDef.value.property = property;
            setCell( i, j, newCellDef );
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
      const hot = TableManager.get();
      let none = false;
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }
          const valueType = cellDef.value.type;
          if (valueType === 'dataset') {
            const newCellDef = deepCopy(cellDef);
            newCellDef.value.aggregate = aggregate;
            if (aggregate === 'sum' || aggregate === 'count' || aggregate === 'max' ||
                aggregate === 'min' || aggregate === 'avg') {
              newCellDef.value.order = 'none';
              newCellDef.expand = 'None';
              none = true;
            }
            setCell( i, j, newCellDef );
          }
        }
      }
      if (none) {
        this.selectedSort = 'none';
        this.selectedExpand = 'None';
      }
      this._updateTableData();
      if (hot) {
        hot.render();
      }
      setDirty();
    },

    /**
     * 设置排序
     */
    _setOrder(order) {
      const hot = TableManager.get();
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }
          const valueType = cellDef.value.type;
          if (valueType === 'dataset') {
            const newCellDef = deepCopy(cellDef);
            newCellDef.value.order = order;
            setCell( i, j, newCellDef );
          }
        }
      }
      setDirty();
    },

    /**
     * 设置展开方向
     */
    _setExpand(expand) {
      const originalCellDef = getCell(this.rowIndex, this.colIndex);
      if (originalCellDef) {
        const updatedCellDef = deepCopy(originalCellDef);
        updatedCellDef.expand = expand;
        setCell( this.rowIndex,  this.colIndex,  updatedCellDef )
      }

      const hot = TableManager.get();
      if (hot) {
        hot.render();
      }
      setDirty();
    },

    /**
     * 设置填充空白行
     */
    _setFillBlankRows(value) {
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }
          const newCellDef = deepCopy(cellDef);
          newCellDef.fillBlankRows = value;
          if (!newCellDef.multiple) {
            newCellDef.multiple = 0;
          }
          setCell( i, j, newCellDef );
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
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }
          if (cellDef.value.type === 'dataset') {
            const newCellDef = deepCopy(cellDef);
            newCellDef.value.mappingType = mappingType;
            setCell( i, j, newCellDef );
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
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }
          if (cellDef.value.type === 'dataset') {
            const newCellDef = deepCopy(cellDef);
            newCellDef.value.mappingItems = mappingItems;
            setCell( i, j, newCellDef );
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
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }
          if (cellDef.value.type === 'dataset') {
            const newCellDef = deepCopy(cellDef);
            newCellDef.value.mappingDataset = mappingDataset;
            setCell( i, j, newCellDef );
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
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }
          if (cellDef.value.type === 'dataset') {
            const newCellDef = deepCopy(cellDef);
            newCellDef.value.mappingKeyProperty = mappingKeyProperty;
            setCell( i, j, newCellDef );
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
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }
          if (cellDef.value.type === 'dataset') {
            const newCellDef = deepCopy(cellDef);
            newCellDef.value.mappingValueProperty = mappingValueProperty;
            setCell( i, j, newCellDef );
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
