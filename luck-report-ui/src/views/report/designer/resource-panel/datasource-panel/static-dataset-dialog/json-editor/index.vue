<template>
  <div class="sql-editor-container">
    <!-- 数据集名称行：输入框右侧放置导入excel按钮 -->
    <div class="sql-editor-row name-row">
      <span class="row-label">{{ $t('dialog.sql.datasetName') }}：</span>
      <u-input
          v-model="datasetName"
          class="sql-editor-name-input"
          @input="handleDatasetNameChange"
      />
      <u-button
          native-type="button"
          type="primary"
          size="small"
          class="row-action-btn"
          icon="icon-upload"
          @click="showExcelToJsonDialog"
      >
        {{ $t('dialog.staticDataset.importExcel') }}
      </u-button>
    </div>

    <!-- JSON输入框行：格式化按钮悬浮在编辑框右上角，类似 vitepress 代码块复制按钮 -->
    <div class="sql-editor-row editor-row">
      <div class="editor-wrapper">
        <textarea
            ref="jsonTextarea"
            :placeholder="$t('dialog.staticDataset.inputPlaceholder')"
            class="form-control sql-editor-textarea"
            rows="8"
            cols="30"
        ></textarea>
        <button
            type="button"
            class="fmt-btn"
            :title="$t('dialog.staticDataset.format')"
            @click="formatJson(codeMirror)"
        >
          {{ $t('dialog.staticDataset.format') }}
        </button>
      </div>
    </div>
    <excel-to-json ref="excelToJsonRef" :visible="visibleExcelImp"  @close="visibleExcelImp = false" @json-imported="handleJson"></excel-to-json>
  </div>
</template>

<script>
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript'
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/lint/lint.js';
import 'codemirror/addon/hint/javascript-hint.js';

import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';       // JSON 折叠核心
import 'codemirror/addon/fold/foldgutter.css';   // 折叠图标样式
import 'codemirror/addon/lint/json-lint';
import jsonlint from 'jsonlint-mod';

import UInput from '@/components/input/index.vue';
import UButton from "@/components/button/index.vue";
import ExcelToJson
  from "@/views/report/designer/resource-panel/datasource-panel/static-dataset-dialog/excel-to-json/index.vue";
window.jsonlint = jsonlint;
export default {
  name: 'JsonEditor',
  components: {
    UButton,
    UInput,
    ExcelToJson
  },
  props: {
    name: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
    },
  },
  watch: {
    name(newVal) {
      this.datasetName = newVal || '';
    },
    content(newVal) {
      if (this.isSilentUpdate) {
        this.isSilentUpdate = false;
        return;
      }
      this.setJson(newVal || '');
      this.$nextTick(() => {
        this.formatJson(this.codeMirror);
      });
    }
  },
  data() {
    return {
      datasetName: this.name,
      codeMirror: null,
      isSilentUpdate: false,
      visibleExcelImp: false,

    };
  },
  beforeUnmount() {
    if (this.codeMirror) {
      this.codeMirror.off('change');
      this.codeMirror.toTextArea();
      this.codeMirror = null;
    }
  },
  mounted() {
    this.initCodeMirror(this.content);

  },
  methods: {
    /**
     * 方法说明：通知父组件数据集名称已变化
     */
    handleDatasetNameChange() {
      this.$emit('dataset-name-change', this.getDatasetName());
    },

    /**
     * 方法说明：初始化或更新CodeMirror编辑器
     * @param {string} initialSql - 初始JSON内容，可为空
     */
    initCodeMirror(initialSql = '') {
      const textarea = this.$refs.jsonTextarea;
      if (!textarea) return;

      if (this.codeMirror) {
        this.codeMirror.setValue(initialSql || '');
        return;
      }

      if (initialSql) {
        textarea.value = initialSql;
      }

      this.codeMirror = CodeMirror.fromTextArea(textarea, {
        mode: 'application/json',
        lineNumbers: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
        // 自定义 lint：编辑器为空（含纯空白）时不校验，避免初始无内容时行号区出现红色 ❌ 标记；
        // 非空内容复用 json-lint 已注册的 helper，保留精确的错误行/列定位
        lint: {
          getAnnotations: (text, updateLinting, options, cm) => {
            if (!text || !text.trim()) {
              return [];
            }
            const jsonLinter = cm && cm.getHelper(CodeMirror.Pos(0, 0), 'lint');
            if (jsonLinter) {
              return jsonLinter(text, updateLinting, options, cm);
            }
            return [];
          }
        },
        lineWrapping: true,
        foldGutter: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 2,
        tabSize: 2,
        viewportMargin: Infinity,
        extraKeys: {
          'Ctrl-Shift-F': (cm) => this.formatJson(cm),
          'Cmd-Shift-F': (cm) => this.formatJson(cm),  // macOS
        }
      });
      this.codeMirror.setSize('100%', '360px');

      this.codeMirror.on('change', (cm, change) => {
        if (change.origin !== 'setValue') {
          this.isSilentUpdate = true;
          this.$emit('json-change', this.getJson());
        }
      });
      this.$nextTick(() => {
          this.formatJson(this.codeMirror);
      });
    },

    /**
     * 方法说明：获取数据集名称
     * @return {string} 当前数据集名称
     */
    getDatasetName() {
      return this.datasetName;
    },

    /**
     * 方法说明：获取JSON内容
     * @return {string} 当前JSON内容
     */
    getJson() {
      if (this.codeMirror) {
        return this.codeMirror.getValue();
      }
      const textarea = this.$refs.jsonTextarea;
      if (textarea) {
        return textarea.value;
      }
      return '';
    },

    /**
     * 方法说明：设置SQL内容
     * @param {string} sql - 要设置的SQL内容，可为空
     */
    setJson(sql) {
      if (this.codeMirror) {
        this.codeMirror.setValue(sql || '');
      } else {
        const textarea = this.$refs.jsonTextarea;
        if (textarea) {
          textarea.value = sql || '';
        }
      }
    },
    /**
     * 格式化当前编辑器中的 JSON
     * @param {CodeMirror.Editor} cm
     * @param {number} indent - 缩进空格数，默认2
     */
    formatJson(cm, indent) {
      if (!indent) {
        indent = 2;
      }
      const raw = cm.getValue();
      try {
        const parsed = JSON.parse(raw);
        const formatted = JSON.stringify(parsed, null, indent);
        // 保留光标位置
        const cursor = cm.getCursor();
        cm.setValue(formatted);
        cm.setCursor(cursor);
      } catch (e) {
        console.error(this.$t('dialog.json.doFmtErr'), e.message);
      }
    },
    /**
     * 校验当前内容是否为合法的 JSON 数组
     * @returns {{ valid: boolean, message?: string }}
     */
    validateJsonArray() {
      const raw = this.getJson().trim();
      if (!raw) {
        return { valid: false, message:  this.$t('dialog.json.jsonTip') };
      }
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          return { valid: false, message: this.$t('dialog.json.arrFmtErr') };
        }
        if (parsed.length === 0){
          return { valid: false, message: this.$t('dialog.json.emptyArrErr') };
        }
        return { valid: true };
      } catch (e) {
        return { valid: false, message: `${this.$t('dialog.json.fmtErr')}: ${e.message}` };
      }
    },
    showExcelToJsonDialog(){
      this.visibleExcelImp=true;
    },
    handleJson(json) {
      this.setJson(json);
      this.isSilentUpdate = true;
      this.$emit('json-change',json);
      this.$nextTick(() => {
        this.formatJson(this.codeMirror);
      });
    },
  }
};
</script>

<style scoped>
/* 占满父级 flex 容器宽度，min-width:0 保证内部 flex 子项可正常收缩 */
.sql-editor-container {
  flex: 1;
  min-width: 0;
}

/* 行布局：label + 输入框 + 操作按钮 */
.sql-editor-row {
  display: flex;
  align-items: center;
}

/* JSON编辑器行顶部对齐，适配较高的 textarea */
.editor-row {
  align-items: flex-start;
  margin-top: 5px;
}

.row-label {
  flex-shrink: 0;
}

.sql-editor-name-input {
  flex: 1;
}

.editor-wrapper {
  flex: 1;
  min-width: 0;
  position: relative;
}

/* 操作按钮固定宽度，保证两行按钮上下列对齐 */
.row-action-btn {
  flex-shrink: 0;
  margin-left: 10px;
  min-width: 96px;
}

/* 导入图标与文本间距 */
.import-icon {
  margin-right: 4px;
  vertical-align: -2px;
}

/* 格式化按钮悬浮于编辑框右上角，样式参考 vitepress 代码块复制按钮：
   默认隐藏，仅 hover 编辑器时显现，灰色边框、半透明背景 */
.fmt-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
  color: #666;
  background-color: rgba(255, 255, 255, 0.7);
  border: 1px solid #d4d4d4;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

/* 鼠标 hover 编辑器时显现按钮 */
.editor-wrapper:hover .fmt-btn {
  opacity: 1;
  visibility: visible;
}

/* 按钮自身 hover：边框加深、背景更实 */
.fmt-btn:hover {
  border-color: #909399;
  background-color: rgba(255, 255, 255, 0.95);
}

.sql-editor-textarea {

}
</style>
