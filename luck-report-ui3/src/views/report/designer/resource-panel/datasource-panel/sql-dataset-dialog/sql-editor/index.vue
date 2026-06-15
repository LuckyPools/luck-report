<template>
  <div class="sql-editor-container">
    <div class="sql-editor-row">
      {{ t('dialog.sql.datasetName') }}：
      <div class="u-inline">
        <a-input
          v-model:value="datasetName"
          class="sql-editor-name-input"
          @input="handleDatasetNameChange"
        />
      </div>
    </div>

    <div class="sql-editor-row" style="margin-top: 5px">
      <span>
         SQL(<span class="sql-editor-desc">{{ t('dialog.sql.desc', { syntax: '${表达式...}' }) }}</span>)
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

<script setup lang="ts">
/**
 * SqlEditor SQL 数据集编辑器（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UInput（自定义）→ a-input
 * - this.$emit → defineEmits
 * - this.$refs.sqlTextarea → sqlTextareaRef.value
 * - mounted/beforeUnmount → onMounted/onBeforeUnmount
 * - 通过 defineExpose 暴露 getSql/setSql/getDatasetName 方法给父组件调用
 *
 * CodeMirror 集成说明：
 * - 保留原有 CodeMirror 实例，不变（外部命令式 API 难以迁移为响应式）
 * - 保留 isSilentUpdate 标志位避免 setValue 触发的 change 事件回环
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import CodeMirror from 'codemirror'
import 'codemirror/mode/sql/sql.js'
import 'codemirror/addon/hint/show-hint.js'
import 'codemirror/addon/lint/lint.js'
import { showAlert } from '@/utils/comnon'
import { scriptValidation } from '@/api/designer'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'SqlEditor' })


const { t } = useI18n()
const props = withDefaults(
  defineProps<{
    name?: string
    sql?: string
  }>(),
  { name: '', sql: '' }
)

const emit = defineEmits<{
  (e: 'dataset-name-change', name: string): void
  (e: 'sql-change', sql: string): void
}>()

const datasetName = ref<string>(props.name)
const codeMirror = ref<any>(null)
const isSilentUpdate = ref<boolean>(false)
const sqlTextareaRef = ref<HTMLTextAreaElement | null>(null)

watch(
  () => props.name,
  (newVal) => {
    datasetName.value = newVal || ''
  }
)

watch(
  () => props.sql,
  (newVal) => {
    if (isSilentUpdate.value) {
      isSilentUpdate.value = false
      return
    }
    setSql(newVal || '')
  }
)

onBeforeUnmount(() => {
  if (codeMirror.value) {
    codeMirror.value.off('change')
    codeMirror.value.toTextArea()
    codeMirror.value = null
  }
})

onMounted(() => {
  initCodeMirror(props.sql)
})

/**
 * 通知父组件数据集名称已变化
 */
function handleDatasetNameChange(): void {
  emit('dataset-name-change', getDatasetName())
}

/**
 * 初始化或更新CodeMirror编辑器
 * @param initialSql 初始SQL内容，可为空
 */
function initCodeMirror(initialSql: string = ''): void {
  const textarea = sqlTextareaRef.value
  if (!textarea) return

  if (codeMirror.value) {
    codeMirror.value.setValue(initialSql || '')
    return
  }

  if (initialSql) {
    textarea.value = initialSql
  }

  const cm = CodeMirror.fromTextArea(textarea, {
    mode: 'text/x-sql',
    lineNumbers: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
    lint: {
      getAnnotations: buildScriptLintFunction(),
      async: true
    },
    lineWrapping: true
  })
  cm.setSize('100%', '204px')

  cm.on('change', (_cm: any, change: any) => {
    if (change.origin !== 'setValue') {
      isSilentUpdate.value = true
      emit('sql-change', getSql())
    }
  })

  codeMirror.value = cm
}

/**
 * 构建脚本校验函数，用于CodeMirror的lint插件
 * 仅对 ${...} 格式的表达式进行语法校验
 */
function buildScriptLintFunction(): (text: string, updateLinting: any, options: any, editor: any) => Promise<void> {
  return async (text, updateLinting, _options, editor) => {
    if (!text) {
      updateLinting(editor, [])
      return
    }

    const prefix = text.substring(0, 2)
    const suffix = text.substring(text.length - 1)
    if (prefix !== '${' || suffix !== '}') {
      return
    }

    const expression = text.substring(2, text.length - 1)

    try {
      const result = await scriptValidation(expression)
      if (result) {
        for (const item of result as any[]) {
          item.from = { line: item.line - 1 }
          item.to = { line: item.line - 1 }
        }
        updateLinting(editor, result)
      } else {
        updateLinting(editor, [])
      }
    } catch (error: any) {
      if (error?.msg) {
        showAlert(t('dialog.save.serverError') + t('colon') + error.msg, {
          useHTMLString: true
        })
      } else {
        showAlert(t('dialog.sql.syntaxCheckError'))
      }
      updateLinting(editor, [])
    }
  }
}

/**
 * 获取数据集名称
 */
function getDatasetName(): string {
  return datasetName.value
}

/**
 * 获取SQL内容
 */
function getSql(): string {
  if (codeMirror.value) {
    return codeMirror.value.getValue()
  }
  const textarea = sqlTextareaRef.value
  if (textarea) {
    return textarea.value
  }
  return ''
}

/**
 * 设置SQL内容
 * @param sql 要设置的SQL内容，可为空
 */
function setSql(sql: string): void {
  if (codeMirror.value) {
    codeMirror.value.setValue(sql || '')
  } else {
    const textarea = sqlTextareaRef.value
    if (textarea) {
      textarea.value = sql || ''
    }
  }
}

defineExpose({
  getDatasetName,
  getSql,
  setSql
})
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
