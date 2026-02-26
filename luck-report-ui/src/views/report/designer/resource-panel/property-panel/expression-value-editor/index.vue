<template>
  <div class="expression-value-editor" ref="container" >
    <!-- 换行计算选项 -->
    <div class="form-group" style="margin-bottom: 10px">
      <label>{{ $t('property.base.newLineCompute') }}：</label>
      <div class="u-inline">
        <u-radio-group
            v-model="wrapCompute"
            @change="handleWrapComputeChange"
        >
          <u-radio
              v-for="option in [
              { value: 'default', label: $t('property.base.open') },
              { value: 'custom', label: $t('property.base.close') }
            ]"
              :key="option.value"
              :label="option.value"
          >
            {{ option.label }}
          </u-radio>
        </u-radio-group>
      </div>
    </div>

    <!-- 展开选项 -->
    <div class="form-group" style="margin-bottom: 10px">

      <label>{{ $t('property.expr.expand') }}：</label>
      <div class="u-inline">
        <u-radio-group
            v-model="expand"
            @change="handleExpandChange"
        >
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

    <!-- 格式化输入框 -->
    <div class="form-group" style="margin-bottom:10px;">
      <label>{{ $t('property.base.format') }}：</label>
      <vue-simple-suggest
          v-model="format"
          :list="suggestionList"
          :filter-by-query="true"
          :placeholder="$t('property.base.formatTip')"
          class="simple-suggest"
          style="display: inline-block"
          @input="handleFormatChange"
      ></vue-simple-suggest>
    </div>

    <!-- 条件属性配置 -->
    <div class="form-group" style="margin-bottom: 10px">
      <label>{{ $t('property.base.conditionProp') }}：</label>
      <u-button
          type="info"
          icon="icon-filter"
          @click="handleConditionPropertyConfig"
      >
        {{ $t('property.base.configCondition') }}
      </u-button>
    </div>

    <!-- 表达式编辑器 -->
    <div>
      <label>{{ $t('property.expr.expr') }}：</label>
      <div style="border: solid 1px #eeeeee;">
        <textarea ref="codeEditor"></textarea>
      </div>
    </div>

    <!-- 条件属性对话框 -->
    <PropertyConditionDialog
        ref="propertyConditionDialog"
        @saveAfter="handlePropertyConditionSave"
    />
  </div>
</template>

<script>
import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/lint/lint.js';
import { setDirty } from '@/utils/table.js';
import { scriptValidation, parseDatasetName } from '@/api/designer/index.js';
import PropertyConditionDialog from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/index.vue';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import UButton from '@/components/button/index.vue';
import { showAlert } from '@/utils/comnon.js';
import VueSimpleSuggest from 'vue-simple-suggest'
import 'vue-simple-suggest/dist/styles.css'

export default {
  name: 'ExpressionValueEditor',
  components: {
    PropertyConditionDialog,
    URadioGroup,
    URadio,
    UButton,
    VueSimpleSuggest
  },
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      codeMirror: null,
      cellDef: null,
      datasources: null,
      rowIndex: 0,
      colIndex: 0,
      row2Index: 0,
      col2Index: 0,
      initialized: false,
      wrapCompute: 'default',
      expand: 'None',
      format: '',
      suggestionList: [
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
      ],
      isInitialized: false
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.initCodeEditor();
      this.isInitialized = true;
    });
  },
  beforeDestroy() {
    if (this.codeMirror) {
      this.codeMirror.toTextArea();
      this.codeMirror = null;
    }
  },
  computed: {
    // 为URadioGroup组件准备的展开方向选项
    expandOptions() {
      return [
        { value: 'Down', label: this.$t('property.dataset.down') },
        { value: 'Right', label: this.$t('property.dataset.right') },
        { value: 'None', label: this.$t('property.dataset.noneExpand') }
      ];
    }
  },
  methods: {
    /**
     * 初始化代码编辑器
     */
    initCodeEditor() {
      const textarea = this.$refs.codeEditor;
      if (!textarea) return;

      this.codeMirror = CodeMirror.fromTextArea(textarea, {
        mode: 'javascript',
        lineNumbers: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        lint: {
          getAnnotations: this.buildScriptLintFunction(),
          async: true
        },
        lineWrapping: true,
        viewportMargin: Infinity,
        indentWithTabs: false,
        tabSize: 2,
        smartIndent: true,
        cursorScrollMargin: 10
      });

      // 确保编辑器正确渲染
      this.$nextTick(() => {
        if (this.codeMirror) {
          this.codeMirror.refresh();
        }
      });
      this.codeMirror.setSize('auto', '160px');

      // 监听内容变化
      this.codeMirror.on('change', (cm, changes) => {
        const expr = cm.getValue();
        if (this.cellDef && this.cellDef.value) {
          this.cellDef.value.value = expr;
        }
        if (this.context && this.context.hot) {
          this.context.hot.setDataAtCell(this.rowIndex, this.colIndex, expr);
        }
        setDirty();
      });

      // 编辑器初始化后，检查是否有数据需要显示
      if (this.cellDef && this.cellDef.value) {
        this.codeMirror.setValue(this.cellDef.value.value || '');
      }
    },

    /**
     * 构建脚本校验函数
     */
    buildScriptLintFunction() {
      return async (text, updateLinting, options, editor) => {
        if (text === '') {
          updateLinting(editor, []);
          return;
        }
        if (!text || text === '') {
          return;
        }

        try {
          const result = await scriptValidation(text);
          if (result) {
            for (let item of result) {
              item.from = { line: item.line - 1 };
              item.to = { line: item.line - 1 };
            }
            updateLinting(editor, result);
          } else {
            updateLinting(editor, []);
          }
        } catch (error) {
          console.error('Script validation error:', error);
          showAlert(this.$t('property.base.syntaxError'));
        }
      };
    },

    /**
     * 显示编辑器
     */
    show(cellDef, rowIndex, colIndex, row2Index, col2Index) {
      this.cellDef = cellDef;
      this.datasources = this.context.reportDef.datasources;
      this.rowIndex = rowIndex;
      this.colIndex = colIndex;
      this.row2Index = row2Index;
      this.col2Index = col2Index;
      this.initialized = false;

      // 如果编辑器已经初始化，立即设置值
      if (this.codeMirror && cellDef && cellDef.value) {
        this.codeMirror.setValue(cellDef.value.value || '');
      }

      // 设置展开选项
      if (cellDef && cellDef.expand) {
        this.expand = cellDef.expand;
      }

      // 设置格式
      if (cellDef && cellDef.cellStyle && cellDef.cellStyle.format) {
        this.format = cellDef.cellStyle.format;
      } else {
        this.format = '';
      }

      // 设置换行计算
      if (cellDef && cellDef.cellStyle && cellDef.cellStyle.wrapCompute) {
        this.wrapCompute = 'default';
      } else {
        this.wrapCompute = 'custom';
      }

      this.$nextTick(() => {
        this.initialized = true;
        if (!this.codeMirror) {
          this.initCodeEditor();
        } else {
          this.codeMirror.refresh();
        }
      });
    },

    /**
     * 处理展开选项变化
     */
    handleExpandChange(expand) {
      if (!this.context || !this.context.hot) return;
      this.expand = expand;
      const hot = this.context.hot;
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = hot.context.getCell(i, j);
          if (!cellDef) continue;

          const type = cellDef.value.type;
          if (type === 'dataset' || type === 'expression') {
            cellDef.expand = expand;
          }
        }
      }
      hot.render();
      setDirty();
    },

    /**
     * 处理换行计算选项变化
     */
    handleWrapComputeChange() {
      // 根据radio button选中的值转换为布尔值
      const wrapComputeValue = this.wrapCompute === 'custom';

      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = this.context.getCell(i, j);
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
    handleFormatChange(format) {
      if (!this.isInitialized) {
        return;
      }
      if (!this.context || !this.context.hot) return;
      this.format = format;
      const hot = this.context.hot;
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = hot.context.getCell(i, j);
          if (!cellDef) continue;

          if (!cellDef.cellStyle) {
            cellDef.cellStyle = {};
          }
          cellDef.cellStyle.format = format;
        }
      }
      setDirty();
    },

    /**
     * 处理条件属性配置
     */
    async handleConditionPropertyConfig() {
      if (!this.cellDef) return;

      // 创建深拷贝，避免引用问题
      const conditionPropertyItems = this.cellDef.conditionPropertyItems
          ? JSON.parse(JSON.stringify(this.cellDef.conditionPropertyItems))
          : [];

      if (!this.cellDef.conditionPropertyItems) {
        this.cellDef.conditionPropertyItems = conditionPropertyItems;
      }

      let datasetName = '';
      const expr = this.codeMirror ? this.codeMirror.getValue() : '';

      if (expr && expr !== '') {
        try {
          const result = await parseDatasetName(expr);
          datasetName = result.datasetName;
        } catch (error) {
          console.error('Parse dataset name error:', error);
        }
      }

      this.showPropertyConditionDialog(datasetName, conditionPropertyItems);
    },

    /**
     * 显示条件属性对话框
     */
    showPropertyConditionDialog(datasetName, conditionPropertyItems) {
      this.$refs.propertyConditionDialog.show(
          this.datasources,
          datasetName,
          conditionPropertyItems
      );
    },

    /**
     * 处理属性条件保存后的回调
     */
    handlePropertyConditionSave(propertyConditions) {
      this.cellDef.conditionPropertyItems = JSON.parse(JSON.stringify(propertyConditions));
      setDirty();
    }
  }
};
</script>

<style scoped>
.simple-suggest /deep/ .default-input{
  display: inline-block !important;
  width: 268px !important;
  height: 35px;
}
</style>
