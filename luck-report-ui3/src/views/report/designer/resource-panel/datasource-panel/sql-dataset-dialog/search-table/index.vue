<template>
  <div style="width: 210px; height: 450px;">
    <div>
      <div class="u-inline" style="vertical-align: middle;">
        <a-input
          v-model:value="searchKeyword"
          :placeholder="t('dialog.sql.search')"
          style="width: 160px;"
        />
      </div>
      <div class="u-inline" style="vertical-align: middle; margin-left: 5px">
          <a-button
              type="primary"
              class="search-bth"
          >
            <template #icon><i class="iconfont icon-search"></i></template>
          </a-button>
      </div>
    </div>
    <div class="table-wrapper" style="margin-top: 5px;">
      <a-spin :spinning="loading">
        <table class="table-container">
          <thead>
            <tr>
              <th style="width: 120px;"><span>{{ t('dialog.sql.tableName') }}</span></th>
              <th style="width: 35px;"><span>{{ t('dialog.sql.type') }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(table, index) in filteredTables"
              :key="`${table.name}-${index}`"
              style="height: 30px"
              @dblclick="addSql(table.name)"
            >
              <td>
                <a href="javascript:void(0)" :title="t('dialog.sql.addSql')" @click="addSql(table.name)">
                  {{ table.name }}
                </a>
              </td>
              <td>
                <span :style="{color: table.type === 'TABLE' ? '#49a700' : '#8B2252'}">
                  {{ table.type === 'TABLE' ? t('dialog.sql.table') : t('dialog.sql.view') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SearchTable 数据库表搜索组件（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UInput/UButton（自定义）→ a-input/a-button
 * - v-loading 自定义指令 → a-spin
 * - this.$emit → defineEmits
 * - props/triggerLoad 仍由父组件控制，loadDatabaseTables 加载数据库表
 */
import { ref, computed, watch } from 'vue'
import { showAlert } from '@/utils/comnon'
import { buildDatabaseTables } from '@/api/designer'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'SearchTable' })


const { t } = useI18n()
interface DatasourceData {
  type?: string
  username?: string
  password?: string
  driver?: string
  url?: string
  name?: string
  [key: string]: unknown
}

interface TableItem {
  name: string
  type: string
}

const props = withDefaults(
  defineProps<{
    datasourceData?: DatasourceData | null
    triggerLoad?: boolean
  }>(),
  { datasourceData: null, triggerLoad: false }
)

const emit = defineEmits<{
  (e: 'add', sql: string): void
  (e: 'load-complete'): void
}>()

const tables = ref<TableItem[]>([])
const searchKeyword = ref<string>('')
const loading = ref<boolean>(false)

const filteredTables = computed<TableItem[]>(() => {
  if (!searchKeyword.value) {
    return tables.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return tables.value.filter((table) =>
    table.name.toLowerCase().includes(keyword)
  )
})

watch(
  () => props.triggerLoad,
  (newVal) => {
    if (newVal) {
      loadDatabaseTables()
      emit('load-complete')
    }
  }
)

function setTables(newTables: TableItem[]): void {
  tables.value = newTables
}

function addSql(tableName: string): void {
  const sql = `select * from ${tableName}`
  emit('add', sql)
}

/**
 * 加载数据库表格列表
 */
async function loadDatabaseTables(): Promise<void> {
  if (!props.datasourceData) return

  searchKeyword.value = ''
  loading.value = true
  const type = props.datasourceData.type
  const parameters: Record<string, unknown> = { type }

  if (type === 'jdbc') {
    parameters.username = props.datasourceData.username
    parameters.password = props.datasourceData.password
    parameters.driver = props.datasourceData.driver
    parameters.url = props.datasourceData.url
  } else if (type === 'buildin') {
    parameters.name = props.datasourceData.name
    // 确保 type 参数被正确设置
    parameters.type = 'buildin'
  }

  try {
    const result = await buildDatabaseTables(parameters)
    setTables(result as TableItem[])
  } catch (error: any) {
    if (error?.msg) {
      showAlert(t('dialog.save.serverError') + t('colon') + error.msg, {
        useHTMLString: true
      })
    } else {
      showAlert(t('dialog.sql.loadFail'))
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>

.table-container {
  table-layout: fixed;
  width: 100%;
  font-size: 12px;
  width: 100%;
}
.table-container th,
.table-container td {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.table-container td {
    padding: 4px;
    word-wrap: break-word;
}
</style>
