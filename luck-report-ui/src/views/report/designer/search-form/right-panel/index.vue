<template>
  <!-- eslint-disable -->
  <div class="right-board">
    <u-tabs v-model="currentTab" type="text" class="center-tabs">
      <u-tab-pane :label="$t('searchForm.componentProperties')" index="field" />
      <u-tab-pane :label="$t('searchForm.formProperties')" index="form" />
    </u-tabs>

    <div class="field-box">
      <div class="right-scrollbar">
        <!-- 组件属性 -->
        <u-form v-show="currentTab==='field' && showField" size="small" :label-width="90">
          <u-form-item v-if="activeData.changeTag" :label="$t('searchForm.componentType')">
            <u-select
              v-model="activeData.tagIcon"
              :placeholder="$t('searchForm.selectComponentType')"
              :style="{width: '100%'}"
              @change="tagChange"
            >
              <template v-for="group in tagList">
                <div v-for="item in group.options" :key="item.label">
                  <u-option
                    :label="item.label"
                    :value="item.tagIcon"
                  >
                    {{ item.label }}
                  </u-option>
                </div>
              </template>
            </u-select>
          </u-form-item>
          <u-form-item v-if="activeData.vModel!==undefined" :label="$t('searchForm.fieldName')">
            <u-input v-model="activeData.vModel" :placeholder="$t('searchForm.enterFieldName')" />
          </u-form-item>
          <u-form-item v-if="activeData.componentName!==undefined" :label="$t('searchForm.componentName')">
            {{ activeData.componentName }}
          </u-form-item>
          <u-form-item v-if="activeData.label!==undefined" :label="$t('searchForm.title')">
            <u-input v-model="activeData.label" :placeholder="$t('searchForm.enterTitle')" />
          </u-form-item>
          <u-form-item v-if="activeData.placeholder!==undefined" :label="$t('searchForm.placeholder')">
          <u-input v-model="activeData.placeholder" :placeholder="$t('searchForm.enterPlaceholder')" />
        </u-form-item>

        <u-form-item v-if="activeData.span!==undefined" :label="$t('searchForm.formGrid')">
          <u-input-number v-model="activeData.span" :max="24" :min="1" @change="spanChange" />
        </u-form-item>
        <u-form-item v-if="activeData.layout==='rowFormItem'" :label="$t('searchForm.gridSpacing')">
          <u-input-number v-model="activeData.gutter" :min="0" :placeholder="$t('searchForm.gridSpacing')" />
        </u-form-item>
        <!-- 行容器暂不开放布局模式/水平排列/垂直排列配置项，按需放开 -->
        <!--
        <u-form-item v-if="activeData.layout==='rowFormItem'" :label="$t('searchForm.layoutMode')">
          <u-radio-group  v-model="activeData.type" button>
            <u-radio label="default" size="small">
              {{ $t('searchForm.layoutModeDefault') }}
            </u-radio>
            <u-radio label="flex" size="small">
              {{ $t('searchForm.layoutModeFlex') }}
            </u-radio>
          </u-radio-group>
        </u-form-item>
        <u-form-item v-if="activeData.justify!==undefined&&activeData.type==='flex'" :label="$t('searchForm.horizontalAlignment')">
          <u-select v-model="activeData.justify" :placeholder="$t('searchForm.selectHorizontalAlignment')" :style="{width: '100%'}">
            <u-option
              v-for="(item, index) in justifyOptions"
              :key="index"
              :label="item.label"
              :value="item.value"
            />
          </u-select>
        </u-form-item>
        <u-form-item v-if="activeData.align!==undefined&&activeData.type==='flex'" :label="$t('searchForm.verticalAlignment')">
          <u-radio-group v-model="activeData.align" button>
            <u-radio label="top" size="small">
              {{ $t('searchForm.alignTop') }}
            </u-radio>
            <u-radio label="middle" size="small">
              {{ $t('searchForm.alignMiddle') }}
            </u-radio>
            <u-radio label="bottom" size="small">
              {{ $t('searchForm.alignBottom') }}
            </u-radio>
          </u-radio-group>
        </u-form-item>
        -->
        <u-form-item v-if="activeData.labelWidth!==undefined" :label="$t('searchForm.labelWidth')">
          <u-input-number v-model="activeData.labelWidth"  :placeholder="$t('searchForm.enterLabelWidth')" />
        </u-form-item>
        <u-form-item v-if="activeData.style&&activeData.style.width!==undefined" :label="$t('searchForm.componentWidth')">
          <u-input v-model="activeData.style.width" :placeholder="$t('searchForm.enterComponentWidth')" clearable />
        </u-form-item>
        <u-form-item v-if="activeData.vModel!==undefined" :label="$t('searchForm.defaultValue')">
          <u-input
            :value="setDefaultValue(activeData.defaultValue)"
            :placeholder="$t('searchForm.enterDefaultValue')"
            @input="onDefaultValueInput"
          />
        </u-form-item>
        <u-form-item v-if="activeData.tag==='u-checkbox-group'" :label="$t('searchForm.minSelect')">
          <u-input-number
            :value="activeData.min"
            :min="0"
            :placeholder="$t('searchForm.minSelect')"
            @input="$set(activeData, 'min', $event?$event:undefined)"
          />
        </u-form-item>
        <u-form-item v-if="activeData.tag==='u-checkbox-group'" :label="$t('searchForm.maxSelect')">
          <u-input-number
            :value="activeData.max"
            :min="0"
            :placeholder="$t('searchForm.maxSelect')"
            @input="$set(activeData, 'max', $event?$event:undefined)"
          />
        </u-form-item>
        <!-- <u-form-item v-if="activeData.prepend!==undefined" label="前缀">
          <u-input v-model="activeData.prepend" placeholder="请输入前缀" />
        </u-form-item>
        <u-form-item v-if="activeData.append!==undefined" label="后缀">
          <u-input v-model="activeData.append" placeholder="请输入后缀" />
        </u-form-item> -->
          <u-form-item v-if="activeData.min !== undefined" :label="$t('searchForm.minValue')">
            <u-input-number v-model="activeData.min" :placeholder="$t('searchForm.minValue')" />
          </u-form-item>
          <u-form-item v-if="activeData.max !== undefined" :label="$t('searchForm.maxValue')">
            <u-input-number v-model="activeData.max" :placeholder="$t('searchForm.maxValue')" />
          </u-form-item>
          <u-form-item v-if="activeData.step !== undefined" :label="$t('searchForm.step')">
            <u-input-number v-model="activeData.step" :placeholder="$t('searchForm.stepCount')" />
          </u-form-item>
          <!-- <u-form-item v-if="activeData.tag === 'u-input-number'" label="精度">
            <u-input-number v-model="activeData.precision" :min="0" placeholder="精度" />
          </u-form-item> -->
          <!-- <u-form-item v-if="activeData.tag === 'u-input-number'" label="按钮位置">
            <u-radio-group v-model="activeData['controlsPosition']" button>
              <u-radio label="" size="small">
                默认
              </u-radio>
              <u-radio label="right" size="small">
                右侧
              </u-radio>
            </u-radio-group>
          </u-form-item> -->
          <!-- <u-form-item v-if="activeData.maxlength !== undefined" label="最多输入">
            <u-input v-model="activeData.maxlength" placeholder="请输入字符长度">
              <template slot="append">
                个字符
              </template>
            </u-input>
          </u-form-item> -->
          <u-form-item v-if="activeData['activeText'] !== undefined" :label="$t('searchForm.activeText')">
            <u-input v-model="activeData['activeText']" :placeholder="$t('searchForm.enterActiveText')" />
          </u-form-item>
          <u-form-item v-if="activeData['inactiveText'] !== undefined" :label="$t('searchForm.inactiveText')">
            <u-input v-model="activeData['inactiveText']" :placeholder="$t('searchForm.enterInactiveText')" />
          </u-form-item>
          <u-form-item v-if="activeData['activeValue'] !== undefined" :label="$t('searchForm.activeValue')">
            <u-input
              :value="setDefaultValue(activeData['activeValue'])"
              :placeholder="$t('searchForm.enterActiveValue')"
              @input="onSwitchValueInput($event, 'activeValue')"
            />
          </u-form-item>
          <u-form-item v-if="activeData['inactiveValue'] !== undefined" :label="$t('searchForm.inactiveValue')">
            <u-input
              :value="setDefaultValue(activeData['inactiveValue'])"
              :placeholder="$t('searchForm.enterInactiveValue')"
              @input="onSwitchValueInput($event, 'inactiveValue')"
            />
          </u-form-item>
          <u-form-item
            v-if="activeData.type !== undefined && 'u-date-picker' === activeData.tag"
            :label="$t('searchForm.timeType')"
          >
            <u-select
              v-model="activeData.type"
              :placeholder="$t('searchForm.selectTimeType')"
              :style="{ width: '100%' }"
              @change="dateTypeChange"
            >
              <u-option
                v-for="(item, index) in dateOptions"
                :key="index"
                :label="item.label"
                :value="item.value"
              />
            </u-select>
          </u-form-item>


          <u-form-item v-if="activeData.format !== undefined" :label="$t('searchForm.timeFormat')">
            <u-input
              :value="activeData.format"
              :placeholder="$t('searchForm.enterTimeFormat')"
              @input="setTimeValue($event)"
            />
          </u-form-item>
          <template v-if="['u-checkbox-group', 'u-radio-group', 'u-select'].indexOf(activeData.tag) > -1">
            <u-divider>{{ $t('searchForm.options') }}</u-divider>
            <u-form-item :label="$t('searchForm.optionSource')">
              <u-radio-group
                :value="activeData.optionSource || 'static'"
                button
                @change="onOptionSourceChange"
              >
                <u-radio label="static" size="small">
                  {{ $t('searchForm.optionSourceStatic') }}
                </u-radio>
                <u-radio label="dataset" size="small">
                  {{ $t('searchForm.optionSourceDataset') }}
                </u-radio>
              </u-radio-group>
            </u-form-item>
            <!-- 静态选项：手工录入（现状保留） -->
            <template v-if="(activeData.optionSource || 'static') !== 'dataset'">
              <draggable
                :list="activeData.options"
                :animation="340"
                group="selectItem"
                handle=".option-drag"
              >
                <div v-for="(item, index) in activeData.options" :key="index" class="select-item">
                  <div class="select-line-icon option-drag">
                    <i class="iconfont icon-success" />
                  </div>
                  <u-input v-model="item.label" :placeholder="$t('searchForm.optionName')" size="small" />
                  <u-input
                    :placeholder="$t('searchForm.optionValue')"
                    size="small"
                    :value="item.value"
                    @input="setOptionValue(item, $event)"
                  />
                  <div class="close-btn select-line-icon" @click="activeData.options.splice(index, 1)">
                    <i class="iconfont icon-delete" />
                  </div>
                </div>
              </draggable>
              <div style="margin-left: 20px;">
                <u-button
                  style="padding-bottom: 0"
                  icon="u-icon-circle-plus-outline"
                  type="text"
                  @click.prevent="addSelectItem"
                >
                  {{ $t('searchForm.addOption') }}
                </u-button>
              </div>
            </template>
            <!-- 数据集选项：绑定数据集 + 标签/值字段 -->
            <template v-else>
              <u-form-item :label="$t('searchForm.optionSourceDataset')">
                <u-select
                  :value="datasetKey"
                  :placeholder="$t('searchForm.selectDataset')"
                  :style="{width: '100%'}"
                  @change="onDatasetChange"
                >
                  <u-option
                    v-for="item in datasetOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </u-select>
              </u-form-item>
              <u-form-item v-if="activeData.datasetOption" :label="$t('searchForm.datasetLabelField')">
                <u-select
                  v-model="activeData.datasetOption.labelField"
                  :placeholder="$t('searchForm.selectDatasetLabelField')"
                  :style="{width: '100%'}"
                >
                  <u-option v-for="f in datasetFieldNames" :key="f" :label="f" :value="f" />
                </u-select>
              </u-form-item>
              <u-form-item v-if="activeData.datasetOption" :label="$t('searchForm.datasetValueField')">
                <u-select
                  v-model="activeData.datasetOption.valueField"
                  :placeholder="$t('searchForm.selectDatasetValueField')"
                  :style="{width: '100%'}"
                >
                  <u-option v-for="f in datasetFieldNames" :key="f" :label="f" :value="f" />
                </u-select>
              </u-form-item>
              <!-- 级联参数绑定：把其它查询字段的当前值作为数据集查询参数（仅有参数定义的数据集支持） -->
              <template v-if="activeData.datasetOption && datasetParamNames.length">
                <u-divider>{{ $t('searchForm.paramBinding') }}</u-divider>
                <div
                  v-for="(binding, bIndex) in activeData.datasetOption.datasetParams"
                  :key="bIndex"
                  class="param-binding-row"
                >
                  <u-select
                    v-model="binding.paramKey"
                    :placeholder="$t('searchForm.selectDatasetParam')"
                    class="binding-select"
                  >
                    <u-option v-for="p in datasetParamNames" :key="p" :label="p" :value="p" />
                  </u-select>
                  <u-select
                    v-model="binding.parentField"
                    :placeholder="$t('searchForm.selectParentField')"
                    class="binding-select"
                  >
                    <u-option
                      v-for="f in otherFieldOptions"
                      :key="f.value"
                      :label="f.label"
                      :value="f.value"
                      :disabled="isCycleParent(f.value)"
                    />
                  </u-select>
                  <div
                    class="close-btn select-line-icon"
                    @click="activeData.datasetOption.datasetParams.splice(bIndex, 1)"
                  >
                    <i class="iconfont icon-delete" />
                  </div>
                </div>
                <u-button
                  style="padding-bottom: 0; margin-left: 20px;"
                  icon="u-icon-circle-plus-outline"
                  type="text"
                  @click.prevent="addParamBinding"
                >
                  {{ $t('searchForm.addParamBinding') }}
                </u-button>
              </template>
            </template>
            <u-divider />
          </template>

          <u-form-item
            v-if="activeData.optionType !== undefined &&
              ['u-radio-group', 'u-checkbox-group'].indexOf(activeData.tag) === -1"
            :label="$t('searchForm.optionStyle')"
          >
            <u-radio-group v-model="activeData.optionType" button>
              <u-radio label="default" size="small">
                {{ $t('searchForm.default') }}
              </u-radio>
              <u-radio label="button" size="small">
                {{ $t('searchForm.button') }}
              </u-radio>
            </u-radio-group>
          </u-form-item>
          <u-form-item
            v-if="activeData.border !== undefined && activeData.optionType === 'default'"
            :label="$t('searchForm.bordered')"
          >
            <u-switch v-model="activeData.border" />
          </u-form-item>
          <u-form-item
            v-if="activeData.size !== undefined &&
              (activeData.optionType === 'button' || activeData.border) &&
              ['u-radio-group', 'u-checkbox-group'].indexOf(activeData.tag) === -1"
            :label="$t('searchForm.optionSize')"
          >
            <u-radio-group v-model="activeData.size" button>
              <u-radio label="medium" size="small">
                {{ $t('searchForm.medium') }}
              </u-radio>
              <u-radio label="small" size="small">
                {{ $t('searchForm.small') }}
              </u-radio>
              <u-radio label="mini" size="small">
                {{ $t('searchForm.mini') }}
              </u-radio>
            </u-radio-group>
          </u-form-item>
          <!-- <u-form-item v-if="activeData['showWordLimit'] !== undefined" label="输入统计">
            <u-switch v-model="activeData['showWordLimit']" />
          </u-form-item> -->
          <!-- <u-form-item v-if="activeData.tag === 'u-input-number'" label="严格步数">
            <u-switch v-model="activeData['stepStrictly']" />
          </u-form-item> -->
          <u-form-item v-if="activeData.clearable !== undefined" :label="$t('searchForm.clearable')">
            <u-switch v-model="activeData.clearable" />
          </u-form-item>
          <u-form-item v-if="activeData.showTip !== undefined" :label="$t('searchForm.showTip')">
            <u-switch v-model="activeData.showTip" />
          </u-form-item>

          <!-- <u-form-item v-if="activeData.tag === 'u-select'" label="是否可搜索">
            <u-switch v-model="activeData.filterable" />
          </u-form-item> -->
          <u-form-item v-if="activeData.tag === 'u-select'" :label="$t('searchForm.multiple')">
            <u-switch v-model="activeData.multiple" @input="multipleChange" />
          </u-form-item>
          <u-form-item v-if="activeData.required !== undefined" :label="$t('searchForm.required')">
            <u-switch v-model="activeData.required" />
          </u-form-item>

          <template v-if="activeData.layoutTree">
            <u-divider>{{ $t('searchForm.layoutStructureTree') }}</u-divider>
            <u-tree
              :data="layoutTree"
              node-key="renderKey"
            >
              <template slot-scope="{ node, data }">
                <span class="node-label">
                  {{ data.componentName || `${data.label}: ${data.vModel}` }}
                </span>
              </template>
            </u-tree>
          </template>

          <!-- <template v-if="activeData.layout === 'colFormItem' && activeData.tag !== 'u-button'">
            <u-divider>正则校验</u-divider>
            <div
              v-for="(item, index) in activeData.regList"
              :key="index"
              class="reg-item"
            >
              <span class="close-btn" @click="activeData.regList.splice(index, 1)">
                <i class="iconfont icon-close" />
              </span>
              <u-form-item label="表达式">
                <u-input v-model="item.pattern" placeholder="请输入正则" />
              </u-form-item>
              <u-form-item label="错误提示" style="margin-bottom:0">
                <u-input v-model="item.message" placeholder="请输入错误提示" />
              </u-form-item>
            </div>
            <div style="margin-left: 20px">
              <u-button icon="u-icon-circle-plus-outline" type="text" @click.prevent="addReg">
                添加规则
              </u-button>
            </div>
          </template> -->
        </u-form>
        <!-- 表单属性 -->
        <u-form v-show="currentTab === 'form'" size="small" :label-width="90">
          <u-form-item :label="$t('searchForm.formName')">
            <u-input v-model="formConf.formRef" :placeholder="$t('searchForm.enterFormName')" />
          </u-form-item>
          <u-form-item :label="$t('searchForm.formModel')">
            <u-input v-model="formConf.formModel" :placeholder="$t('searchForm.enterFormModel')" />
          </u-form-item>
          <u-form-item :label="$t('searchForm.formRules')">
            <u-input v-model="formConf.formRules" :placeholder="$t('searchForm.enterFormRules')" />
          </u-form-item>
          <u-form-item :label="$t('searchForm.formSize')" button>
            <u-radio-group size="small" v-model="formConf.size" button>
              <u-radio label="medium">
                {{ $t('searchForm.medium') }}
              </u-radio>
              <u-radio label="small">
                {{ $t('searchForm.small') }}
              </u-radio>
              <u-radio label="mini">
                {{ $t('searchForm.mini') }}
              </u-radio>
            </u-radio-group>
          </u-form-item>
          <u-form-item :label="$t('searchForm.labelPosition')">
            <u-radio-group size="small" v-model="formConf.labelPosition" button>
              <u-radio label="left">
                {{ $t('searchForm.leftAlign') }}
              </u-radio>
              <u-radio label="right">
                {{ $t('searchForm.rightAlign') }}
              </u-radio>
              <u-radio label="top">
                {{ $t('searchForm.topAlign') }}
              </u-radio>
            </u-radio-group>
          </u-form-item>
          <u-form-item :label="$t('searchForm.labelWidth')">
            <u-input-number v-model="formConf.labelWidth" :placeholder="$t('searchForm.labelWidth')" />
          </u-form-item>
          <u-form-item :label="$t('searchForm.gutter')">
            <u-input-number v-model="formConf.gutter" :min="0" :placeholder="$t('searchForm.gutter')" />
          </u-form-item>
          <u-form-item :label="$t('searchForm.disableForm')">
            <u-switch v-model="formConf.disabled" />
          </u-form-item>
          <u-form-item :label="$t('searchForm.formButtons')">
            <u-switch v-model="formConf.formBtns" />
          </u-form-item>
          <u-form-item :label="$t('searchForm.showUnfocusedBorder')">
            <u-switch v-model="formConf.unFocusedComponentBorder" />
          </u-form-item>
        </u-form>
      </div>
    </div>

  </div>
</template>

<script>
/* eslint-disable */

import draggable from 'vuedraggable'
import {toSafeNumber,} from '../utils'
import {inputComponents, selectComponents,} from '../utils/config'
import UTabs from '@/components/tabs/index.vue'
import UTabPane from '@/components/tabs/pane.vue'
import UInputNumber from '@/components/input-number/index.vue'
import URadioGroup from '@/components/radio-group/index.vue'
import URadio from '@/components/radio/index.vue'
import USelect from '@/components/select/index.vue'
import UOption from '@/components/option/index.vue'
import UInput from '@/components/input/index.vue'
import UDivider from '@/components/divider/index.vue'
import UForm from '@/components/form/index.vue'
import UFormItem from '@/components/form-item/index.vue'
import USwitch from '@/components/switch/index.vue'
import UButton from '@/components/button/index.vue'
import UTree from '@/components/tree/index.vue'
import {deepCopy} from "@/components/utils";

const dateTimeFormat = {
  date: 'YYYY-MM-DD',
  // week: 'YYYY-d',
  month: 'YYYY-MM',
  year: 'YYYY',
  datetime: 'YYYY-MM-DD HH:mm:ss'
}

export default {
  components: {
    draggable,
    UTabs,
    UTabPane,
    UInputNumber,
    URadioGroup,
    URadio,
    USelect,
    UOption,
    UInput,
    UDivider,
    UForm,
    UFormItem,
    USwitch,
    UButton,
    UTree
  },
  props: ['showField', 'activeData', 'formConf', 'drawingList'],
  data() {
    return {
      currentTab: 'field',
      currentNode: null,
      justifyOptions: [
        {
          label: 'start',
          value: 'start'
        },
        {
          label: 'end',
          value: 'end'
        },
        {
          label: 'center',
          value: 'center'
        },
        {
          label: 'space-around',
          value: 'space-around'
        },
        {
          label: 'space-between',
          value: 'space-between'
        }
      ],
    }
  },
  computed: {

    documentLink() {
      return (
        this.activeData.document
        || 'https://element.eleme.cn/#/zh-CN/component/installation'
      )
    },
    dateOptions() {
        if (
          this.activeData.type !== undefined
          && this.activeData.tag === 'u-date-picker'
        ) {
          return this.dateTypeOptions
        }
        return []
      },
    dateTypeOptions() {
      return [
        {
          label: this.$t('searchForm.date'),
          value: 'date'
        },
        // {
        //   label: '周(week)',
        //   value: 'week'
        // },
        {
          label: this.$t('searchForm.month'),
          value: 'month'
        },
        {
          label: this.$t('searchForm.year'),
          value: 'year'
        },
        {
          label: this.$t('searchForm.datetime'),
          value: 'datetime'
        }
      ]
    },
    tagList() {
      return [
        {
          label: this.$t('searchForm.inputComponents'),
          options: inputComponents
        },
        {
          label: this.$t('searchForm.selectComponents'),
          options: selectComponents
        }
      ]
    },
    layoutTree(){
      // 创建 activeData 的深拷贝
      return deepCopy([this.activeData]);
    },
    // 报表内全部数据源（供数据集绑定下拉取数）
    reportDatasources() {
      const context = this.$store.getters['report/getContext'];
      return (context && context.reportDef && context.reportDef.datasources) || [];
    },
    // 数据集下拉选项：label 只展示数据集名，value 用 "数据源名/数据集名" 保证跨数据源唯一
    datasetOptions() {
      const list = [];
      for (const ds of this.reportDatasources) {
        for (const dt of (ds.datasets || [])) {
          list.push({ label: dt.name, value: `${ds.name}/${dt.name}` });
        }
      }
      return list;
    },
    // 当前绑定数据集 key："数据源名/数据集名"，未配置返回 undefined
    datasetKey() {
      const opt = this.activeData.datasetOption;
      if (!opt || !opt.datasourceName || !opt.datasetName) return undefined;
      return `${opt.datasourceName}/${opt.datasetName}`;
    },
    // 当前选中的数据集对象
    currentDataset() {
      const opt = this.activeData.datasetOption;
      if (!opt) return null;
      const ds = this.reportDatasources.find(d => d.name === opt.datasourceName);
      const dt = (ds && ds.datasets || []).find(d => d.name === opt.datasetName);
      return dt || null;
    },
    // 数据集字段名列表：优先取 fields；JSON 静态数据集无 fields 时解析 content 首行 key
    datasetFieldNames() {
      const dt = this.currentDataset;
      if (!dt) return [];
      const fields = dt.fields || [];
      if (fields.length) return fields.map(f => f.name);
      // JSON 静态数据集：前端直接解析 content 提取首行 key 作为字段列表
      if (typeof dt.content === 'string' && dt.content.trim()) {
        try {
          const parsed = JSON.parse(dt.content);
          if (Array.isArray(parsed) && parsed.length && typeof parsed[0] === 'object' && parsed[0]) {
            return Object.keys(parsed[0]);
          }
        } catch (e) {
          return [];
        }
      }
      return [];
    },
    // 数据集查询参数名列表（SQL 数据集的 parameter 定义；JSON 数据集为空则不展示级联配置）
    datasetParamNames() {
      const dt = this.currentDataset;
      if (!dt || !Array.isArray(dt.parameters)) return [];
      return dt.parameters.map(p => p.name);
    },
    // 级联父字段候选：画布中其它有 vModel 的字段（含 row children，排除自身）
    otherFieldOptions() {
      const result = [];
      const walk = (list) => {
        for (const item of (list || [])) {
          if (item.children && Array.isArray(item.children)) {
            walk(item.children);
            continue;
          }
          if (item.vModel && item.vModel !== this.activeData.vModel) {
            result.push({ label: `${item.label || ''}(${item.vModel})`, value: item.vModel });
          }
        }
      };
      walk(this.drawingList);
      return result;
    }
  },
  methods: {
    addReg() {
      this.activeData.regList.push({
        pattern: '',
        message: ''
      })
    },
    addSelectItem() {
      this.activeData.options.push({
        label: '',
        value: ''
      })
    },
    /**
     * 选项来源切换：切到 dataset 时补全 datasetOption 默认结构；切回 static 保留配置不删除
     * @param {String} val 选项来源（static / dataset）
     */
    onOptionSourceChange(val) {
      this.$set(this.activeData, 'optionSource', val)
      if (val === 'dataset' && !this.activeData.datasetOption) {
        this.$set(this.activeData, 'datasetOption', {
          datasourceName: '',
          datasetName: '',
          labelField: '',
          valueField: '',
          datasetParams: []
        })
      }
    },
    /**
     * 数据集选择变更：写入绑定信息并清空字段绑定与级联配置
     * @param {String} val "数据源名/数据集名"
     */
    onDatasetChange(val) {
      const [datasourceName, datasetName] = String(val || '').split('/')
      this.$set(this.activeData, 'datasetOption', {
        datasourceName,
        datasetName,
        labelField: '',
        valueField: '',
        datasetParams: []
      })
    },
    /**
     * 添加一行级联参数绑定
     */
    addParamBinding() {
      const opt = this.activeData.datasetOption
      if (!opt) return
      if (!opt.datasetParams) this.$set(opt, 'datasetParams', [])
      opt.datasetParams.push({ paramKey: '', parentField: '' })
    },
    /**
     * 判断将当前字段的级联父字段设为 candidate 后是否会形成循环依赖
     * 依赖方向：字段 -> 其选项依赖的父字段；candidate 沿依赖链能回到当前字段（或自引用）即成环
     * @param {String} candidate 候选父字段 vModel
     * @return {Boolean} 成环返回 true
     */
    isCycleParent(candidate) {
      const selfVModel = String(this.activeData.vModel || '')
      if (!selfVModel || !candidate) return false
      if (candidate === selfVModel) return true
      // 收集画布中所有数据集来源字段的依赖边：字段 vModel -> 父字段 vModel 列表
      const edges = new Map()
      const walk = (list) => {
        for (const item of (list || [])) {
          if (item.children && Array.isArray(item.children)) {
            walk(item.children)
            continue
          }
          if (item.optionSource !== 'dataset' || !item.datasetOption || !item.vModel) continue
          const parents = (item.datasetOption.datasetParams || [])
            .map(b => b.parentField)
            .filter(p => !!p)
          if (parents.length) edges.set(String(item.vModel), parents)
        }
      }
      walk(this.drawingList)
      // 从 candidate 沿依赖边搜索，若能到达当前字段则 self->candidate 会闭合出环
      const visited = new Set()
      const stack = [candidate]
      while (stack.length) {
        const cur = stack.pop()
        if (cur === selfVModel) return true
        if (visited.has(cur)) continue
        visited.add(cur)
        for (const p of (edges.get(cur) || [])) stack.push(p)
      }
      return false
    },
    addNode(data) {
      this.currentNode.push(data)
    },
    setOptionValue(item, val) {
      item.value = toSafeNumber(val)
    },
    setDefaultValue(val) {
      if (typeof val === 'boolean') {
        return `${val}`
      }
      return val
    },
    onDefaultValueInput(str) {
      if (this.activeData.tag === 'u-switch') {
        // switch 默认值统一字符串存储
        this.$set(this.activeData, 'defaultValue', str)
      } else if (['true', 'false'].indexOf(str) > -1) {
        // 布尔
        this.$set(this.activeData, 'defaultValue', JSON.parse(str))
      } else {
        // 字符串和数字：超长整数 ID 保持字符串，避免 Number 精度丢失
        this.$set(
          this.activeData,
          'defaultValue',
          toSafeNumber(str)
        )
      }
    },
    onSwitchValueInput(val, name) {
      if (['true', 'false'].indexOf(val) > -1) {
        this.$set(this.activeData, name, JSON.parse(val))
      } else {
        this.$set(this.activeData, name, toSafeNumber(val))
      }
    },
    setTimeValue(val, type) {
      // const valueFormat = type === 'week' ? dateTimeFormat.date : val
      this.$set(this.activeData, 'defaultValue', null)
      // this.$set(this.activeData, 'valueFormat', valueFormat)
      this.$set(this.activeData, 'format', val)
    },
    spanChange(val) {
      this.formConf.span = val
    },
    multipleChange(val) {
      this.$set(this.activeData, 'defaultValue', null)
    },
    dateTypeChange(val) {
      this.setTimeValue(dateTimeFormat[val], val)
    },

    tagChange(tagIcon) {
      let target = inputComponents.find(item => item.tagIcon === tagIcon)
      if (!target) target = selectComponents.find(item => item.tagIcon === tagIcon)
      this.$emit('tag-change', target)
    }
  }
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
.select-item .u-input + .u-input {
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
.param-binding-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}
.param-binding-row .binding-select {
  flex: 1;
}
.param-binding-row .binding-select + .binding-select {
  margin-left: 4px;
}
.param-binding-row .close-btn {
  cursor: pointer;
  color: #f56c6c;
}
.node-label {
  font-size: 14px;
}
</style>











