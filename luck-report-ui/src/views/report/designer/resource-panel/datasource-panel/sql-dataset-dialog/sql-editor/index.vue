<template>
  <div class="sql-editor-container">
    <div class="row" style="margin: 10px;">
      {{ $t('dialog.sql.datasetName') }}：
      <div class="u-inline">
        <u-input
          v-model="datasetName"
          style="width:500px;"
          @input="handleDatasetNameChange"
        />
      </div>
    </div>

    <div class="row" style="margin:10px;">
      SQL(<span style="color: #999999;font-size: 12px;">{{ $t('dialog.sql.desc') }}：</span>)
      <textarea
        ref="sqlTextarea"
        placeholder="select username,dept_id from employee where dept_id=:deptId"
        class="form-control"
        rows="8"
        cols="30"
        style="width: 660px"
      ></textarea>
    </div>
  </div>
</template>

<script>
import CodeMirror from 'codemirror';
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
    // 监听name变化，确保数据集名称能正确更新
    name(newVal) {
      this.datasetName = newVal || '';
      this.setDatasetName(newVal);
    },
    // 监听sql变化，更新SQL内容
    sql(newVal) {
      // 如果是内部更新导致的，跳过以避免循环
      if (this.isInternalUpdate) {
        this.isInternalUpdate = false;
        return;
      }
      this.setSql(newVal || '');
    }
  },
  data() {
    return {
      datasetName: this.name,
      codeMirror: null,
      isInternalUpdate: false
    };
  },
  beforeUnmount() {
    // 在组件销毁前清理CodeMirror实例
    if (this.codeMirror) {
      this.codeMirror.toTextArea();
      this.codeMirror = null;
    }
  },
  mounted() {
    // 组件挂载时初始化CodeMirror
    this.initCodeMirror(this.sql);
  },
  methods: {
    handleDatasetNameChange() {
      // 通知父组件数据集名称已变化
      this.$emit('dataset-name-change', this.getDatasetName());
    },

    // 初始化或更新CodeMirror编辑器
    initCodeMirror(initialSql = '') {
      const textarea = this.$refs.sqlTextarea;
      if (!textarea) return;

      // 如果CodeMirror已经初始化，只更新内容
      if (this.codeMirror) {
        this.codeMirror.setValue(initialSql || '');
        return;
      }

      // 设置初始值
      if (initialSql) {
        textarea.value = initialSql;
      }

      // 初始化 CodeMirror
      this.codeMirror = CodeMirror.fromTextArea(textarea, {
        mode: 'javascript',
        lineNumbers: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        lint: {
          getAnnotations: this.buildScriptLintFunction(),
          async: true
        },
        lineWrapping: true
      });
      this.codeMirror.setSize('660px', '204px');

      // 监听SQL内容变化，通知父组件
      this.codeMirror.on('change', (cm, change) => {
        // 标记为内部更新，避免循环
        if (change.origin !== 'setValue') {
          this.isInternalUpdate = true;
          this.$emit('sql-change', this.getSql());
        }
      });

      // 重新设置 SQL 内容
      if (initialSql) {
        this.codeMirror.setValue(initialSql);
      }
    },

    // 构建脚本校验函数
    buildScriptLintFunction() {
      return async function (text, updateLinting, options, editor) {
        if (text === '') {
          updateLinting(editor, []);
          return;
        }
        if (!text || text === '') {
          return;
        }
        const prefix = text.substring(0, 2);
        const suffix = text.substring(text.length - 1, text.length);
        if (prefix === '${' && suffix === '}') {
          text = text.substring(2, text.length - 1);
        } else {
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
          if (error.message) {
            showAlert('服务端错误：' + error.message);
          } else {
            showAlert(this.$t('dialog.sql.syntaxCheckError'));
          }
          updateLinting(editor, []);
        }
      };
    },

    getDatasetName() {
      return this.datasetName;
    },

    setDatasetName(name) {
      this.datasetName = name || '';
    },

    getSql() {
      if (this.codeMirror) {
        return this.codeMirror.getValue();
      }
      // 如果CodeMirror未初始化，直接返回textarea的值
      const textarea = this.$refs.sqlTextarea;
      if (textarea) {
        return textarea.value;
      }
      return '';
    },

    setSql(sql) {
      if (this.codeMirror) {
        this.codeMirror.setValue(sql || '');
      } else {
        // 如果CodeMirror未初始化，直接设置textarea的值
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
  /* 组件样式可以在这里添加 */
}
</style>
