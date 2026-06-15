<template>
  <!-- eslint-disable -->
  <div class="right-board">
    <a-tabs v-model:active-key="currentTab" type="text" class="center-tabs">
      <a-tab-pane :key="'field'" :tab="t('searchForm.componentProperties')" />
      <a-tab-pane :key="'form'" :tab="t('searchForm.formProperties')" />
    </a-tabs>

    <div class="field-box">
      <div class="right-scrollbar">
        <!-- 组件属性 -->
        <a-form v-show="currentTab === 'field' && showField" size="small" :label-width="90">
          <a-form-item v-if="activeData.changeTag" :label="t('searchForm.componentType')">
            <a-select
              v-model:value="activeData.tagIcon"
              :placeholder="t('searchForm.selectComponentType')"
              :style="{ width: '100%' }"
              @change="tagChange"
            >
              <template v-for="group in tagList" :key="group.label">
                <a-select-opt-group :label="group.label">
                  <a-select-option
                    v-for="item in group.options"
                    :key="item.label"
                    :value="item.tagIcon"
                  >
                    {{ item.label }}
                  </a-select-option>
                </a-select-opt-group>
              </template>
            </a-select>
          </a-form-item>
          <a-form-item v-if="activeData.vModel !== undefined" :label="t('searchForm.fieldName')">
            <a-input v-model:value="activeData.vModel" :placeholder="t('searchForm.enterFieldName')" />
          </a-form-item>
          <a-form-item v-if="activeData.componentName !== undefined" :label="t('searchForm.componentName')">
            {{ activeData.componentName }}
          </a-form-item>
          <a-form-item v-if="activeData.label !== undefined" :label="t('searchForm.title')">
            <a-input v-model:value="activeData.label" :placeholder="t('searchForm.enterTitle')" />
          </a-form-item>
          <a-form-item v-if="activeData.placeholder !== undefined" :label="t('searchForm.placeholder')">
            <a-input v-model:value="activeData.placeholder" :placeholder="t('searchForm.enterPlaceholder')" />
          </a-form-item>

          <a-form-item v-if="activeData.span !== undefined" :label="t('searchForm.formGrid')">
            <a-input-number v-model:value="activeData.span" :max="24" :min="1" @change="spanChange" />
          </a-form-item>
          <a-form-item v-if="activeData.layout === 'rowFormItem'" :label="t('searchForm.gridSpacing')">
            <a-input-number v-model:value="activeData.gutter" :min="0" :placeholder="t('searchForm.gridSpacing')" />
          </a-form-item>
          <a-form-item v-if="activeData.layout === 'rowFormItem'" :label="t('searchForm.layoutMode')">
            <a-radio-group v-model:value="activeData.type" option-type="button" button-style="solid">
              <a-radio-button value="default" size="small">default</a-radio-button>
              <a-radio-button value="flex" size="small">flex</a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item
            v-if="activeData.justify !== undefined && activeData.type === 'flex'"
            :label="t('searchForm.horizontalAlignment')"
          >
            <a-select
              v-model:value="activeData.justify"
              :placeholder="t('searchForm.selectHorizontalAlignment')"
              :style="{ width: '100%' }"
            >
              <a-select-option
                v-for="(item, index) in justifyOptions"
                :key="index"
                :value="item.value"
              >
                {{ item.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item
            v-if="activeData.align !== undefined && activeData.type === 'flex'"
            :label="t('searchForm.verticalAlignment')"
          >
            <a-radio-group v-model:value="activeData.align" option-type="button" button-style="solid">
              <a-radio-button value="top" size="small">top</a-radio-button>
              <a-radio-button value="middle" size="small">middle</a-radio-button>
              <a-radio-button value="bottom" size="small">bottom</a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item v-if="activeData.labelWidth !== undefined" :label="t('searchForm.labelWidth')">
            <a-input-number v-model:value="activeData.labelWidth" :placeholder="t('searchForm.enterLabelWidth')" />
          </a-form-item>
          <a-form-item
            v-if="activeData.style && activeData.style.width !== undefined"
            :label="t('searchForm.componentWidth')"
          >
            <a-input
              v-model:value="activeData.style.width"
              :placeholder="t('searchForm.enterComponentWidth')"
              allow-clear
            />
          </a-form-item>
          <a-form-item v-if="activeData.vModel !== undefined" :label="t('searchForm.defaultValue')">
            <a-input
              :value="setDefaultValue(activeData.defaultValue)"
              :placeholder="t('searchForm.enterDefaultValue')"
              @input="onDefaultValueInput"
            />
          </a-form-item>
          <a-form-item
            v-if="activeData.min !== undefined && activeData.tag !== 'a-checkbox-group'"
            :label="t('searchForm.minValue')"
          >
            <a-input-number v-model:value="activeData.min" :placeholder="t('searchForm.minValue')" />
          </a-form-item>
          <a-form-item
            v-if="activeData.max !== undefined && activeData.tag !== 'a-checkbox-group'"
            :label="t('searchForm.maxValue')"
          >
            <a-input-number v-model:value="activeData.max" :placeholder="t('searchForm.maxValue')" />
          </a-form-item>
          <a-form-item v-if="activeData.step !== undefined" :label="t('searchForm.step')">
            <a-input-number v-model:value="activeData.step" :placeholder="t('searchForm.stepCount')" />
          </a-form-item>
          <a-form-item v-if="activeData['activeText'] !== undefined" :label="t('searchForm.activeText')">
            <a-input v-model:value="activeData['activeText']" :placeholder="t('searchForm.enterActiveText')" />
          </a-form-item>
          <a-form-item v-if="activeData['inactiveText'] !== undefined" :label="t('searchForm.inactiveText')">
            <a-input v-model:value="activeData['inactiveText']" :placeholder="t('searchForm.enterInactiveText')" />
          </a-form-item>
          <a-form-item v-if="activeData['activeValue'] !== undefined" :label="t('searchForm.activeValue')">
            <a-input
              :value="setDefaultValue(activeData['activeValue'])"
              :placeholder="t('searchForm.enterActiveValue')"
              @input="onSwitchValueInput($event, 'activeValue')"
            />
          </a-form-item>
          <a-form-item v-if="activeData['inactiveValue'] !== undefined" :label="t('searchForm.inactiveValue')">
            <a-input
              :value="setDefaultValue(activeData['inactiveValue'])"
              :placeholder="t('searchForm.enterInactiveValue')"
              @input="onSwitchValueInput($event, 'inactiveValue')"
            />
          </a-form-item>
          <a-form-item
            v-if="activeData.type !== undefined && activeData.tag === 'a-date-picker'"
            :label="t('searchForm.timeType')"
          >
            <a-select
              v-model:value="activeData.type"
              :placeholder="t('searchForm.selectTimeType')"
              :style="{ width: '100%' }"
              @change="dateTypeChange"
            >
              <a-select-option
                v-for="(item, index) in dateOptions"
                :key="index"
                :value="item.value"
              >
                {{ item.label }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item v-if="activeData.format !== undefined" :label="t('searchForm.timeFormat')">
            <a-input
              :value="activeData.format"
              :placeholder="t('searchForm.enterTimeFormat')"
              @input="setTimeValue($event)"
            />
          </a-form-item>
          <template v-if="['a-checkbox-group', 'a-radio-group', 'a-select'].indexOf(activeData.tag) > -1">
            <a-divider>{{ t('searchForm.options') }}</a-divider>
            <VueDraggable
              v-model="activeData.options"
              :animation="340"
              group="selectItem"
              handle=".option-drag"
            >
              <div
                v-for="(item, index) in activeData.options"
                :key="index"
                class="select-item"
              >
                <div class="select-line-icon option-drag">
                  <i class="iconfont icon-success" />
                </div>
                <a-input v-model:value="item.label" :placeholder="t('searchForm.optionName')" size="small" />
                <a-input
                  :placeholder="t('searchForm.optionValue')"
                  size="small"
                  :value="item.value"
                  @input="setOptionValue(item, $event)"
                />
                <div class="close-btn select-line-icon" @click="activeData.options.splice(index, 1)">
                  <i class="iconfont icon-delete" />
                </div>
              </div>
            </VueDraggable>
            <div style="margin-left: 20px;">
              <a-button type="link" @click.prevent="addSelectItem">
                {{ t('searchForm.addOption') }}
              </a-button>
            </div>
            <a-divider />
          </template>

          <a-form-item v-if="activeData.optionType !== undefined" :label="t('searchForm.optionStyle')">
            <a-radio-group v-model:value="activeData.optionType" option-type="button" button-style="solid">
              <a-radio-button value="default" size="small">
                {{ t('searchForm.default') }}
              </a-radio-button>
              <a-radio-button value="button" size="small">
                {{ t('searchForm.button') }}
              </a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item
            v-if="activeData.border !== undefined && activeData.optionType === 'default'"
            :label="t('searchForm.bordered')"
          >
            <a-switch v-model:checked="activeData.border" />
          </a-form-item>
          <a-form-item
            v-if="
              activeData.size !== undefined &&
              (activeData.optionType === 'button' || activeData.border)
            "
            :label="t('searchForm.optionSize')"
          >
            <a-radio-group v-model:value="activeData.size" option-type="button" button-style="solid">
              <a-radio-button value="medium" size="small">
                {{ t('searchForm.medium') }}
              </a-radio-button>
              <a-radio-button value="small" size="small">
                {{ t('searchForm.small') }}
              </a-radio-button>
              <a-radio-button value="mini" size="small">
                {{ t('searchForm.mini') }}
              </a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item v-if="activeData.clearable !== undefined" :label="t('searchForm.clearable')">
            <a-switch v-model:checked="activeData.clearable" />
          </a-form-item>
          <a-form-item v-if="activeData.showTip !== undefined" :label="t('searchForm.showTip')">
            <a-switch v-model:checked="activeData.showTip" />
          </a-form-item>

          <a-form-item v-if="activeData.readonly !== undefined" :label="t('searchForm.readonly')">
            <a-switch v-model:checked="activeData.readonly" />
          </a-form-item>
          <a-form-item v-if="activeData.disabled !== undefined" :label="t('searchForm.disabled')">
            <a-switch v-model:checked="activeData.disabled" />
          </a-form-item>
          <a-form-item v-if="activeData.tag === 'a-select'" :label="t('searchForm.multiple')">
            <a-switch v-model:checked="activeData.multiple" @change="multipleChange" />
          </a-form-item>
          <a-form-item v-if="activeData.required !== undefined" :label="t('searchForm.required')">
            <a-switch v-model:checked="activeData.required" />
          </a-form-item>

          <template v-if="activeData.layoutTree">
            <a-divider>{{ t('searchForm.layoutStructureTree') }}</a-divider>
            <a-tree :data="layoutTree" node-key="__key">
              <template #default="{ node, data }">
                <span class="node-label">
                  {{ data.componentName || `${data.label}: ${data.vModel}` }}
                </span>
              </template>
            </a-tree>
          </template>
        </a-form>
        <!-- 表单属性 -->
        <a-form v-show="currentTab === 'form'" size="small" :label-width="90">
          <a-form-item :label="t('searchForm.formName')">
            <a-input v-model:value="formConf.formRef" :placeholder="t('searchForm.enterFormName')" />
          </a-form-item>
          <a-form-item :label="t('searchForm.formModel')">
            <a-input v-model:value="formConf.formModel" :placeholder="t('searchForm.enterFormModel')" />
          </a-form-item>
          <a-form-item :label="t('searchForm.formRules')">
            <a-input v-model:value="formConf.formRules" :placeholder="t('searchForm.enterFormRules')" />
          </a-form-item>
          <a-form-item :label="t('searchForm.formSize')">
            <a-radio-group v-model:value="formConf.size" option-type="button" button-style="solid">
              <a-radio-button value="medium" size="small">
                {{ t('searchForm.medium') }}
              </a-radio-button>
              <a-radio-button value="small" size="small">
                {{ t('searchForm.small') }}
              </a-radio-button>
              <a-radio-button value="mini" size="small">
                {{ t('searchForm.mini') }}
              </a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item :label="t('searchForm.labelPosition')">
            <a-radio-group v-model:value="formConf.labelPosition" option-type="button" button-style="solid">
              <a-radio-button value="left" size="small">
                {{ t('searchForm.leftAlign') }}
              </a-radio-button>
              <a-radio-button value="right" size="small">
                {{ t('searchForm.rightAlign') }}
              </a-radio-button>
              <a-radio-button value="top" size="small">
                {{ t('searchForm.topAlign') }}
              </a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item :label="t('searchForm.labelWidth')">
            <a-input-number v-model:value="formConf.labelWidth" :placeholder="t('searchForm.labelWidth')" />
          </a-form-item>
          <a-form-item :label="t('searchForm.gutter')">
            <a-input-number v-model:value="formConf.gutter" :min="0" :placeholder="t('searchForm.gutter')" />
          </a-form-item>
          <a-form-item :label="t('searchForm.disableForm')">
            <a-switch v-model:checked="formConf.disabled" />
          </a-form-item>
          <a-form-item :label="t('searchForm.formButtons')">
            <a-switch v-model:checked="formConf.formBtns" />
          </a-form-item>
          <a-form-item :label="t('searchForm.showUnfocusedBorder')">
            <a-switch v-model:checked="formConf.unFocusedComponentBorder" />
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { VueDraggable } from 'vue-draggable-plus'
import { isNumberStr } from '../utils'
import { inputComponents, selectComponents } from '../utils/config'
import { deepCopy } from '@/utils/comnon'
import type { FormField, FormConf } from '../utils/types'

const props = defineProps<{
  showField: boolean
  activeData: FormField
  formConf: FormConf
}>()

const emit = defineEmits<{
  (e: 'tag-change', target: FormField): void
}>()

const { t } = useI18n()

const currentTab = ref<'field' | 'form'>('field')

interface SelectOpt {
  label: string
  value: string
}
const justifyOptions = ref<SelectOpt[]>([
  { label: 'start', value: 'start' },
  { label: 'end', value: 'end' },
  { label: 'center', value: 'center' },
  { label: 'space-around', value: 'space-around' },
  { label: 'space-between', value: 'space-between' }
])

const dateTimeFormat: Record<string, string> = {
  date: 'YYYY-MM-DD',
  month: 'YYYY-MM',
  year: 'YYYY',
  datetime: 'YYYY-MM-DD HH:mm:ss'
}

const dateTypeOptions: SelectOpt[] = [
  { label: t('searchForm.date') as string, value: 'date' },
  { label: t('searchForm.month') as string, value: 'month' },
  { label: t('searchForm.year') as string, value: 'year' },
  { label: t('searchForm.datetime') as string, value: 'datetime' }
]

const dateOptions = computed(() => {
  if (props.activeData && props.activeData.type !== undefined && props.activeData.tag === 'a-date-picker') {
    return dateTypeOptions
  }
  return []
})

const tagList = computed(() => [
  { label: t('searchForm.inputComponents') as string, options: inputComponents },
  { label: t('searchForm.selectComponents') as string, options: selectComponents }
])

const layoutTree = computed(() => deepCopy([props.activeData]))

function addSelectItem(): void {
  // eslint-disable-next-line vue/no-mutating-props
  props.activeData.options?.push({ label: '', value: '' })
}

function setOptionValue(item: { value: unknown }, val: string): void {
  item.value = isNumberStr(val) ? +val : val
}

function setDefaultValue(val: unknown): string | unknown {
  if (Array.isArray(val)) return val.join(',')
  if (typeof val === 'string' || typeof val === 'number') return val
  if (typeof val === 'boolean') return `${val}`
  return val
}

function onDefaultValueInput(str: string): void {
  const ad = props.activeData
  if (Array.isArray(ad.defaultValue)) {
    ad.defaultValue = str.split(',').map(v => (isNumberStr(v) ? +v : v))
  } else if (['true', 'false'].indexOf(str) > -1) {
    ad.defaultValue = JSON.parse(str)
  } else {
    ad.defaultValue = isNumberStr(str) ? +str : str
  }
}

function onSwitchValueInput(val: string, name: 'activeValue' | 'inactiveValue'): void {
  const ad = props.activeData as Record<string, unknown>
  if (['true', 'false'].indexOf(val) > -1) {
    ad[name] = JSON.parse(val)
  } else {
    ad[name] = isNumberStr(val) ? +val : val
  }
}

function setTimeValue(val: string): void {
  const ad = props.activeData
  ad.defaultValue = null
  ad.format = val
}

function spanChange(val: number): void {
  // eslint-disable-next-line vue/no-mutating-props
  props.formConf.span = val
}

function multipleChange(val: boolean): void {
  // eslint-disable-next-line vue/no-mutating-props
  props.activeData.defaultValue = val ? [] : ''
}

function dateTypeChange(val: string): void {
  setTimeValue(dateTimeFormat[val] || '')
}

function tagChange(tagIcon: string): void {
  let target = inputComponents.find(item => item.tagIcon === tagIcon)
  if (!target) target = selectComponents.find(item => item.tagIcon === tagIcon)
  if (target) emit('tag-change', target)
}
</script>

<style scoped>
.right-scrollbar {
  padding: 12px 18px 15px 15px;
  height: var(--dialog-height);
}
.right-board {
  width: 350px;
  position: absolute;
  right: 0;
  top: 0;
  padding-top: 3px;
}
.right-board .field-box {
  position: relative;
  height: var(--dialog-height);
  box-sizing: border-box;
  overflow-y: auto;
}
.right-board .u-scrollbar {
  height: 100%;
}
.select-item {
  display: flex;
  border: 1px dashed #fff;
  box-sizing: border-box;
}
.select-item .close-btn {
  cursor: pointer;
  color: #f56c6c;
}
.select-item .a-input + .a-input {
  margin-left: 4px;
}
.select-item + .select-item {
  margin-top: 4px;
}
.select-item.sortable-chosen {
  border: 1px dashed #409eff;
}
.select-line-icon {
  line-height: 32px;
  font-size: 22px;
  padding: 0 4px;
  color: #777;
}
.option-drag {
  cursor: move;
}
.node-label {
  font-size: 14px;
}
</style>
