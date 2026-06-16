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
      <div class="sql-editor-cm">
        <CodeMirror
          v-model="sqlContent"
          :basic-setup="true"
          placeholder="select username,dept_id from employee where dept_id=:deptId"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SqlEditor SQL 数据集编辑器（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - CodeMirror 5 → 6，封装为 <CodeMirror v-model="sqlContent"> 响应式组件
 * - 父组件的命令式 API（getSql/setSql）通过暴露函数读/写 sqlContent ref 维持不变
 * - 通过 isSilentUpdate 标志位避免父组件 prop 变化 → 内部修改 → 再回传的回环
 */
import { ref, watch } from 'vue'
import CodeMirror from '@/components/code-mirror/index.vue'
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
const sqlContent = ref<string>(props.sql)
const isSilentUpdate = ref<boolean>(false)

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
    sqlContent.value = newVal || ''
  }
)

watch(sqlContent, (val) => {
  if (isSilentUpdate.value) {
    isSilentUpdate.value = false
    return
  }
  isSilentUpdate.value = true
  emit('sql-change', val)
})

/**
 * 通知父组件数据集名称已变化
 */
function handleDatasetNameChange(): void {
  emit('dataset-name-change', getDatasetName())
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
  return sqlContent.value
}

/**
 * 设置SQL内容
 * @param sql 要设置的SQL内容，可为空
 */
function setSql(sql: string): void {
  isSilentUpdate.value = true
  sqlContent.value = sql || ''
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

.sql-editor-cm {
  margin-top: 5px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
</style>
