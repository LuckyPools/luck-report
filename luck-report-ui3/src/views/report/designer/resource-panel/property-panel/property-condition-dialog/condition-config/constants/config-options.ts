/**
 * 条件配置常量
 * 提供字体、对齐、作用域、分页、链接目标等下拉选项
 */
import { t, i18n } from '@/locales'

/** 通用下拉项 */
export interface OptionItem {
  value: string | number | boolean
  label: string
}

const getFontOptions = (): OptionItem[] => [
  { value: '宋体', label: '宋体' },
  { value: '仿宋', label: '仿宋' },
  { value: '黑体', label: '黑体' },
  { value: '楷体', label: '楷体' },
  { value: '微软雅黑', label: '微软雅黑' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
  { value: 'Courier New', label: 'Courier New' }
]

const getFontSizeOptions = (): OptionItem[] =>
  Array.from({ length: 100 }, (_, i) => ({
    value: i + 1,
    label: (i + 1).toString()
  }))

const getYesNoOptions = (): OptionItem[] => [
  { value: 'true', label: i18n.global.t('dialog.propCondition.yes') },
  { value: 'false', label: i18n.global.t('dialog.propCondition.no') }
]

const getAlignOptions = (): OptionItem[] => [
  { value: 'left', label: i18n.global.t('dialog.propCondition.left') },
  { value: 'center', label: i18n.global.t('dialog.propCondition.center') },
  { value: 'right', label: i18n.global.t('dialog.propCondition.right') }
]

const getValignOptions = (): OptionItem[] => [
  { value: 'top', label: i18n.global.t('dialog.propCondition.top') },
  { value: 'middle', label: i18n.global.t('dialog.propCondition.mid') },
  { value: 'bottom', label: i18n.global.t('dialog.propCondition.bottom') }
]

const getScopeOptions = (): OptionItem[] => [
  { value: 'cell', label: i18n.global.t('dialog.propCondition.currentCell') },
  { value: 'row', label: i18n.global.t('dialog.propCondition.currentRow') },
  { value: 'column', label: i18n.global.t('dialog.propCondition.currentCol') }
]

const getPagingPositionOptions = (): OptionItem[] => [
  { value: 'before', label: i18n.global.t('dialog.propCondition.rowBefore') },
  { value: 'after', label: i18n.global.t('dialog.propCondition.rowAfter') }
]

const getLinkTargetOptions = (): OptionItem[] => [
  { value: '_blank', label: i18n.global.t('dialog.propCondition.newWindow') },
  { value: '_self', label: i18n.global.t('dialog.propCondition.currentWindow') },
  { value: '_parent', label: i18n.global.t('dialog.propCondition.parentWindow') },
  { value: '_top', label: i18n.global.t('dialog.propCondition.topWindow') }
]

const getPresetColors = (): string[] => [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#00FFFF', '#FF00FF', '#C0C0C0', '#808080',
  '#800000', '#808000', '#008000', '#800080', '#008080',
  '#000080', '#FFA500', '#FFC0CB', '#A52A2A', '#4B0082'
]

const getSuggestionList = (): string[] => [
  'yyyy/MM/dd',
  'yyyy/MM',
  'yyyy-MM',
  'yyyy',
  'yyyy-MM-dd HH:mm:ss',
  'yyyy年MM月dd日 HH:mm:ss',
  'yyyy-MM-dd',
  'yyyy年MM月dd日',
  'HH:mm',
  'HH:mm:ss',
  '#.##',
  '#.00',
  '##.##%',
  '##.00%',
  '##,###.##',
  '￥##,###.##',
  '$##,###.##',
  '0.00E00',
  '##0.0E0'
]

export default {
  getFontOptions,
  getFontSizeOptions,
  getYesNoOptions,
  getAlignOptions,
  getValignOptions,
  getScopeOptions,
  getPagingPositionOptions,
  getLinkTargetOptions,
  getPresetColors,
  getSuggestionList
}
