import { exportDefault, isNumberStr, toSafeNumber, isMultiSelectComponent, splitToSafeArray } from './index'
import { trigger } from './config'
import { $t } from '@/locales'

let confGlobal
// 选项类组件：defaultValue 与选项 value 需同一转换规则
const OPTION_VALUE_TAGS = ['u-select', 'u-radio-group', 'u-checkbox-group']
const inheritAttrs = {
  file: '',
  dialog: 'inheritAttrs: false,'
}


export function makeUpJs(conf, type) {
  confGlobal = conf = JSON.parse(JSON.stringify(conf))
  const dataList = []
  const ruleList = []
  const optionsList = []
  const propsList = []
  const methodList = mixinMethod(type)
  const uploadVarList = []
  const watchList = []
  const parentFields = new Set()
  let hasDatasetField = false

  if (conf.fields && Array.isArray(conf.fields)) {
    conf.fields.forEach(el => {
      if (buildAttributes(el, dataList, ruleList, optionsList, methodList, propsList, uploadVarList, parentFields)) {
        hasDatasetField = true
      }
    })
  }

  // 级联父字段 watch：值变化时上报 search-box，触发子数据集选项刷新
  parentFields.forEach(field => {
    watchList.push(buildFieldWatch(field))
  })

  const script = buildexport(
    conf,
    type,
    dataList.join('\n'),
    ruleList.join('\n'),
    optionsList.join('\n'),
    uploadVarList.join('\n'),
    propsList.join('\n'),
    methodList.join('\n'),
    watchList.join('\n'),
    hasDatasetField
  )
  confGlobal = null
  return script
}

function buildAttributes(el, dataList, ruleList, optionsList, methodList, propsList, uploadVarList, parentFields) {
  buildData(el, dataList)
  buildRules(el, ruleList)

  let hasDataset = el.optionSource === 'dataset' && el.vModel !== undefined
  if (hasDataset) {
    // 数据集来源：即使初始 options 为空也生成选项变量，供运行时刷新赋值
    buildOptions(el, optionsList)
    const bindings = (el.datasetOption && el.datasetOption.datasetParams) || []
    bindings.forEach(b => {
      if (b.parentField) parentFields.add(b.parentField)
    })
  } else if (el.options && el.options.length) {
    buildOptions(el, optionsList)
  }

  if (el.children && Array.isArray(el.children)) {
    el.children.forEach(el2 => {
      if (buildAttributes(el2, dataList, ruleList, optionsList, methodList, propsList, uploadVarList, parentFields)) {
        hasDataset = true
      }
    })
  }
  return hasDataset
}

function mixinMethod(type) {
  const list = []; const
    minxins = {
      file: confGlobal.formBtns ? {
        submitForm: `submitForm() {
        let that = this;
        this.$refs['${confGlobal.formRef}'].validate(valid => {
          if(!valid) return
          that.$emit('on-submit' ,that.formData)
          // TODO 提交表单
        })
      },`,
        resetForm: `resetForm() {
        this.$refs['${confGlobal.formRef}'].resetFields()
      },`
      } : null,
      dialog: {
        onOpen: 'onOpen() {},',
        onClose: `onClose() {
        this.$refs['${confGlobal.formRef}'].resetFields()
      },`,
        close: `close() {
        this.$emit('update:visible', false)
      },`,
        handleConfirm: `handleConfirm() {
        this.$refs['${confGlobal.formRef}'].validate(valid => {
          if(!valid) return
          this.close()
        })
      },`
      }
    }

  const methods = minxins[type]
  if (methods) {
    Object.keys(methods).forEach(key => {
      list.push(methods[key])
    })
  }

  return list
}

function buildData(conf, dataList) {
  if (conf.vModel === undefined) return
  let defaultValue
  if (isMultiSelectComponent(conf)) {
    // 多选：默认值为逗号拼接字符串，运行时还原为数组
    defaultValue = `${JSON.stringify(splitToSafeArray(conf.defaultValue))}`
  } else if (conf.tag === 'u-switch') {
    // switch：字符串 "true"/"false" 生成布尔字面量
    if (conf.defaultValue === 'true') {
      defaultValue = 'true'
    } else if (conf.defaultValue === 'false') {
      defaultValue = 'false'
    } else {
      defaultValue = `${JSON.stringify(conf.defaultValue)}`
    }
  } else if (typeof (conf.defaultValue) === 'string') {
    if (conf.tag === 'u-input-number' && isNumberStr(conf.defaultValue)) {
      // 计数器需 type:'number'，字符串值会类型不匹配
      defaultValue = `${Number(conf.defaultValue)}`
    } else if (OPTION_VALUE_TAGS.indexOf(conf.tag) > -1) {
      // 选项类：过 toSafeNumber 与选项 value 类型对齐
      defaultValue = `${JSON.stringify(toSafeNumber(conf.defaultValue))}`
    } else {
      const escapedValue = conf.defaultValue.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      defaultValue = `'${escapedValue}'`
    }
  } else {
    defaultValue = `${JSON.stringify(conf.defaultValue)}`
  }
  dataList.push(`${conf.vModel}: ${defaultValue},`)
}

function buildRules(conf, ruleList) {
  if (conf.vModel === undefined) return
  const rules = []
  if (trigger[conf.tag]) {
    if (conf.required) {
      // 多选组件（checkbox-group / multiple select）运行时值为数组，按 array 类型校验
      const multiSelect = isMultiSelectComponent(conf)
      let type = ''
      let transform = ''
      if (multiSelect) {
        type = 'type: \'array\','
      } else if (conf.tag === 'u-input-number') {
        type = 'type: \'number\','
      } else if (conf.tag === 'u-radio-group') {
        // radio value prop 默认 false 会被误判为非空，toSafeNumber 后可能为数字需归一化为字符串
        transform = 'transform: value => value === false ? undefined : (value == null ? value : String(value)),'
      } else if (conf.tag === 'u-input' || conf.tag === 'u-select') {
        transform = 'transform: value => value == null ? null : String(value),'
      }

      let message = multiSelect ? $t('searchForm.selectAtLeastOne', { field: conf.label }) : conf.placeholder
      if (message === undefined) message = $t('searchForm.cannotBeEmpty', { field: conf.label })

      rules.push(`{ required: true, ${type} ${transform} message: '${message}', trigger: '${trigger[conf.tag]}' }`)
    }
    if (conf.regList && Array.isArray(conf.regList)) {
      conf.regList.forEach(item => {
        if (item.pattern) {
          rules.push(`{ pattern: ${eval(item.pattern)}, message: '${item.message}', trigger: '${trigger[conf.tag]}' }`)
        }
      })
    }
    ruleList.push(`${conf.vModel}: [${rules.join(',')}],`)
  }
}

function buildOptions(conf, optionsList) {
  if (conf.vModel === undefined) return
  // 选项 value 过 toSafeNumber 与 defaultValue 类型对齐
  const options = (conf.options || []).map(o => ({ ...o, value: toSafeNumber(o.value) }))
  const str = `${conf.vModel}Options: ${JSON.stringify(options)},`
  optionsList.push(str)
}

/**
 * 构建级联父字段的 watch 项：值变化时上报 on-field-change 事件
 * @param {String} field 父字段 vModel，不可为空
 * @return {String} watch 代码段
 */
function buildFieldWatch(field) {
  const vModel = String(field).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  return `    '${confGlobal.formModel}.${vModel}': function (val) {
      this.$emit('on-field-change', { field: '${vModel}', value: val })
    },`
}

function buildexport(conf, type, data, rules, selectOptions, uploadVar, props, methods, watches, hasDatasetField) {
  // 数据集选项字段才输出 loading 状态与实例方法，保证旧报表生成代码与改造前一致
  const dsData = hasDatasetField ? 'dsLoading: {},' : ''
  const dsMethods = hasDatasetField ? `updateDsOptions(vModel, options) {
      this[vModel + 'Options'] = options
    },
    clearFieldValue(vModel, emptyValue) {
      this.${conf.formModel}[vModel] = emptyValue
    },
    setDsLoading(vModel, loading) {
      this.dsLoading[vModel] = loading
    },` : ''
  const watchBlock = watches
    ? `watch: {
${watches}
  },`
    : 'watch: {},'
  const str = `${exportDefault}{
  ${inheritAttrs[type]}
  components: {},
  props: [],
  data () {
    return {
      ${conf.formModel}: {
        ${data}
      },
      ${conf.formRules}: {
        ${rules}
      },
      ${uploadVar}
      ${selectOptions}
      ${props}
      ${dsData}
    }
  },
  computed: {},
  ${watchBlock}
  created () {},
  mounted () {},
  methods: {
    ${methods}
    ${dsMethods}
  }
}`
  return str
}
