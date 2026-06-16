<template>
  <div>
    <a-row class="condition-config-row" align="middle">
      <a-col :span="8">
        <a-checkbox v-model:checked="linkChecked" @change="onLinkChange">
          {{ t('dialog.propCondition.link') }}
        </a-checkbox>
      </a-col>
      <a-col :span="8" v-show="linkChecked">
        <a-select
            v-model:value="localLinkTargetWindow"
            style="width: 120px"
            @change="onLinkTargetChange"
            :options="linkTargetOptions"
        />
      </a-col>
      <a-col :span="8" v-show="linkChecked">
        <a-button @click="configLinkParameter">
          {{ t('dialog.propCondition.urlParameter') }}
        </a-button>
      </a-col>
    </a-row>

    <a-row v-show="linkChecked" class="condition-config-row" align="middle">
      <a-col :span="8">
      </a-col>
      <a-col :span="8">
        <a-input
            v-show="linkChecked"
            v-model:value="localLinkUrl"
            style="width: 250px"
            :placeholder="t('dialog.propCondition.linkUrlPlaceholder')"
            @change="onLinkUrlChange" />
      </a-col>
    </a-row>

    <URLParameterDialog
      v-model:visible="urlParameterDialogVisible"
      :parameters="localLinkParameters"
      @parameters-change="handleUrlParameterChange"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * LinkConfig 链接条件配置（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - u-row/u-col/u-checkbox/u-input/u-button/u-select/u-option（自定义）→ a-row/a-col/a-checkbox/a-input/a-button/a-select
 * - v-model 全部迁移到 v-model:value
 * - 子弹窗 URLParameterDialog 的 saveAfter → save
 */
import { ref, watch, onMounted } from 'vue'
import { showAlert } from '@/utils/comnon'
import configOptions from '../constants/config-options'
import URLParameterDialog, { type UrlParameterItem } from '@/views/report/designer/resource-panel/property-panel/url-parameter-dialog/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'LinkConfig' })


const { t } = useI18n()
const props = withDefaults(
  defineProps<{
    linkUrl?: string
    linkTargetWindow?: string
    linkParameters?: UrlParameterItem[]
  }>(),
  {
    linkUrl: '',
    linkTargetWindow: '',
    linkParameters: () => []
  }
)

const emit = defineEmits<{
  (
    e: 'link-change',
    payload: {
      checked: boolean
      linkUrl: string | null
      linkTargetWindow: string | null
      linkParameters: UrlParameterItem[] | null
    }
  ): void
}>()

const linkChecked = ref<boolean>(false)
const localLinkUrl = ref<string>('')
const localLinkTargetWindow = ref<string>('')
const localLinkParameters = ref<UrlParameterItem[]>([])

const urlParameterDialogVisible = ref<boolean>(false)
const linkTargetOptions = ref<{ value: string; label: string }[]>([])

/**
 * 加载链接属性
 */
const loadLinkProperties = (): void => {
  linkChecked.value = props.linkUrl != null
  if (linkChecked.value) {
    localLinkUrl.value = props.linkUrl || ''
    localLinkTargetWindow.value = props.linkTargetWindow || ''
  } else {
    localLinkUrl.value = ''
    localLinkTargetWindow.value = ''
  }
}

onMounted(() => {
  linkTargetOptions.value = configOptions.getLinkTargetOptions()
})

watch(
  () => props.linkUrl,
  () => {
    loadLinkProperties()
  },
  { immediate: true }
)

watch(
  () => props.linkTargetWindow,
  () => {
    loadLinkProperties()
  },
  { immediate: true }
)

watch(
  () => props.linkParameters,
  (newVal) => {
    localLinkParameters.value = newVal || []
  },
  { immediate: true }
)

const onLinkChange = (): void => {
  emit('link-change', {
    checked: linkChecked.value,
    linkUrl: linkChecked.value ? localLinkUrl.value : null,
    linkTargetWindow: linkChecked.value ? localLinkTargetWindow.value : null,
    linkParameters: linkChecked.value ? localLinkParameters.value : null
  })
}

const onLinkUrlChange = (): void => {
  if (linkChecked.value) {
    emit('link-change', {
      checked: true,
      linkUrl: localLinkUrl.value,
      linkTargetWindow: localLinkTargetWindow.value,
      linkParameters: localLinkParameters.value
    })
  }
}

const onLinkTargetChange = (): void => {
  if (linkChecked.value) {
    emit('link-change', {
      checked: true,
      linkUrl: localLinkUrl.value,
      linkTargetWindow: localLinkTargetWindow.value,
      linkParameters: localLinkParameters.value
    })
  }
}

const configLinkParameter = (): void => {
  if (!localLinkUrl.value) {
    showAlert(t('dialog.propCondition.linkUrl'))
    return
  }

  if (!localLinkParameters.value) {
    localLinkParameters.value = []
  }

  urlParameterDialogVisible.value = true
}

const handleUrlParameterChange = (parameters: UrlParameterItem[]): void => {
  // 子弹窗回传 url 参数项，触发 link-change 让上层写入
  localLinkParameters.value = parameters || []
  emit('link-change', {
    checked: linkChecked.value,
    linkUrl: linkChecked.value ? localLinkUrl.value : null,
    linkTargetWindow: linkChecked.value ? localLinkTargetWindow.value : null,
    linkParameters: linkChecked.value ? localLinkParameters.value : null
  })
}
</script>
