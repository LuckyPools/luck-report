<template>
  <div class="zxing-value-editor" ref="container">
    <!-- 尺寸设置 -->
    <div class="form-group">
      <label>{{ $t('property.zxing.width') }}：</label>
      <div class="u-inline">
        <u-input-number
          v-model="width"
          @change="handleWidthChange"
        >
        </u-input-number>
      </div>
      <label style="margin-left: 20px">{{ $t('property.zxing.height') }}：</label>
      <div class="u-inline">
        <u-input-number
          v-model="height"
          @change="handleHeightChange"
        >
        </u-input-number>
      </div>
    </div>

    <!-- 格式选择 -->
    <div class="form-group" v-show="showFormat">
      <label>{{ $t('property.zxing.format') }}：</label>
      <div class="u-inline">
        <u-select
          :value="format"
          :clearable="true"
          @change="handleFormatChange"
        >
          <u-option
            v-for="option in formatOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </div>
    </div>

    <!-- 数据源选择 -->
    <div class="form-group">
      <label>{{ $t('property.zxing.source') }}：</label>
      <div class="u-inline">
        <u-select
          :value="source"
          :clearable="true"
          @change="handleSourceChange"
        >
          <u-option
            v-for="option in sourceOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </div>
    </div>

    <!-- 展开选项 -->
    <div class="form-group" v-show="source === 'expression'" style="margin-bottom: 10px;">
      <label>{{ $t('property.zxing.expand') }}：</label>
      <div class="u-inline">
        <u-radio-group
          v-model="expand"
          @change="handleExpandChange"
        >
          <u-radio
            v-for="option in [
              { value: 'Down', label: $t('property.zxing.down') },
              { value: 'Right', label: $t('property.zxing.right') },
              { value: 'None', label: $t('property.zxing.noneExpand') }
            ]"
            :key="option.value"
            :label="option.value"
          >
            {{ option.label }}
          </u-radio>
        </u-radio-group>
      </div>
    </div>

    <!-- 文本输入 -->
    <div v-show="source === 'text'">
      <label>{{ $t('property.zxing.text1') }}：</label>
      <div class="u-inline">
        <u-input
          v-model="textValue"
          @change="handleTextChange"
          style="width: 300px;"
        />
      </div>
    </div>

    <!-- 表达式编辑器 -->
    <div v-show="source === 'expression'">
      <label>{{ $t('property.zxing.expr') }}：</label>
      <div style="border: solid 1px #eeeeee;">
        <textarea ref="codeEditor"></textarea>
      </div>
    </div>

  </div>
</template>

<script>
import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/lint/lint.js';
import { setDirty } from '@/utils/table.js';
import { scriptValidation } from '../../../../../../api/designer/index.js';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import { showAlert } from '@/utils/comnon.js';
import UInputNumber from '@/components/input-number/index.vue'
import UInput from '@/components/input/index.vue'
export default {
  name: 'ZxingValueEditor',
  components: {
    USelect,
    UOption,
    URadioGroup,
    URadio,
    UInputNumber,
    UInput
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
      rowIndex: 0,
      colIndex: 0,
      row2Index: 0,
      col2Index: 0,
      width: 100,
      height: 100,
      format: 'QR_CODE',
      source: 'text',
      textValue: '',
      expand: 'None',
      showFormat: true
    };
  },
  computed: {
    // 格式选项
    formatOptions() {
      return [
        { value: 'AZTEC', label: 'AZTEC' },
        { value: 'CODABAR', label: 'CODABAR' },
        { value: 'CODE_39', label: 'CODE_39' },
        { value: 'CODE_93', label: 'CODE_93' },
        { value: 'CODE_128', label: 'CODE_128' },
        { value: 'DATA_MATRIX', label: 'DATA_MATRIX' },
        { value: 'EAN_8', label: 'EAN_8' },
        { value: 'EAN_13', label: 'EAN_13' },
        { value: 'ITF', label: 'ITF' },
        { value: 'PDF_417', label: 'PDF_417' },
        { value: 'UPC_E', label: 'UPC_E' },
        { value: 'UPC_A', label: 'UPC_A' }
      ];
    },
    // 数据源选项
    sourceOptions() {
      return [
        { value: 'text', label: this.$t('property.zxing.text') },
        { value: 'expression', label: this.$t('property.zxing.expr') }
      ];
    }
  },
  mounted() {
  },
  beforeDestroy() {
    if (this.codeMirror) {
      this.codeMirror.toTextArea();
      this.codeMirror = null;
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
      this.codeMirror.setSize('auto', '120px');

      // 监听内容变化
      this.codeMirror.on('change', (cm, changes) => {
        const expr = cm.getValue();
        if (this.cellDef && this.cellDef.value) {
          this.cellDef.value.value = expr;
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
          showAlert(this.$t('property.base.syntaxError'));
        }
      };
    },

    /**
     * 显示编辑器
     */
    show(cellDef, rowIndex, colIndex, row2Index, col2Index) {
      this.cellDef = cellDef;
      this.rowIndex = rowIndex;
      this.colIndex = colIndex;
      this.row2Index = row2Index;
      this.col2Index = col2Index;

      // 设置宽度
      this.width = cellDef.value.width || 100;

      // 设置高度
      this.height = cellDef.value.height || 100;

      // 设置格式
      this.format = cellDef.value.format || 'QR_CODE';

      // 设置数据源
      this.source = cellDef.value.source || 'text';

      // 设置文本值
      this.textValue = cellDef.value.value || '';

      // 设置展开选项
      this.expand = cellDef.expand || 'None';

      // 根据类型决定是否显示格式选项
      this.showFormat = cellDef.value.category !== 'qrcode';

      // 如果是表达式模式，初始化编辑器并设置值
      if (this.source === 'expression') {
        this.$nextTick(() => {
          if (!this.codeMirror) {
            this.initCodeEditor();
          }else {
            this.codeMirror.setValue(cellDef.value.value || '');
            this.codeMirror.refresh();
          }
        });
      }
    },

    /**
     * 隐藏编辑器
     */
    hide() {
      // 隐藏组件
      this.visible = false;
    },

    /**
     * 处理宽度变化
     */
    handleWidthChange() {
      if (isNaN(this.width)) {
        showAlert(this.$t('property.zxing.numberTip'));
        return;
      }
      if (this.cellDef && this.cellDef.value) {
        this.cellDef.value.width = this.width;
        this.context.hot.render();
        setDirty();
      }
    },

    handleHeightChange() {
      if (isNaN(this.height)) {
        showAlert(this.$t('property.zxing.numberTip'));
        return;
      }
      if (this.cellDef && this.cellDef.value) {
        this.cellDef.value.height = this.height;
        this.context.hot.render();
        setDirty();
      }
    },

    /**
     * 处理格式变化
     */
    handleFormatChange(value) {
      this.format = value;
      if (this.cellDef && this.cellDef.value) {
        this.cellDef.value.format = this.format;
        setDirty();
      }
    },

    /**
     * 处理数据源变化
     */
    handleSourceChange(value) {
      this.source = value;
      if (this.cellDef && this.cellDef.value) {
        this.cellDef.value.source = this.source;
        setDirty();

        // 根据数据源类型初始化编辑器
        if (this.source === 'expression') {
          this.$nextTick(() => {
            if (!this.codeMirror) {
              this.initCodeEditor();
            } else {
              this.codeMirror.setValue(this.cellDef.value.value || '');
              this.codeMirror.refresh();
            }
          });
        }
      }
    },

    /**
     * 处理文本变化
     */
    handleTextChange() {
      if (this.cellDef && this.cellDef.value) {
        this.cellDef.value.value = this.textValue;
        setDirty();
      }
    },

    /**
     * 处理展开选项变化
     */
    handleExpandChange(expand) {
      if (!this.context || !this.context.hot) return;
      this.expand = expand;

      // 只更新当前单元格，而不是整个选区
      if (this.cellDef) {
        this.cellDef.expand = expand;
      }

      const hot = this.context.hot;
      hot.render();
      setDirty();
    }
  }
};
</script>

<style scoped>
</style>




