<template>
  <a-modal
    :title="t('dialog.methodSelect.title')"
    :width="600"
    :open="visible"
    :style="{ top: '25vh' }"
    @cancel="closeDialog"
  >
    <div v-if="loading" class="loading-text">
      <a-spin />
      <span style="margin-left: 8px;">{{ t('dialog.methodSelect.load') }}</span>
    </div>
    <div v-else class="table-wrapper">
      <table class="table-container">
        <thead>
          <tr>
            <td><span>{{ t('dialog.methodSelect.methodName') }}</span></td>
            <td><span>{{ t('dialog.methodSelect.select') }}</span></td>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(methodItem, index) in methods" :key="index" style="height: 35px;">
            <td><span>{{ methodItem }}</span></td>
            <td>
              <a-button
                type="primary"
                shape="circle"
                @click="selectMethod(methodItem)"
              >
                <template #icon><i class="iconfont icon-hand-up"></i></template>
              </a-button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <a-button @click="closeDialog" style="margin-right: 10px;">
        {{ t('dialog.common.cancel') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * MethodSelectDialog SpringBean 方法选择弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true + beanId → loadMethods 拉取方法列表
 * 2. 用户选择方法 → emit('save', method) + emit('close')
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UButton（自定义）→ a-modal/a-button
 * - v-loading 自定义指令 → a-spin
 * - this.$emit → defineEmits
 * - watch visible → 监听 props.visible
 */
import { ref, watch } from 'vue'
import { showAlert } from '@/utils/comnon'
import { loadMethods } from '@/api/designer'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'MethodSelectDialog' })


const { t } = useI18n()
const props = withDefaults(
  defineProps<{
    visible: boolean
    beanId?: string
  }>(),
  { visible: false, beanId: '' }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', method: string): void
}>()

const loading = ref<boolean>(false)
const methods = ref<string[]>([])

watch(
  () => props.visible,
  (val) => {
    if (val && props.beanId) {
      methods.value = []
      loadMethodsList()
    }
  }
)

/** 关闭弹窗 */
function closeDialog(): void {
  emit('close')
}

/** 拉取 beanId 的方法列表 */
async function loadMethodsList(): Promise<void> {
  loading.value = true
  try {
    methods.value = (await loadMethods(props.beanId)) || []
  } catch (error: any) {
    if (error?.msg) {
      showAlert(t('dialog.save.serverError') + t('colon') + error.msg, {
        useHTMLString: true
      })
    } else {
      showAlert(t('methodSelect.loadFail', { beanId: props.beanId }))
    }
  } finally {
    loading.value = false
  }
}

/** 选中方法后关闭弹窗 */
function selectMethod(methodItem: string): void {
  emit('save', methodItem)
  emit('close')
}
</script>

<style scoped>
.loading-text {
  padding: 20px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
