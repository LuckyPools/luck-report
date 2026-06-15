/**
 * 画布默认数据
 *
 * 改造要点：
 * - tag 由 u-input 改为 a-input
 * - 加显式类型
 */
import { t, i18n } from '@/locales'
import type { FormField } from './types'

export const drawingDefaultValue: FormField[] = []

export function initDrawingDefaultValue(): void {
  if (drawingDefaultValue.length === 0) {
    drawingDefaultValue.push({
      __key: 'a-input-6',
      layout: 'colFormItem',
      tagIcon: 'input',
      label: i18n.global.t('searchForm.phone'),
      vModel: 'mobile',
      formId: 6,
      tag: 'a-input',
      placeholder: i18n.global.t('searchForm.pleaseEnterPhone'),
      defaultValue: '',
      span: 24,
      style: { width: '100%' },
      clearable: true,
      prepend: '',
      append: '',
      prefixIcon: '',
      suffixIcon: '',
      maxlength: 11,
      showWordLimit: true,
      readonly: false,
      disabled: false,
      required: true,
      changeTag: true,
      regList: [
        {
          pattern: '/^1(3|4|5|7|8|9)\\d{9}$/',
          message: i18n.global.t('searchForm.phoneFormatError')
        }
      ]
    })
  }
}

export function cleanDrawingDefaultValue(): void {
  drawingDefaultValue.splice(0, drawingDefaultValue.length)
}
