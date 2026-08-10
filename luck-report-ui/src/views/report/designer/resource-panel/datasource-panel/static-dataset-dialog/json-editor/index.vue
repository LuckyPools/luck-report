<template>
  <div class="sql-editor-container">
    <div class="sql-editor-row">
      {{ $t('dialog.sql.datasetName') }}：
      <div class="u-inline">
        <u-input
            v-model="datasetName"
            class="sql-editor-name-input"
            @input="handleDatasetNameChange"
        />
      </div>
    </div>

    <div class="sql-editor-row" style="margin-top: 5px">
      <span>
         JSON数据集
          <span class="sql-editor-desc">{{ $t('dialog.staticDataset.desc') }}</span>
      </span>
      <div>
        <u-button
            native-type="button"
            type="primary"
            size="small"
            @click="formatJson(codeMirror)"
        >
          格式化
        </u-button>
        <u-button
            native-type="button"
            type="primary"
            size="small"
            class="mr-l-8"
            @click="formatJson(codeMirror)"
            style="margin-left: 10px"
        >
          导入excel
        </u-button>
      </div>
      <div>
        <textarea
            ref="jsonTextarea"
            placeholder="输入..."
            class="form-control sql-editor-textarea"
            rows="8"
            cols="30"
        ></textarea>
      </div>
    </div>
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

import {showAlert} from '@/utils/comnon.js';
import {scriptValidation} from '@/api/designer';
import UInput from '@/components/input/index.vue';
import UButton from "@/components/button/index.vue";
window.jsonlint = jsonlint;
export default {
  name: 'JsonEditor',
  components: {
    UButton,
    UInput
  },
  props: {
    name: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
    }
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
    }
  },
  data() {
    return {
      datasetName: this.name,
      codeMirror: null,
      isSilentUpdate: false
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
     * @param {string} initialSql - 初始SQL内容，可为空
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
        lint: true,
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
      this.codeMirror.setSize('100%', '204px');

      this.codeMirror.on('change', (cm, change) => {
        if (change.origin !== 'setValue') {
          this.isSilentUpdate = true;
          this.$emit('json-change', this.getJson());
        }
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
  }
};
</script>

<style scoped>
.sql-editor-container {
}

.sql-editor-name-input {
  width: 500px;
}

.sql-editor-desc {
  color: #999999;
  font-size: 12px;
}

.sql-editor-textarea {

}
</style>
