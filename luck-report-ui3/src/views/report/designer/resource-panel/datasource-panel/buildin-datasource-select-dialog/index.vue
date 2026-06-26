<template>
  <a-modal
    :title="t('dialog.buildin.selectDatasource')"
    :width="600"
    :open="visible"
    @cancel="closeDialog"
  >
    <a-spin :spinning="loading">
      <div class="table-wrapper">
        <table class="table-container">
          <thead>
            <tr>
              <td><span>{{ t('dialog.buildin.datasourceName') }}</span></td>
              <td><span>{{ t('dialog.buildin.select') }}</span></td>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="name in buildinDatasources"
              :key="name"
              style="height: 35px;"
            >
              <td><span>{{ name }}</span></td>
              <td>
                <a-button
                  type="link"
                  class="select-btn"
                  @click="selectDatasource(name)"
                >
                  <template #icon><i class="iconfont icon-hand-up"></i></template>
                </a-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </a-spin>

    <template #footer>
      <a-button @click="closeDialog" style="margin-right: 10px;">
        {{ t('dialog.common.cancel') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * BuildinDatasourceSelectDialog 内置数据源选择弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → loadBuildinDatasources 拉取内置数据源列表
 * 2. 用户点击某行 → 查重 → emit('select', { name, type: 'buildin' })
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UButton（自定义）→ a-modal/a-button
 * - v-loading 自定义指令 → a-spin
 * - this.$emit → defineEmits
 */
import { ref, watch } from 'vue'
import { showAlert } from '@/utils/comnon'
import { setDirty } from '@/utils/table'
import { loadBuildinDatasources } from '@/api/designer'
import type { ReportDatasource } from '@/types/report-def'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'BuildinDatasourceSelectDialog' })


const { t } = useI18n()
const props = withDefaults(
  defineProps<{
    visible: boolean
    datasources?: ReportDatasource[]
  }>(),
  { visible: false, datasources: () => [] }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', payload: { name: string; type: 'buildin' }): void
}>()

const loading = ref<boolean>(false)
const buildinDatasources = ref<string[]>([])

watch(
  () => props.visible,
  (val) => {
    if (val) {
      buildinDatasources.value = []
      loading.value = true
      loadList()
    }
  }
)

/** 关闭弹窗 */
function closeDialog(): void {
  emit('close')
}

/** 拉取内置数据源列表 */
async function loadList(): Promise<void> {
  try {
    buildinDatasources.value = (await loadBuildinDatasources()) || []
  } catch (error: any) {
    if (error?.msg) {
      showAlert(t('dialog.save.serverError') + t('colon') + error.msg, {
        useHTMLString: true
      })
    } else {
      showAlert(t('dialog.buildin.loadFail'))
    }
  } finally {
    loading.value = false
  }
}

/** 选中数据源：查重后 emit('select') */
function selectDatasource(name: string): void {
  for (const ds of props.datasources || []) {
    if (ds.name === name) {
      showAlert(
        `${t('dialog.buildin.datasource')}[${name}]${t('dialog.buildin.datasourceExist')}`
      )
      return
    }
  }

  emit('select', { name, type: 'buildin' })
  setDirty()
  closeDialog()
}
</script>

<style scoped>

</style>
