/**
 * 脚本代码生成器
 *
 * 改造要点：
 * 1. 类型化（FormField / FormConf）
 * 2. 移除 eval(item.pattern)，改为生成 `pattern: new RegExp(...)`
 * 3. 移除 u-input-number / u-checkbox-group 等旧分支的 type 强制（按 a-xxx 行为）
 * 4. inheritAttrs 在 dialog 模式下不再使用，改为生成 a-modal 需要的 visible + v-model:open
 * 5. tag 同步 a-xxx
 */
import { exportDefault } from './index'
import { trigger } from './config'
import { t, i18n } from '@/locales'
import type { FormConf, FormField } from './types'

let confGlobal: (FormConf & { fields?: FormField[] }) | null = null

const dialogExtras = {
  file: '',
  // dialog 模式不再需要 inheritAttrs（ant-design-vue 的 a-modal 自身处理），保留空字符串保持原结构
  dialog: ''
}

export function makeUpJs(conf: FormConf & { fields?: FormField[] }, type: 'file' | 'dialog'): string {
  confGlobal = JSON.parse(JSON.stringify(conf))
  const dataList: string[] = []
  const ruleList: string[] = []
  const optionsList: string[] = []
  const propsList: string[] = []
  const methodList = mixinMethod(type)
  const uploadVarList: string[] = []

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

function buildAttributes(
  el: FormField,
  dataList: string[],
  ruleList: string[],
  optionsList: string[],
  _methodList: string[],
  _propsList: string[],
  _uploadVarList: string[]
): void {
  buildData(el, dataList)
  buildRules(el, ruleList)

  if (el.options && el.options.length) {
    buildOptions(el, optionsList)
  }

  if (el.children && Array.isArray(el.children)) {
    el.children.forEach(el2 => {
      buildAttributes(el2, dataList, ruleList, optionsList, _methodList, _propsList, _uploadVarList)
    })
  }
}

function mixinMethod(type: 'file' | 'dialog'): string[] {
  const list: string[] = []
  const formRef = confGlobal!.formRef
  const minxins: Record<string, Record<string, string> | null> = {
    file: confGlobal!.formBtns
      ? {
          submitForm: `submitForm() {
        let that = this;
        this.$refs['${formRef}'].validate(valid => {
          if(!valid) return
          that.$emit('on-submit', that.formData)
          // TODO 提交表单
        })
      },`,
          resetForm: `resetForm() {
        this.$refs['${formRef}'].resetFields()
      },`
        }
      : null,
    dialog: {
      onOpen: 'onOpen() {},',
      onClose: `onClose() {
        this.$refs['${formRef}'].resetFields()
      },`,
      close: `close() {
        this.$emit('update:visible', false)
      },`,
      handleConfirm: `handleConfirm() {
        this.$refs['${formRef}'].validate(valid => {
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

function buildData(conf: FormField, dataList: string[]): void {
  if (conf.vModel === undefined) return
  let defaultValue: string
  if (typeof conf.defaultValue === 'string' && !conf.multiple) {
    const escapedValue = conf.defaultValue.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    defaultValue = `'${escapedValue}'`
  } else {
    defaultValue = `${JSON.stringify(conf.defaultValue)}`
  }
  dataList.push(`${conf.vModel}: ${defaultValue},`)
}

function buildRules(conf: FormField, ruleList: string[]): void {
  if (conf.vModel === undefined) return
  const rules: string[] = []
  const triggerKey = conf.tag as keyof typeof trigger
  if (trigger[triggerKey]) {
    if (conf.required) {
      let type = ''
      let isArrayType = Array.isArray(conf.defaultValue)
      let transform = ''
      if (Array.isArray(conf.defaultValue)) {
        isArrayType = true
        type = `type: 'array',`
      } else if (conf.tag === 'a-checkbox-group') {
        type = `type: 'array',`
      } else if (conf.tag === 'a-input-number') {
        type = `type: 'number',`
      } else if (conf.tag === 'a-input' || conf.tag === 'a-select') {
        transform = `transform: value => value == null ? null : String(value),`
      }

      let message: string = isArrayType
        ? (i18n.global.t('searchForm.selectAtLeastOne', { field: conf.vModel }) as string)
        : (conf.placeholder as string) || ''
      if (!message) message = i18n.global.t('searchForm.cannotBeEmpty', { field: conf.label }) as string

      rules.push(`{ required: true, ${type} ${transform} message: '${message}', trigger: '${trigger[triggerKey]}' }`)
    }
    if (conf.regList && Array.isArray(conf.regList)) {
      conf.regList.forEach(item => {
        if (item.pattern) {
          // 不再 eval，直接 new RegExp(字符串)
          rules.push(`{ pattern: new RegExp(${JSON.stringify(item.pattern)}), message: '${item.message}', trigger: '${trigger[triggerKey]}' }`)
        }
      })
    }
    ruleList.push(`${conf.vModel}: [${rules.join(',')}],`)
  }
}

function buildOptions(conf: FormField, optionsList: string[]): void {
  if (conf.vModel === undefined) return
  const str = `${conf.vModel}Options: ${JSON.stringify(conf.options)},`
  optionsList.push(str)
}

function buildexport(
  conf: FormConf,
  type: 'file' | 'dialog',
  data: string,
  rules: string,
  selectOptions: string,
  uploadVar: string,
  props: string,
  methods: string
): string {
  // dialog 模式追加 visible 字段；size 字段透出
  const dialogData = type === 'dialog' ? `\n      visible: false,\n      size: '${conf.size}',` : ''
  const sizeComputed = type === 'dialog' ? `\n  computed: {\n    size() {\n      return this.${conf.formModel} && this.${conf.formModel}.size || 'middle'\n    }\n  },` : ''
  const str = `import { useI18n } from 'vue-i18n';
${exportDefault}{
  ${dialogExtras[type]}
  components: {},
  props: [],
  setup() {
    return { t: useI18n().t };
  },
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
      ${props}${dialogData}
    }
  },${sizeComputed}
  watch: {},
  created () {},
  mounted () {},
  methods: {
    ${methods}
  }
}`
  return str
}
