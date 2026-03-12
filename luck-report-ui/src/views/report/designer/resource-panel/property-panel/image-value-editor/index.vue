<template>
  <div class="image-value-editor" ref="container">
    <!-- 宽度设置 -->
    <div class="form-group">
      <label>{{ $t('property.image.width') }}(px)：</label>
      <div class="u-inline">
        <u-input-number
          :placeholder="$t('property.image.widthPlaceholder')"
          v-model="width"
          @change="handleWidthChange"
        />
      </div>
    </div>

    <!-- 高度设置 -->
    <div class="form-group">
      <label>{{ $t('property.image.height') }}(px)：</label>
      <div class="u-inline">
        <u-input-number
          :placeholder="$t('property.image.heightPlaceholder')"
          v-model="height"
          @change="handleHeightChange"
        />
      </div>
    </div>

    <!-- 图片来源选择 -->
    <div class="form-group">
      <label>{{ $t('property.image.source') }}：</label>
      <div class="u-inline">
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
      </div>
    </div>

    <!-- 展开选项 -->
    <div class="form-group" style="margin-bottom: 10px" v-show="source === 'expression'">
      <label>{{ $t('property.image.expand') }}：</label>
      <div class="u-inline">
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
      </div>
    </div>

    <!-- 图片路径编辑器 -->
    <div v-show="source === 'text'">
      <label>{{ $t('property.image.p') }}：</label>
      <div class="u-inline">
        <u-input
          :title="$t('property.image.tip')"
          :placeholder="$t('property.image.tip')"
          style="width: 280px;"
          v-model="path"
          @change="handlePathChange"
        />
      </div>
    </div>

    <!-- 表达式编辑器 -->
    <div v-show="source === 'expression'">
      <label>{{ $t('property.image.expr') }}：</label>
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
import { scriptValidation } from '@/api/designer/index.js';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import UInputNumber from '@/components/input-number/index.vue';
import UInput from '@/components/input/index.vue';
import { showAlert } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import { mapGetters } from 'vuex';
import {getCell, setCell} from "@/utils/contextActions";

export default {
  name: 'ImageValueEditor',
  components: {
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
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    },
    sourceOptions() {
      return [
        { value: 'text', label: this.$t('property.image.path') },
        { value: 'expression', label: this.$t('property.image.expr') }
      ];
    }
  },
  data() {
    return {
      codeMirror: null,
      initialized: false,
      width: '',
      height: '',
      source: 'text',
      path: '',
      expand: 'None'
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
        }
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
        if (this.initialized) {
          return;
        }
        const expr = cm.getValue();
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
      this.initialized = true;

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
          this.codeMirror.setValue(currentCellDef.value.value || '');
        }
      }

      this.expand = currentCellDef.expand || 'None';

      this.$nextTick(() => {
        if (this.source === 'expression' && !this.codeMirror) {
          this.initCodeEditor();
        } else if (this.source === 'expression' && this.codeMirror) {
          this.codeMirror.setValue(currentCellDef.value.value || '');
        }
        this.initialized = false;
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
      if (!this.context || !this.context.hot) return;
      this.expand = expand;
      const hot = this.context.hot;
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




