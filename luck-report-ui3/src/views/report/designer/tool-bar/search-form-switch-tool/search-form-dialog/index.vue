<template>
  <a-modal
    top="20px"
    :title="t('dialog.searchForm.title')"
    :width="1200"
    :open="visible"
    :mask-closable="false"
    @cancel="handleClose"
  >
    <div class="search-form-dialog-content">
      <SearchForm
        :search-form-config="searchFormConfig"
        ref="searchFormDesigner"
      />
    </div>
    <template #footer>
      <a-button type="primary" style="margin-right: 10px;" @click="handleClose">
        {{ t('dialog.common.cancel') }}
      </a-button>
      <a-button type="primary" @click="handleOk">
        {{ t('dialog.common.ok') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * SearchFormDialog 查询表单设计弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=false → true 时若 context.reportDef.searchForm 存在则深拷贝一份到 searchFormConfig
 * 2. SearchForm 子组件接收到 searchFormConfig 后回填 formConf + drawingList
 * 3. 用户编辑完成后点击确定 → buildData() 调用子组件 AssembleFormData
 * 4. 组装好的 formData 写回 reportDef.searchForm → updateReportDef
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - UDialog/UButton（自定义）→ a-modal/a-button
 * - slot="footer" → #footer
 * - data()/methods/watch → ref + 普通函数 + watch
 * - mapGetters / Vuex → useReportStore
 * - 父级调用 :visible.sync → v-model:visible 双向
 */
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SearchForm from '@/views/report/designer/search-form/index.vue'
import { deepClone } from '@/views/report/designer/search-form/utils'
import { useReportStore } from '@/store/modules/report'
import { updateReportDef } from '@/utils/contextActions'
import type { ReportSearchForm, ReportContext, ReportDef } from '@/types/report-def'

defineOptions({ name: 'SearchFormDialog' })

/** SearchForm 子组件实例上需要调用的方法（子组件仍为 Options API，这里以 any 访问） */
interface SearchFormDesignerInstance {
  AssembleFormData(): void
  formData: Record<string, unknown>
}

const props = withDefaults(
  defineProps<{ visible: boolean }>(),
  { visible: false }
)

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const { t } = useI18n()
void t // 暂未直接使用，保留 i18n 入口

const report = useReportStore()

/** 查询表单设计对象（编辑中状态，从 store 深拷贝而来） */
const searchFormConfig = ref<ReportSearchForm | null>(null)

/** SearchForm 子组件 ref */
const searchFormDesigner = ref<SearchFormDesignerInstance | null>(null)

/** 当前报表 context（兼容 null 场景） */
const context = computed<ReportContext | null>(() => report.getContext)

/**
 * 打开弹窗时，把 store 中已有的 searchForm 配置深拷贝到本地编辑态
 */
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      const ctx = context.value
      const existing: ReportSearchForm | undefined = ctx?.reportDef?.searchForm
      if (existing) {
        searchFormConfig.value = deepClone(existing) as ReportSearchForm
      } else {
        searchFormConfig.value = null
      }
    }
  }
)

/**
 * 调起 SearchForm 子组件收集最新 formData，写回 context.reportDef.searchForm
 */
function buildData(): void {
  const designer = searchFormDesigner.value
  if (!designer) return
  designer.AssembleFormData()
  const formData = designer.formData as ReportSearchForm
  const ctx = context.value
  if (!ctx) return
  const newReportDef: ReportDef = deepClone(ctx.reportDef) as ReportDef
  newReportDef.searchForm = deepClone(formData) as ReportSearchForm
  updateReportDef(newReportDef)
}

function handleClose(): void {
  emit('update:visible', false)
}

function handleOk(): void {
  buildData()
  emit('update:visible', false)
}
</script>

<style scoped>
.search-form-dialog-content {
  height: 600px;
  padding: 0;
}
</style>
