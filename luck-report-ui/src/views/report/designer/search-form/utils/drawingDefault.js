import {$t} from "@/locales";
export const drawingDefaultValue = []

export function initDrawingDefaultValue() {
  if (drawingDefaultValue.length === 0) {
    drawingDefaultValue.push({
      layout: 'colFormItem',
      tagIcon: 'input',
      label: $t('searchForm.phone'),
      vModel: 'mobile',
      formId: 6,
      tag: 'u-input',
      placeholder: $t('searchForm.pleaseEnterPhone'),
      defaultValue: '',
      span: 24,
      style: {width: '100%'},
      clearable: true,
      prepend: '',
      append: '',
      'prefixIcon': 'u-icon-mobile',
      'suffixIcon': '',
      maxlength: 11,
      'showWordLimit': true,
      readonly: false,
      disabled: false,
      required: true,
      changeTag: true,
      regList: [{
        pattern: '/^1(3|4|5|7|8|9)\\d{9}$/',
        message: $t('searchForm.phoneFormatError')
      }]
    })
  }
}

export function cleanDrawingDefaultValue() {
  drawingDefaultValue.splice(0, drawingDefaultValue.length)
}
