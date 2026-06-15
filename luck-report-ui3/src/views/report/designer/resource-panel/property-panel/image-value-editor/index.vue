<template>
  <div class="image-value-editor" ref="container">

    <div class="property-quote">
      {{ $t('property.image.config') }}
    </div>

    <u-form :label-width="100" labelPosition="left">
      <u-form-item class="property-label" :label="$t('property.image.width') + '(px)'">
        <u-input-number
          :placeholder="$t('property.image.widthPlaceholder')"
          v-model="width"
          :min="1"
          @change="handleWidthChange"
        />
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.image.height') + '(px)'">
        <u-input-number
          :placeholder="$t('property.image.heightPlaceholder')"
          v-model="height"
          :min="1"
          @change="handleHeightChange"
        />
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.image.source')">
        <u-select
          v-model="source"
          style="width: 250px"
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

      <u-form-item class="property-label" :label="$t('property.image.expand')" v-show="source === 'expression'">
        <u-radio-group
          v-model="expand"
          @change="handleExpandChange"
        >
          <u-radio
            v-for="option in [
              { value: 'Down', label: $t('property.image.down') },
              { value: 'Right', label: $t('property.image.right') },
              { value: 'None', label: $t('property.image.noneExpand') }
            ]"
            :key="option.value"
            :label="option.value"
          >
            {{ option.label }}
          </u-radio>
        </u-radio-group>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('property.image.p')" v-show="source === 'text'">
        <u-input
          :title="$t('property.image.tip')"
          :placeholder="$t('property.image.tip')"
          :clearable="true"
          style="width: 250px;"
          v-model="path"
          @blur="handlePathChange"
        />
      </u-form-item>

      <div v-show="source === 'expression'">
        <u-form-item class="property-label" :label="$t('property.image.expr')">
        </u-form-item>
        <div style="border: solid 1px #eeeeee;">
          <textarea ref="codeEditor"></textarea>
        </div>
      </div>
    </u-form>
  </div>
</template>

<script>
import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/lint/lint.js';
import { setDirty } from '@/utils/table.js';
import { scriptValidation } from '@/api/designer/index.js';
import UForm from "@/components/form/index.vue";
import UFormItem from "@/components/form-item/index.vue";
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import UInputNumber from '@/components/input-number/index.vue';
import UInput from '@/components/input/index.vue';
import { showAlert } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import { mapGetters, mapActions } from 'vuex';
import {getCell, setCell} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager';

export default {
  name: 'ImageValueEditor',
  components: {
    UForm,
    UFormItem,
    USelect,
    UOption,
    URadioGroup,
    URadio,
    UInputNumber,
    UInput
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
    sourceOptions() {
      return [
        { value: 'text', label: this.$t('property.image.path') },
        { value: 'expression', label: this.$t('property.image.expr') }
      ];
    },
    cellPosition() {
      return `${this.rowIndex},${this.colIndex}`;
    }
  },
  data() {
    return {
      codeMirror: null,
      loadingCellData: false,
      width: '',
      height: '',
      source: 'text',
      path: '',
      expand: 'None'
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
        }
      });

      this.$nextTick(() => {
        if (this.codeMirror) {
          this.codeMirror.refresh();
        }
      });
      this.codeMirror.setSize('auto', '120px');

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
          setCell( this.rowIndex, this.colIndex, newCellDef );
        }
        setDirty();
      });

      this.loadCellData();
    },

    /**
     * 加载单元格数据
     */
    loadCellData() {
      const currentCellDef = getCell(this.rowIndex, this.colIndex);
      if (!currentCellDef || !currentCellDef.value) return;

      this.width = currentCellDef.value.width || '';
      this.height = currentCellDef.value.height || '';
      this.source = currentCellDef.value.source || 'text';

      this.path = '';
      if (this.source === 'text') {
        this.path = currentCellDef.value.value || '';
      } else {
        if (this.codeMirror) {
          let valueToSet = currentCellDef.value.value || '';
          if (valueToSet === 'undefined') {
            valueToSet = '';
          }
          this.loadingCellData = true;
          this.codeMirror.setValue(valueToSet);
          this.loadingCellData = false;
        }
      }

      this.expand = currentCellDef.expand || 'None';

      this.$nextTick(() => {
        if (this.source === 'expression' && !this.codeMirror) {
          this.initCodeEditor();
        } else if (this.source === 'expression' && this.codeMirror) {
          let valueToSet = currentCellDef.value.value || '';
          if (valueToSet === 'undefined') {
            valueToSet = '';
          }
          this.loadingCellData = true;
          this.codeMirror.setValue(valueToSet);
          this.loadingCellData = false;
        }
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
     * 处理宽度变化
     */
    handleWidthChange() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (cellDef && cellDef.value) {
        const newCellDef = deepCopy(cellDef);
        newCellDef.value.width = this.width;
        setCell( this.rowIndex, this.colIndex, newCellDef );
      }
      setDirty();
    },

    /**
     * 处理高度变化
     */
    handleHeightChange() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (cellDef && cellDef.value) {
        const newCellDef = deepCopy(cellDef);
        newCellDef.value.height = this.height;
        setCell( this.rowIndex, this.colIndex, newCellDef );
      }
      setDirty();
    },

    /**
     * 处理图片来源变化
     */
    handleSourceChange() {

      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (cellDef && cellDef.value) {
        const newCellDef = deepCopy(cellDef);
        newCellDef.value.source = this.source;
        setCell( this.rowIndex, this.colIndex, newCellDef );
      }

      if (this.source === 'expression' && !this.codeMirror) {
        this.$nextTick(() => {
          this.initCodeEditor();
        });
      }

      setDirty();
    },

    /**
     * 处理路径变化
     */
    handlePathChange() {
      if (this.path){
        this.path = this.path.trim()
      }
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (cellDef && cellDef.value) {
        const newCellDef = deepCopy(cellDef);
        newCellDef.value.value = this.path;
        setCell( this.rowIndex, this.colIndex, newCellDef );
      }
      setDirty();
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
          if (type === 'dataset' || type === 'expression' || type === 'image') {
            const newCellDef = deepCopy(cellDef);
            newCellDef.expand = expand;
            setCell( i, j, newCellDef );
          }
        }
      }
      hot.render();
      setDirty();
    }
  }
};
</script>

<style scoped>
</style>




