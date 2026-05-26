import { exportDefault } from './index'
import { trigger } from './config'
import { $t } from '@/locales'

let confGlobal
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

  if (conf.fields && Array.isArray(conf.fields)) {
    conf.fields.forEach(el => {
      buildAttributes(el, dataList, ruleList, optionsList, methodList, propsList, uploadVarList)
    })
  }

  const script = buildexport(
    conf,
    type,
    dataList.join('\n'),
    ruleList.join('\n'),
    optionsList.join('\n'),
    uploadVarList.join('\n'),
    propsList.join('\n'),
    methodList.join('\n')
  )
  confGlobal = null
  return script
}

function buildAttributes(el, dataList, ruleList, optionsList, methodList, propsList, uploadVarList) {
  buildData(el, dataList)
  buildRules(el, ruleList)

  if (el.options && el.options.length) {
    buildOptions(el, optionsList)
  }

  if (el.children && Array.isArray(el.children)) {
    el.children.forEach(el2 => {
      buildAttributes(el2, dataList, ruleList, optionsList, methodList, propsList, uploadVarList)
    })
  }
}

function mixinMethod(type) {
  const list = []; const
    minxins = {
      file: confGlobal.formBtns ? {
        submitForm: `submitForm() {
        let that = this;
        this.$refs['${confGlobal.formRef}'].validate(valid => {
          if(!valid) return
          that.$emit(\'on-submit\' ,that.formData)
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
  if (typeof (conf.defaultValue) === 'string' && !conf.multiple) {
    const escapedValue = conf.defaultValue.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    defaultValue = `'${escapedValue}'`
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
      let type = ''
      let isArrayType = Array.isArray(conf.defaultValue)
      let transform = ''
      if (Array.isArray(conf.defaultValue)) {
        isArrayType = true
        type = 'type: \'array\','
      } else if (conf.tag === 'u-checkbox-group') {
        type = 'type: \'array\','
      } else if (conf.tag === 'u-input-number') {
        type = 'type: \'number\','
      } else if (conf.tag === 'u-input' || conf.tag === 'u-select') {
        transform = 'transform: value => value == null ? null : String(value),'
      }

      let message = isArrayType ? $t('searchForm.selectAtLeastOne', { field: conf.vModel }) : conf.placeholder
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
  const str = `${conf.vModel}Options: ${JSON.stringify(conf.options)},`
  optionsList.push(str)
}

function buildexport(conf, type, data, rules, selectOptions, uploadVar, props, methods) {
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
    }
  },
  computed: {},
  watch: {},
  created () {},
  mounted () {},
  methods: {
    ${methods}
  }
}`
  return str
}
