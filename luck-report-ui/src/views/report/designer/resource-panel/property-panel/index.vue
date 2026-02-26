<template>
  <div class="property-panel">
    <!-- 父单元格配置 -->
    <div v-show="showParentGroup" ref="parentGroup">
      <div class="form-group" style="margin-bottom:6px">
        <label>{{ $t('property.prop.leftParent') }}：</label>
        <div class="u-inline">
          <u-radio-group
              v-model="leftParentType"
              @change="handleLeftParentTypeChange"
          >
            <u-radio
                v-for="option in parentTypeOptions"
                :key="option.value"
                :label="option.value"
            >
              {{ option.label }}
            </u-radio>
          </u-radio-group>
        </div>
        <div>
          <div class="u-inline">
            <u-select
                v-model="leftParentCellName"
                :clearable="true"
                :disabled="leftParentType !== 'custom'"
                @change="handleLeftParentCellNameChange"
                style="margin-left:10px;width: 100px"
            >
              <u-option
                  v-for="option in leftParentCellNameOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
              />
            </u-select>
          </div>
          <div class="u-inline">
            <u-select
                v-model="leftParentRowNumber"
                :clearable="true"
                :disabled="leftParentType !== 'custom' || leftParentCellName === 'root'"
                @change="handleLeftParentRowNumberChange"
                style="margin-left:10px;width: 100px"
            >
              <u-option
                  v-for="option in leftParentRowNumberOptionsFormatted"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
              />
            </u-select>
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:6px">
        <label>{{ $t('property.prop.topParent') }}：</label>
        <div class="u-inline">
          <u-radio-group
              v-model="topParentType"
              @change="handleTopParentTypeChange"
          >
            <u-radio
                v-for="option in parentTypeOptions"
                :key="option.value"
                :label="option.value"
            >
              {{ option.label }}
            </u-radio>
          </u-radio-group>
        </div>
        <div>
          <div class="u-inline">
            <u-select
                v-model="topParentCellName"
                :disabled="topParentType !== 'custom'"
                :clearable="true"
                @change="handleTopParentCellNameChange"
                style="margin-left:10px;width: 100px"
            >
              <u-option
                  v-for="option in topParentCellNameOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
              />
            </u-select>
          </div>
          <div class="u-inline">
            <u-select
                v-model="topParentRowNumber"
                :clearable="true"
                :disabled="topParentType !== 'custom' || topParentCellName === 'root'"
                @change="handleTopParentRowNumberChange"
                style="margin-left:10px;width: 100px"
            >
              <u-option
                  v-for="option in topParentRowNumberOptionsFormatted"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
              />
            </u-select>
          </div>
        </div>
      </div>
    </div>

    <!-- 渲染器配置 -->
    <div v-show="showRendererGroup" ref="rendererGroup" class="form-group" style="margin-bottom:6px">
      <label>{{ $t('property.prop.renderBean') }}：</label>
      <div class="input-group" style="width: 290px;display: inline-block;height: 22px;">
        <div class="u-inline">
          <u-input
            v-model="rendererBean"
            style="width: 204px"
            @change="handleRendererChange"
          />
        </div>
        <span class="input-group-btn">
          <u-button @click="handleSelectRenderer">
            {{ $t('property.prop.selectBean') }}
          </u-button>
        </span>
      </div>
    </div>

    <!-- 链接配置 -->
    <fieldset v-show="showLinkGroup" ref="linkGroup" class="link-fieldset">
      <legend class="link-legend">
        {{ $t('property.prop.linkConfig') }}
      </legend>
      <div class="form-group" style="margin-bottom:8px">
        <label>URL(<span style="font-size: 12px;color: #747474" :title="$t('property.prop.urlExpressionTip')">{{ $t('property.prop.urlExpressionSupport') }}</span>)：</label>
        <div class="u-inline">
          <u-input
            v-model="linkUrl"
            :placeholder="$t('property.prop.urlExpressionExample')"
            style="width: 360px;"
            @change="handleLinkUrlChange"
          />
        </div>
      </div>
      <div class="form-group" style="margin-bottom:0px">
        <label>{{ $t('property.prop.target') }}：</label>
        <div class="u-inline">
          <u-select
            :value="linkTarget"
            :clearable="true"
            @change="handleLinkTargetChange"
            style="width: 120px"
          >
            <u-option
              v-for="option in linkTargetOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </u-select>
        </div>
        <u-button
          type="primary"
          style="margin-left: 10px;"
          @click="handleUrlParameterConfig"
        >
          {{ $t('property.prop.urlParameterConfig') }}
        </u-button>
      </div>
    </fieldset>

    <!-- 单元格类型 -->
    <div v-show="showTypeGroup" ref="typeGroup" class="form-group" style="margin-bottom:10px;margin-top: 10px;">
      <label>{{ $t('property.prop.cellType') }}：</label>
      <div class="u-inline">
          <u-select
            :value="cellType"
            :clearable="true"
            @change="handleCellTypeChange"
          >
            <u-option
              v-for="option in cellTypeOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </u-select>
        </div>
    </div>

    <!-- 表达式值编辑器Vue组件 -->
    <expression-value-editor
      ref="expressionValueEditor"
      :context="getContext()"
      v-show="currentEditorType === 'expression'"
    />

    <!-- 简单值编辑器Vue组件 -->
    <simple-value-editor
      ref="simpleValueEditor"
      :context="getContext()"
      v-show="currentEditorType === 'simple'"
    />

    <!-- 数据集值编辑器Vue组件 -->
    <dataset-value-editor
      ref="datasetValueEditor"
      :context="getContext()"
      v-show="currentEditorType === 'dataset'"
    />

    <!-- 图片值编辑器Vue组件 -->
    <image-value-editor
      ref="imageValueEditor"
      :context="getContext()"
      v-show="currentEditorType === 'image'"
    />

    <!-- 斜线值编辑器Vue组件 -->
    <slash-value-editor
      ref="slashValueEditor"
      :context="getContext()"
      v-show="currentEditorType === 'slash'"
    />

    <!-- 二维码/条形码值编辑器Vue组件 -->
    <zxing-value-editor
      ref="zxingValueEditor"
      :context="getContext()"
      v-show="currentEditorType === 'zxing'"
    />

    <!-- 图表编辑器容器 -->
    <div ref="chartEditorContainer">
      <chart-value-editor
        ref="chartEditor"
        v-for="(chartType, index) in chartEditorTypes"
        :key="index"
        :id="chartType.id"
        :context="getContext()"
        :show-axis="chartType.showAxis"
        v-show="currentChartType === chartType.id"
      />
      <bubble-chart-value-editor
        ref="bubbleChartEditor"
        :context="getContext()"
        v-show="currentChartType === 'bubble'"
      />
      <scatter-chart-value-editor
        ref="scatterChartEditor"
        :context="getContext()"
        v-show="currentChartType === 'scatter'"
      />
    </div>

    <!-- URL参数对话框 -->
    <URLParameterDialog ref="urlParameterDialog" />
  </div>
</template>

<script>
import store from '@/store';
import { setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import URLParameterDialog from '@/views/report/designer/resource-panel/property-panel/url-parameter-dialog/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import UInput from '@/components/input/index.vue';
import UButton from '@/components/button/index.vue';

// 导入各种值编辑器
import ExpressionValueEditor from './expression-value-editor/index.vue';
import SimpleValueEditor from './simple-value-editor/index.vue';
import DatasetValueEditor from './dataset-value-editor/index.vue';
import ImageValueEditor from './image-value-editor/index.vue';
import SlashValueEditor from './slash-value-editor/index.vue';
import ZxingValueEditor from './zxing-value-editor/index.vue';

// 导入图表编辑器组件
import ChartValueEditor from './chart-value-editor/index.vue';
import BubbleChartValueEditor from './bubble-chart-value-editor/index.vue';
import ScatterChartValueEditor from './scatter-chart-value-editor/index.vue';
import CrossTabWidget from '@/views/report/designer/edit-table/cross-tab-widget/class.js';

export default {
  name: 'PropertyPanel',
  components: {
    SimpleValueEditor,
    ExpressionValueEditor,
    DatasetValueEditor,
    ImageValueEditor,
    SlashValueEditor,
    ZxingValueEditor,
    ChartValueEditor,
    BubbleChartValueEditor,
    ScatterChartValueEditor,
    URLParameterDialog,
    USelect,
    UOption,
    URadioGroup,
    URadio,
    UInput,
    UButton
  },
  data() {
    return {
      // 显示控制
      showParentGroup: false,
      showRendererGroup: false,
      showLinkGroup: false,
      showTypeGroup: false,

      // 当前单元格信息
      cellDef: null,
      rowIndex: 0,
      colIndex: 0,
      row2Index: 0,
      col2Index: 0,
      initialized: false,

      // 父单元格配置
      leftParentType: 'default',
      leftParentCellName: '',
      leftParentRowNumber: '',
      leftParentCellNameOptions: [],
      leftParentRowNumberOptions: [],

      topParentType: 'default',
      topParentCellName: '',
      topParentRowNumber: '',
      topParentCellNameOptions: [],
      topParentRowNumberOptions: [],

      // 渲染器配置
      rendererBean: '',

      // 链接配置
      linkUrl: '',
      linkTarget: '_blank',

      // 单元格类型
      cellType: 'simple',

      // 编辑器映射
      editorMap: new Map(),
      chartEditorMap: new Map(),

      // 图表编辑器类型配置
      chartEditorTypes: [
        { id: 'bar', showAxis: true },
        { id: 'line', showAxis: true },
        { id: 'horbar', showAxis: true },
        { id: 'area', showAxis: true },
        { id: 'radar', showAxis: false },
        { id: 'polar', showAxis: false },
        { id: 'doughnut', showAxis: false },
        { id: 'pie', showAxis: false }
      ],

      // 当前显示的图表类型
      currentChartType: '',

      // 当前显示的编辑器类型
      currentEditorType: ''
    };
  },
  computed: {
    parentTypeOptions() {
      return [
        { label: this.$t('property.prop.default'), value: 'default' },
        { label: this.$t('property.prop.custom'), value: 'custom' }
      ];
    },
    leftParentRowNumberOptionsFormatted() {
      return this.leftParentRowNumberOptions.map(num => ({
        label: num,
        value: num.toString()
      }));
    },
    topParentRowNumberOptionsFormatted() {
      return this.topParentRowNumberOptions.map(num => ({
        label: num,
        value: num.toString()
      }));
    },
    linkTargetOptions() {
      return [
        { label: this.$t('property.prop.newWindow'), value: '_blank' },
        { label: this.$t('property.prop.currentWindow'), value: '_self' },
        { label: this.$t('property.prop.parentWindow'), value: '_parent' },
        { label: this.$t('property.prop.topWindow'), value: '_top' }
      ];
    },
    cellTypeOptions() {
      return [
        { label: this.$t('property.prop.text'), value: 'simple' },
        { label: this.$t('property.prop.expr'), value: 'expression' },
        { label: this.$t('property.prop.dataset'), value: 'dataset' },
        { label: this.$t('property.prop.image'), value: 'image' },
        { label: this.$t('property.prop.slash'), value: 'slash' },
        { label: this.$t('property.prop.qrcode'), value: 'qrcode' },
        { label: this.$t('property.prop.barcode'), value: 'barcode' },
        { label: this.$t('property.prop.chart'), value: 'chart' }
      ];
    }
  },
  mounted() {
  },
  methods: {

    /**
     * 刷新属性面板
     */
    refresh(rowIndex, colIndex, row2Index, col2Index) {
      const cellDef = this.getContext().getCell(rowIndex, colIndex);
      if (!cellDef) {
        return;
      }

      this.cellDef = cellDef;
      this.rowIndex = rowIndex;
      this.colIndex = colIndex;
      this.row2Index = row2Index;
      this.col2Index = col2Index;

      // 显示所有组
      this.showParentGroup = true;
      this.showTypeGroup = true;
      this.showLinkGroup = true;
      // this.showRendererGroup = true; // 暂时隐藏

      this.initialized = true;

      // 加载链接配置
      this.linkUrl = cellDef.linkUrl || '';
      this.linkTarget = cellDef.linkTargetWindow || '_blank';

      // 构建父单元格选项
      this.buildParentCellNameOptions();
      this.buildParentRowNumberOptions();

      // 加载父单元格配置
      this.loadParentCellConfig();

      // 加载渲染器配置
      const cellStyle = cellDef.cellStyle;
      if (cellStyle && cellStyle.renderer) {
        this.rendererBean = cellStyle.renderer;
      } else {
        this.rendererBean = "";
      }

      // 加载单元格类型
      let type = cellDef.value.type || 'simple';
      if (type === 'zxing') {
        const category = cellDef.value.category;
        this.cellType = category;
      } else {
        this.cellType = type;
      }

      // 隐藏Vue组件编辑器
      this.currentChartType = '';
      this.currentEditorType = '';

      // 显示对应编辑器
      if (type === 'chart') {
        const chartType = cellDef.value.chart.dataset.type;
        console.log('---------当前单元格类型为：' + chartType);

        // 处理特殊图表类型映射
        let actualChartType = chartType;
        if (chartType === 'horizontalBar') {
          actualChartType = 'horbar';
        } else if (chartType === 'polarArea') {
          actualChartType = 'polar';
        }

        // 检查是否是散点图或气泡图
        if (chartType === 'scatter') {
          // 使用Vue组件显示散点图编辑器
          this.currentChartType = 'scatter';
          // 等待组件渲染完成后调用show方法
          this.$nextTick(() => {
            if (this.$refs.scatterChartEditor) {
              this.$refs.scatterChartEditor.show(cellDef, rowIndex, colIndex, row2Index, col2Index);
            }
          });
        } else if (chartType === 'bubble') {
          // 使用Vue组件显示气泡图编辑器
          this.currentChartType = 'bubble';
          // 等待组件渲染完成后调用show方法
          this.$nextTick(() => {
            if (this.$refs.bubbleChartEditor) {
              this.$refs.bubbleChartEditor.show(cellDef, rowIndex, colIndex, row2Index, col2Index);
            }
          });
        } else {
          // 使用Vue组件显示图表编辑器
          this.currentChartType = actualChartType;

          // 等待组件渲染完成后调用show方法
          this.$nextTick(() => {
            const chartEditor = this.$refs.chartEditor;
            if (chartEditor && chartEditor.length > 0) {
              // 找到对应类型的编辑器组件
              const editor = chartEditor.find(editor => editor.id === actualChartType);
              if (editor) {
                editor.show(cellDef, rowIndex, colIndex, row2Index, col2Index);
              }
            }
          });
        }
      } else {
        this.currentChartType = '';

        // 处理简单类型编辑器
        if (type === 'simple') {
          this.currentEditorType = 'simple';
          // 等待组件渲染完成后调用show方法
          this.$nextTick(() => {
            if (this.$refs.simpleValueEditor) {
              this.$refs.simpleValueEditor.show(cellDef, rowIndex, colIndex, row2Index, col2Index);
            }
          });
        } else if (type === 'expression') {
          this.currentEditorType = 'expression';
          // 等待组件渲染完成后调用show方法
          this.$nextTick(() => {
            if (this.$refs.expressionValueEditor) {
              this.$refs.expressionValueEditor.show(cellDef, rowIndex, colIndex, row2Index, col2Index);
            }
          });
        } else if (type === 'dataset') {
          // 使用Vue组件显示数据集值编辑器
          this.currentEditorType = 'dataset';
          // 等待组件渲染完成后调用show方法
          this.$nextTick(() => {
            if (this.$refs.datasetValueEditor) {
              this.$refs.datasetValueEditor.show(cellDef, rowIndex, colIndex, row2Index, col2Index);
            }
          });
        } else if (type === 'image') {
          // 使用Vue组件显示图片值编辑器
          this.currentEditorType = 'image';
          // 等待组件渲染完成后调用show方法
          this.$nextTick(() => {
            if (this.$refs.imageValueEditor) {
              this.$refs.imageValueEditor.show(cellDef, rowIndex, colIndex, row2Index, col2Index);
            }
          });
        } else if (type === 'slash') {
          // 使用Vue组件显示斜线值编辑器
          this.currentEditorType = 'slash';
          // 等待组件渲染完成后调用show方法
          this.$nextTick(() => {
            if (this.$refs.slashValueEditor) {
              this.$refs.slashValueEditor.show(cellDef, rowIndex, colIndex, row2Index, col2Index);
            }
          });
        } else if (type === 'zxing') {
          // 使用Vue组件显示二维码/条形码值编辑器
          this.currentEditorType = 'zxing';
          // 等待组件渲染完成后调用show方法
          this.$nextTick(() => {
            if (this.$refs.zxingValueEditor) {
              this.$refs.zxingValueEditor.show(cellDef, rowIndex, colIndex, row2Index, col2Index);
            }
          });
        } else {
          // 其他类型的编辑器
          this.editorMap.get(type).show(cellDef, rowIndex, colIndex, row2Index, col2Index);
        }
      }

      this.initialized = false;
    },

    /**
     *
     */
    refreshProperty(){
      const cellDef = this.getContext().getCell(this.rowIndex, this.colIndex);
      if(this.cellType !== cellDef.value.type){
        this.refresh(this.rowIndex, this.colIndex, this.row2Index, this.col2Index)
      }
    },

    /**
     * 构建父单元格名称选项
     */
    buildParentCellNameOptions() {
      const hot = this.getContext().hot;
      const countCols = hot.countCols();

      this.leftParentCellNameOptions = [{ value: 'root', label: this.$t('property.prop.none') }];
      this.topParentCellNameOptions = [{ value: 'root', label: this.$t('property.prop.none') }];

      for (let j = 0; j < countCols; j++) {
        let name = this.getContext().getCellName(null, j);
        this.leftParentCellNameOptions.push({ value: name, label: name });
        this.topParentCellNameOptions.push({ value: name, label: name });
      }
    },

    /**
     * 构建父行号选项
     */
    buildParentRowNumberOptions() {
      const hot = this.getContext().hot;
      const countRows = hot.countRows();

      this.leftParentRowNumberOptions = [];
      this.topParentRowNumberOptions = [];

      for (let j = 0; j < countRows; j++) {
        this.leftParentRowNumberOptions.push(j + 1);
        this.topParentRowNumberOptions.push(j + 1);
      }
    },

    /**
     * 加载父单元格配置
     */
    loadParentCellConfig() {
      // 左侧父单元格
      const leftParentCellName = this.cellDef.leftParentCellName;
      if (leftParentCellName) {
        this.leftParentType = 'custom';
        if (leftParentCellName === 'root') {
          this.leftParentCellName = 'root';
          this.leftParentRowNumber = '';
        } else {
          let data = this.parseCellName(leftParentCellName);
          this.leftParentCellName = data.name;
          this.leftParentRowNumber = data.num;
        }
      } else {
        this.leftParentType = 'default';
        if (this.colIndex === 0) {
          this.leftParentCellName = 'root';
          this.leftParentRowNumber = '';
        } else {
          let row = this.rowIndex, col = this.colIndex - 1;
          let td = this.getContext().hot.getCell(row, col);
          // 处理合并单元格的情况
          if (this.isCellHidden(td)) {
            let mergeCells = this.getContext().hot.getSettings().mergeCells;
            for (let item of mergeCells) {
              let rowStart = item.row, rowspan = item.rowspan, colStart = item.col, colspan = item.colspan;
              let rowEnd = rowStart + rowspan - 1, colEnd = colStart + colspan - 1;
              if (row >= rowStart && row <= rowEnd && col >= colStart && col <= colEnd) {
                row = rowStart;
                col = colStart;
                break;
              }
            }
          }
          let cellName = this.getContext().getCellName(row, col);
          let data = this.parseCellName(cellName);
          this.leftParentCellName = data.name;
          this.leftParentRowNumber = data.num;
        }
      }

      // 顶部父单元格
      const topParentCellName = this.cellDef.topParentCellName;
      if (topParentCellName) {
        this.topParentType = 'custom';
        if (topParentCellName === 'root') {
          this.topParentCellName = 'root';
          this.topParentRowNumber = '';
        } else {
          let data = this.parseCellName(topParentCellName);
          this.topParentCellName = data.name;
          this.topParentRowNumber = data.num;
        }
      } else {
        this.topParentType = 'default';
        if (this.rowIndex === 0) {
          this.topParentCellName = 'root';
          this.topParentRowNumber = '';
        } else {
          let row = this.rowIndex - 1, col = this.colIndex;
          let td = this.getContext().hot.getCell(row, col);
          // 处理合并单元格的情况
          if (this.isCellHidden(td)) {
            let mergeCells = this.getContext().hot.getSettings().mergeCells;
            for (let item of mergeCells) {
              let rowStart = item.row, rowspan = item.rowspan, colStart = item.col, colspan = item.colspan;
              let rowEnd = rowStart + rowspan - 1, colEnd = colStart + colspan - 1;
              if (row >= rowStart && row <= rowEnd && col >= colStart && col <= colEnd) {
                row = rowStart;
                col = colStart;
                break;
              }
            }
          }
          let cellName = this.getContext().getCellName(row, col);
          let data = this.parseCellName(cellName);
          this.topParentCellName = data.name;
          this.topParentRowNumber = data.num;
        }
      }
    },

    /**
     * 检查单元格是否隐藏
     */
    isCellHidden(td) {
      return td && td.style && td.style.display === 'none';
    },

    /**
     * 解析单元格名称
     */
    parseCellName(cellName) {
      let pos = -1;
      for (let i = 0; i < cellName.length; i++) {
        let char = cellName.charAt(i);
        let num = parseInt(char);
        if (!isNaN(num)) {
          pos = i;
          break;
        }
      }
      const name = cellName.substring(0, pos);
      const num = cellName.substring(pos, cellName.length);
      return { name, num: num.toString() }; // 确保返回的num是字符串类型
    },

    /**
     * 设置父单元格
     */
    setParentCell(cellName, isLeft) {
      if (this.initialized) {
        return;
      }
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = this.getContext().getCell(i, j);
          if (!cellDef) {
            continue;
          }
          if (isLeft) {
            if (cellName) {
              cellDef.leftParentCellName = cellName;
            } else {
              cellDef.leftParentCellName = null;
            }
          } else {
            if (cellName) {
              cellDef.topParentCellName = cellName;
            } else {
              cellDef.topParentCellName = null;
            }
          }
        }
      }
      setDirty();
    },

    /**
     * 设置渲染器
     */
    setRenderer(renderer) {
      if (this.initialized) {
        return;
      }
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = this.getContext().getCell(i, j);
          if (!cellDef) {
            continue;
          }
          cellDef.renderer = renderer;
        }
      }
      setDirty();
    },

    // 事件处理方法
    handleLeftParentTypeChange(value) {
      this.leftParentType = value;
      if (this.leftParentType === 'default') {
        this.setParentCell(null, true);
      }
    },

    handleLeftParentCellNameChange(value) {
      this.leftParentCellName = value;
      const name = this.leftParentCellName;
      if (name === 'root') {
        this.leftParentRowNumber = '';
        this.setParentCell('root', true);
      } else {
        const num = this.leftParentRowNumber;
        if (name !== '' && num !== '') {
          this.setParentCell(name + num.toString(), true);
        }
      }
    },

    handleLeftParentRowNumberChange() {
      const name = this.leftParentCellName;
      if (name === 'root') {
        this.setParentCell('root', true);
      } else {
        const num = this.leftParentRowNumber;
        if (name !== '' && num !== '') {
          this.setParentCell(name + num.toString(), true);
        }
      }
    },

    handleTopParentTypeChange() {
      if (this.topParentType === 'default') {
        this.setParentCell(null, false);
      }
    },

    handleTopParentCellNameChange() {
      const name = this.topParentCellName;
      if (name === 'root') {
        this.topParentRowNumber = '';
        this.setParentCell('root', false);
      } else {
        const num = this.topParentRowNumber;
        if (name !== '' && num !== '') {
          this.setParentCell(name + num.toString(), false);
        }
      }
    },

    handleTopParentRowNumberChange() {
      const name = this.topParentCellName;
      if (name === 'root') {
        this.setParentCell('root', false);
      } else {
        const num = this.topParentRowNumber;
        if (name !== '' && num !== '') {
          this.setParentCell(name + num.toString(), false);
        }
      }
    },

    handleRendererChange() {
      this.setRenderer(this.rendererBean);
    },

    handleSelectRenderer() {
      // TODO: 实现选择渲染器的逻辑
    },

    handleLinkUrlChange() {
      this.cellDef.linkUrl = this.linkUrl;
      setDirty();
    },

    handleLinkTargetChange(value) {
      this.linkTarget = value;
      this.cellDef.linkTargetWindow = this.linkTarget;
      setDirty();
    },

    handleUrlParameterConfig() {
      if (!this.linkUrl || this.linkUrl === '') {
        showAlert(this.$t('property.prop.urlTip'));
        return;
      }
      if (!this.cellDef.linkParameters) {
        this.cellDef.linkParameters = [];
      }
      this.$refs.urlParameterDialog.show(this.cellDef.linkParameters);
      setDirty();
    },

    handleCellTypeChange(value) {
      this.cellType = value;
      const cellDef = this.cellDef;

      if (value === 'simple') {
        if (cellDef.value.type !== 'simple') {
          cellDef.value = { type: 'simple' };
        }
        cellDef.expand = 'None';
        // 使用Vue组件显示简单值编辑器
        this.currentEditorType = 'simple';
        this.$nextTick(() => {
          if (this.$refs.simpleValueEditor) {
            this.$refs.simpleValueEditor.show(cellDef, this.rowIndex, this.colIndex, this.row2Index, this.col2Index);
          }
        });
      } else if (value === 'expression') {
        if (cellDef.value.type !== 'expression') {
          cellDef.value = { type: 'expression', value: '' };
        }
        cellDef.expand = 'None';
        // 使用Vue组件显示表达式值编辑器
        this.currentEditorType = 'expression';
        this.$nextTick(() => {
          if (this.$refs.expressionValueEditor) {
            this.$refs.expressionValueEditor.show(cellDef, this.rowIndex, this.colIndex, this.row2Index, this.col2Index);
          }
        });
      } else if (value === 'dataset') {
        if (cellDef.value.type !== 'dataset') {
          cellDef.value = { type: 'dataset', datasetName: '', property: '', aggregate: '', conditions: [], order: 'none' };
        }
        cellDef.expand = 'Down';
        // 使用Vue组件显示数据集值编辑器
        this.currentEditorType = 'dataset';
        this.$nextTick(() => {
          if (this.$refs.datasetValueEditor) {
            this.$refs.datasetValueEditor.show(cellDef, this.rowIndex, this.colIndex, this.row2Index, this.col2Index);
          }
        });
      } else if (value === 'image') {
        if (cellDef.value.type !== 'image') {
          cellDef.value = { type: 'image', source: 'text' };
        }
        cellDef.expand = 'None';
        // 使用Vue组件显示图片值编辑器
        this.currentEditorType = 'image';
        this.$nextTick(() => {
          if (this.$refs.imageValueEditor) {
            this.$refs.imageValueEditor.show(cellDef, this.rowIndex, this.colIndex, this.row2Index, this.col2Index);
          }
        });
      } else if (value === 'qrcode') {
        if (cellDef.value.type !== 'zxing' || cellDef.value.category !== 'qrcode') {
          const width = this.buildWidth(this.colIndex, this.getContext().hot.getCell(this.rowIndex, this.colIndex).colSpan, this.getContext().hot);
          const height = this.buildHeight(this.rowIndex, this.getContext().hot.getCell(this.rowIndex, this.colIndex).rowSpan, this.getContext().hot);
          cellDef.value = { width, height, type: 'zxing', source: 'text', category: 'qrcode', data: '' };
          cellDef.expand = 'None';
        }
        // 使用Vue组件显示二维码值编辑器
        this.currentEditorType = 'zxing';
        this.$nextTick(() => {
          if (this.$refs.zxingValueEditor) {
            this.$refs.zxingValueEditor.show(cellDef, this.rowIndex, this.colIndex, this.row2Index, this.col2Index);
          }
        });
      } else if (value === 'barcode') {
        if (cellDef.value.type !== 'zxing' || cellDef.value.category !== 'barcode') {
          const width = this.buildWidth(this.colIndex, this.getContext().hot.getCell(this.rowIndex, this.colIndex).colSpan, this.getContext().hot);
          const height = this.buildHeight(this.rowIndex, this.getContext().hot.getCell(this.rowIndex, this.colIndex).rowSpan, this.getContext().hot);
          cellDef.value = { width, height, type: 'zxing', source: 'text', category: 'barcode', data: '', format: 'CODE_128' };
          cellDef.expand = 'None';
        }
        // 使用Vue组件显示条形码值编辑器
        this.currentEditorType = 'zxing';
        this.$nextTick(() => {
          if (this.$refs.zxingValueEditor) {
            this.$refs.zxingValueEditor.show(cellDef, this.rowIndex, this.colIndex, this.row2Index, this.col2Index);
          }
        });
      } else if (value === 'slash') {
        cellDef.crossTabWidget = new CrossTabWidget(this.getContext(), this.rowIndex, this.colIndex);
        cellDef.expand = 'None';
        // 使用Vue组件显示斜线值编辑器
        this.currentEditorType = 'slash';
        this.$nextTick(() => {
          if (this.$refs.slashValueEditor) {
            this.$refs.slashValueEditor.show(cellDef, this.rowIndex, this.colIndex, this.row2Index, this.col2Index);
          }
        });
      } else if (value === 'chart') {
        const width = this.buildWidth(this.colIndex, this.getContext().hot.getCell(this.rowIndex, this.colIndex).colSpan, this.getContext().hot);
        const height = this.buildHeight(this.rowIndex, this.colIndex, this.getContext().hot.getCell(this.rowIndex, this.colIndex).rowSpan, this.getContext().hot);
        cellDef.value = {
          width,
          height,
          type: 'chart',
          chart: {
            dataset: {
              type: 'pie'
            }
          }
        };
      }

      this.getContext().hot.setDataAtCell(this.rowIndex, this.colIndex, '');
      this.getContext().hot.render();
      setDirty();
    },

    /**
     * 构建宽度
     */
    buildWidth(colIndex, colspan, hot) {
      let width = hot.getColWidth(colIndex) - 3;
      if (!colspan || colspan < 2) {
        return width;
      }
      let start = colIndex + 1, end = colIndex + colspan;
      for (let i = start; i < end; i++) {
        width += hot.getColWidth(i);
      }
      return width;
    },

    /**
     * 构建高度
     */
    buildHeight(rowIndex, rowspan, hot) {
      let height = hot.getRowHeight(rowIndex) - 3;
      if (!rowspan || rowspan < 2) {
        return height;
      }
      let start = rowIndex + 1, end = rowIndex + rowspan;
      for (let i = start; i < end; i++) {
        height += hot.getRowHeight(i);
      }
      return height;
    },

    /**
     * 从store获取context
     */
    getContext() {
      return store.getters['report/getContext'];
    }
  }
};
</script>

<style scoped>
.property-panel {
  margin: 20px 8px
}

fieldset {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
}

legend {
  width: auto;
  margin-bottom: 1px;
  border-bottom: none;
  font-size: inherit;
  color: #4b4b4b;
  padding: 0 10px;
}

.link-fieldset {
  padding: 10px;
  border: solid 1px #dddddd;
  border-radius: 8px;
}

.link-legend {
  width: auto;
  margin-bottom: 1px;
  border-bottom: none;
  font-size: inherit;
  color: #4b4b4b;
}
</style>

