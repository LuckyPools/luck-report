<template>
  <div class="zxing-value-editor" ref="container">

    <div class="property-quote">
      {{ $t('property.zxing.config') }}
    </div>

    <u-form :label-width="100" labelPosition="left">
      <u-form-item class="property-label" :label="$t('property.zxing.width')">
        <u-input-number
          v-model="width"
          @change="handleWidthChange"
        >
        </u-input-number>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.zxing.height')">
        <u-input-number
          v-model="height"
          @change="handleHeightChange"
        >
        </u-input-number>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.zxing.format')" v-show="showFormat">
        <u-select
          v-model="format"
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
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.zxing.source')">
        <u-select
          v-model="source"
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
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.zxing.expand')" v-show="source === 'expression'">
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
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.zxing.text1')" v-show="source === 'text'">
        <u-input
          v-model="textValue"
          @change="handleTextChange"
          style="width: 250px;"
        />
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.zxing.expr')" v-show="source === 'expression'">
        <div style="border: solid 1px #eeeeee;">
          <textarea ref="codeEditor"></textarea>
        </div>
      </u-form-item>
    </u-form>
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
import UFormItem from '@/components/form-item/index.vue'
import { deepCopy } from '@/components/utils/index.js';
import { mapGetters } from 'vuex';
import {setCell, getCell} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager.js';
import UForm from "@/components/form/index.vue";

export default {
  name: 'ZxingValueEditor',
  components: {
    UForm,
    USelect,
    UOption,
    URadioGroup,
    URadio,
    UInputNumber,
    UInput,
    UFormItem
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
    },
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
  data() {
    return {
      codeMirror: null,
      width: 100,
      height: 100,
      format: 'QR_CODE',
      source: 'text',
      textValue: '',
      expand: 'None',
      showFormat: true
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
        if (expr === 'undefined' || expr === undefined || expr === null) {
          return;
        }
        const cellDef = getCell(this.rowIndex, this.colIndex);
        if (cellDef && cellDef.value) {
          const newCellDef = deepCopy(cellDef);
          newCellDef.value.value = expr;
          setCell( this.rowIndex, this.colIndex, newCellDef );
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
      const cellDef = getCell(this.rowIndex, this.colIndex);

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
            let valueToSet = cellDef.value.value || '';
            if (valueToSet === 'undefined') {
              valueToSet = '';
            }
            this.codeMirror.setValue(valueToSet);
            this.codeMirror.refresh();
          }
        });
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
     * 处理宽度变化
     */
    handleWidthChange() {
      if (isNaN(this.width)) {
        showAlert(this.$t('property.zxing.numberTip'));
        return;
      }
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (cellDef && cellDef.value) {
        const newCellDef = deepCopy(cellDef);
        newCellDef.value.width = this.width;
        setCell( this.rowIndex, this.colIndex, newCellDef );
        const hot = TableManager.get();
        if (hot) {
          hot.render();
        }
        setDirty();
      }
    },

    handleHeightChange() {
      if (isNaN(this.height)) {
        showAlert(this.$t('property.zxing.numberTip'));
        return;
      }
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (cellDef && cellDef.value) {
        const newCellDef = deepCopy(cellDef);
        newCellDef.value.height = this.height;
        setCell( this.rowIndex, this.colIndex, newCellDef );
        const hot = TableManager.get();
        if (hot) {
          hot.render();
        }
        setDirty();
      }
    },

    /**
     * 处理格式变化
     */
    handleFormatChange() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (cellDef && cellDef.value) {
        const newCellDef = deepCopy(cellDef);
        newCellDef.value.format = this.format;
        setCell( this.rowIndex, this.colIndex, newCellDef );
        setDirty();
      }
    },

    /**
     * 处理数据源变化
     */
    handleSourceChange() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (cellDef && cellDef.value) {
        const newCellDef = deepCopy(cellDef);
        newCellDef.value.source = this.source;
        setCell( this.rowIndex, this.colIndex, newCellDef );
        setDirty();

        // 根据数据源类型初始化编辑器
        if (this.source === 'expression') {
          this.$nextTick(() => {
            if (!this.codeMirror) {
              this.initCodeEditor();
            } else {
              const currentCellDef = getCell(this.rowIndex, this.colIndex);
              this.codeMirror.setValue(currentCellDef.value.value || '');
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
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (cellDef && cellDef.value) {
        const newCellDef = deepCopy(cellDef);
        newCellDef.value.value = this.textValue;
        setCell( this.rowIndex, this.colIndex, newCellDef );
        setDirty();
      }
    },

    /**
     * 处理展开选项变化
     */
    handleExpandChange(expand) {
      const hot = TableManager.get();
      if (!hot) return;
      this.expand = expand;

      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (cellDef) {
        const newCellDef = deepCopy(cellDef);
        newCellDef.expand = expand;
        setCell( this.rowIndex, this.colIndex, newCellDef );
      }

      hot.render();
      setDirty();
    }
  }
};
</script>

<style scoped>
</style>




