<template>
  <div class="expression-value-editor" ref="container" >
    <u-form :label-width="100" labelPosition="left">

      <div class="property-quote">
        {{ $t('property.expr.config') }}
      </div>

      <!-- 换行计算选项 -->
      <u-form-item class="property-label" :label="$t('property.base.newLineCompute')">
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
      </u-form-item>

      <!-- 展开选项 -->
      <u-form-item class="property-label" :label="$t('property.expr.expand')">
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
      </u-form-item>

      <!-- 格式化输入框 -->
      <u-form-item class="property-label" :label="$t('property.base.format')">
        <vue-simple-suggest
            v-model="format"
            :list="suggestionList"
            :filter-by-query="true"
            :placeholder="$t('property.base.formatTip')"
            class="simple-suggest"
            @blur="handleFormatChange"
        ></vue-simple-suggest>
      </u-form-item>

      <!-- 条件属性配置 -->
      <u-form-item class="property-label" :label="$t('property.base.conditionProp')">
        <u-button
            type="info"
            icon="icon-filter"
            @click="handleConditionPropertyConfig"
        >
          {{ $t('property.base.configCondition') }}
        </u-button>
      </u-form-item>

      <!-- 表达式编辑器 -->
      <u-form-item class="property-label" :label="$t('property.expr.expr')">
      </u-form-item>
      <div>
        <textarea ref="codeEditor"></textarea>
      </div>
    </u-form>

    <!-- 条件属性对话框 -->
    <PropertyConditionDialog
        ref="propertyConditionDialog"
        :visible.sync="propertyConditionDialogVisible"
        :fields="[]"
        :conditionGroups="conditionGroups"
        @saveAfter="handlePropertyConditionSave"
    />
  </div>
</template>

<script>
import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/lint/lint.js';
import { setDirty } from '@/utils/table.js';
import { scriptValidation } from '@/api/designer/index.js';
import PropertyConditionDialog from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/index.vue';
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import UButton from '@/components/button/index.vue';
import { showAlert } from '@/utils/comnon.js';
import VueSimpleSuggest from 'vue-simple-suggest'
import 'vue-simple-suggest/dist/styles.css'
import { deepCopy } from '@/components/utils/index.js';
import { mapGetters, mapActions } from 'vuex';
import {getCell, setCell} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager.js';

export default {
  name: 'ExpressionValueEditor',
  components: {
    UForm,
    UFormItem,
    PropertyConditionDialog,
    URadioGroup,
    URadio,
    UButton,
    VueSimpleSuggest
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
    ...mapGetters('report', ['getContext', 'getIsCellUpdate']),
    context() {
      return this.getContext;
    },
    isCellUpdate() {
      return this.getIsCellUpdate;
    },
    expandOptions() {
      return [
        { value: 'Down', label: this.$t('property.dataset.down') },
        { value: 'Right', label: this.$t('property.dataset.right') },
        { value: 'None', label: this.$t('property.dataset.noneExpand') }
      ];
    },
    cellPosition() {
      return `${this.rowIndex},${this.colIndex}`;
    }
  },
  data() {
    return {
      codeMirror: null,
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
      loadingCellData: false,
      propertyConditionDialogVisible: false,
      conditionGroups: []
    };
  },
  watch: {
    cellPosition: {
      immediate: true,
      handler() {
        this.loadCellData();
      }
    },
    isCellUpdate: {
      handler(newVal) {
        if (newVal) {
          this.loadCellData();
          this.setCellUpdate(false);
        }
      }
    }
  },
  beforeDestroy() {
    if (this.codeMirror) {
      this.codeMirror.toTextArea();
      this.codeMirror = null;
    }
  },
  methods: {
    ...mapActions('report', ['setCellUpdate']),

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
        if (this.loadingCellData) return;
        const expr = cm.getValue();
        if (expr === 'undefined' || expr === undefined || expr === null) {
          return;
        }
        const cellDef = getCell(this.rowIndex, this.colIndex);
        if (cellDef && cellDef.value) {
          const newCellDef = deepCopy(cellDef);
          newCellDef.value.value = expr;
          setCell(this.rowIndex, this.colIndex, newCellDef);
        }
        const hot = TableManager.get();
        if (hot) {
          hot.setDataAtCell(this.rowIndex, this.colIndex, expr);
        }
        setDirty();
      });

      // 加载初始数据
      this.loadCellData();
    },

    /**
     * 加载单元格数据
     */
    loadCellData() {
      this.loadingCellData = true;

      const cellDef = getCell(this.rowIndex, this.colIndex);

      // 如果编辑器已经初始化，立即设置值
      if (this.codeMirror && cellDef && cellDef.value) {
        let valueToSet = cellDef.value.value || '';
        if (valueToSet === 'undefined') {
          valueToSet = '';
        }
        this.codeMirror.setValue(valueToSet);
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
        this.loadingCellData = false;
      });
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
     * 处理展开选项变化
     */
    handleExpandChange(expand) {
      const hot = TableManager.get();
      if (!hot) return;
      this.expand = expand;
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) continue;

          const type = cellDef.value.type;
          if (type === 'dataset' || type === 'expression') {
            const newCellDef = deepCopy(cellDef);
            newCellDef.expand = expand;
            setCell( i, j, newCellDef );
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
      const wrapComputeValue = this.wrapCompute === 'default';

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
    handleFormatChange(format) {
      if (this.loadingCellData) return;
      const hot = TableManager.get();
      if (!hot) return;
      this.format = format;
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) continue;

          const newCellDef = deepCopy(cellDef);
          if (!newCellDef.cellStyle) {
            newCellDef.cellStyle = {};
          }
          newCellDef.cellStyle.format = format;
          setCell( i, j, newCellDef );
        }
      }
      setDirty();
    },

    /**
     * 处理条件属性配置
     */
    async handleConditionPropertyConfig() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef) return;

      const conditionGroups = cellDef.conditionPropertyItems
          ? deepCopy(cellDef.conditionPropertyItems)
          : [];

      this.showPropertyConditionDialog(conditionGroups);
    },

    /**
     * 显示条件属性对话框
     */
    showPropertyConditionDialog(conditionGroups) {
      this.conditionGroups = conditionGroups;
      this.propertyConditionDialogVisible = true;
    },

    /**
     * 处理属性条件保存后的回调
     */
    handlePropertyConditionSave(conditionGroups) {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef) return;

      const newCellDef = deepCopy(cellDef);
      newCellDef.conditionPropertyItems = deepCopy(conditionGroups);

      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          setCell( i, j, newCellDef );
        }
      }
      setDirty();
    }
  }
};
</script>

<style scoped>
.simple-suggest /deep/ .default-input{
  display: inline-block !important;
  width: 250px !important;
  height: 35px;
}
</style>
