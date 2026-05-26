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
         SQL(<span class="sql-editor-desc">{{ $t('dialog.sql.desc') }}</span>)
      </span>
      <textarea
        ref="sqlTextarea"
        placeholder="select username,dept_id from employee where dept_id=:deptId"
        class="form-control sql-editor-textarea"
        rows="8"
        cols="30"
      ></textarea>
    </div>
  </div>
</template>

<script>
import CodeMirror from 'codemirror';
import 'codemirror/mode/sql/sql.js';
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/lint/lint.js';
import { showAlert } from '@/utils/comnon.js';
import { scriptValidation } from '@/api/designer';
import UInput from '@/components/input/index.vue';

export default {
  name: 'SqlEditor',
  components: {
    UInput
  },
  props: {
    name: {
      type: String,
      default: ''
    },
    sql: {
      type: String,
      default: ''
    }
  },
  watch: {
    name(newVal) {
      this.datasetName = newVal || '';
    },
    sql(newVal) {
      if (this.isSilentUpdate) {
        this.isSilentUpdate = false;
        return;
      }
      this.setSql(newVal || '');
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
    this.initCodeMirror(this.sql);
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
      const textarea = this.$refs.sqlTextarea;
      if (!textarea) return;

      if (this.codeMirror) {
        this.codeMirror.setValue(initialSql || '');
        return;
      }

      if (initialSql) {
        textarea.value = initialSql;
      }

      this.codeMirror = CodeMirror.fromTextArea(textarea, {
        mode: 'text/x-sql',
        lineNumbers: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        lint: {
          getAnnotations: this.buildScriptLintFunction(),
          async: true
        },
        lineWrapping: true
      });
      this.codeMirror.setSize('100%', '204px');

      this.codeMirror.on('change', (cm, change) => {
        if (change.origin !== 'setValue') {
          this.isSilentUpdate = true;
          this.$emit('sql-change', this.getSql());
        }
      });
    },

    /**
     * 方法说明：构建脚本校验函数，用于CodeMirror的lint插件
     * 仅对 ${...} 格式的表达式进行语法校验
     * @return {Function} 异步校验函数
     */
    buildScriptLintFunction() {
      return async (text, updateLinting, options, editor) => {
        if (!text) {
          updateLinting(editor, []);
          return;
        }

        const prefix = text.substring(0, 2);
        const suffix = text.substring(text.length - 1);
        if (prefix !== '${' || suffix !== '}') {
          return;
        }

        const expression = text.substring(2, text.length - 1);

        try {
          const result = await scriptValidation(expression);
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
          if (error.msg) {
            showAlert(this.$t('dialog.save.serverError') + this.$t('colon') + error.msg, { useHTMLString: true });
          } else {
            showAlert(this.$t('dialog.sql.syntaxCheckError'));
          }
          updateLinting(editor, []);
        }
      };
    },

    /**
     * 方法说明：获取数据集名称
     * @return {string} 当前数据集名称
     */
    getDatasetName() {
      return this.datasetName;
    },

    /**
     * 方法说明：获取SQL内容
     * @return {string} 当前SQL内容
     */
    getSql() {
      if (this.codeMirror) {
        return this.codeMirror.getValue();
      }
      const textarea = this.$refs.sqlTextarea;
      if (textarea) {
        return textarea.value;
      }
      return '';
    },

    /**
     * 方法说明：设置SQL内容
     * @param {string} sql - 要设置的SQL内容，可为空
     */
    setSql(sql) {
      if (this.codeMirror) {
        this.codeMirror.setValue(sql || '');
      } else {
        const textarea = this.$refs.sqlTextarea;
        if (textarea) {
          textarea.value = sql || '';
        }
      }
    }
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
<style>
.CodeMirror-wrap{
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-top: 5px
}
</style>
