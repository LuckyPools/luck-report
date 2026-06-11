/**
 * Schema 统一导出入口
 *
 * 本文件统一导出所有拆分后的 Schema 模块，便于外部引用。
 */

// 表达式对象 Schema（独立文件，避免循环依赖）
export {
  ExpressionObjectSchema
} from './expression-schema'

// 单元格相关 Schema
export {
  BorderSchema,
  CellStyleSchema,
  SimpleValueSchema,
  ExpressionValueSchema,
  DatasetConditionSchema,
  DatasetValueSchema,
  LinkParameterSchema,
  ConditionSchema,
  ConditionCellStyleSchema,
  PagingSchema,
  ConditionPropertyItemSchema,
  CellPositionSchema,
  CellValueSchema,
  CellSchema,
  CellsSchema,
  getSimpleCellTemplate,
  getDatasetCellTemplate,
  getExpressionCellTemplate,
  getExpressionCellWithConditionTemplate,
  getCellTemplateByType,
  validateCell,
  validateCells,
  normalizeCell,
  normalizeCells
} from './cell-schema'

// 图片相关 Schema
export {
  ImageValueSchema,
  getImageCellTemplate,
  validateImageValue
} from './image-schema'

// 图表相关 Schema
export {
  ChartDatasetSchema,
  ChartAxisScaleLabelSchema,
  ChartAxisTicksSchema,
  ChartAxisSchema,
  ChartOptionSchema,
  ChartPluginSchema,
  ChartValueSchema,
  getChartCellTemplate,
  validateChartValue
} from './chart-schema'

// 二维码/条码相关 Schema
export {
  ZxingValueSchema,
  getQrcodeCellTemplate,
  getBarcodeCellTemplate,
  validateZxingValue
} from './zxing-schema'

// 数据源/数据集相关 Schema
export {
  ParameterSchema,
  FieldSchema,
  SqlDatasetSchema,
  BeanDatasetSchema,
  DatasetSchema,
  DatasourceSchema,
  getSqlDatasetTemplate,
  getBuildinDatasourceTemplate,
  validateDataset,
  validateDatasource
} from './datasource-schema'

// 斜线表头相关 Schema
export {
  SlashSchema,
  SlashValueSchema,
  getSlashCellTemplate,
  validateSlashValue
} from './slash-schema'

// 查询表单相关 Schema
export {
  OptionSchema,
  RegListSchema,
  BaseInputComponentSchema,
  InputSchema,
  InputNumberSchema,
  SelectSchema,
  RadioGroupSchema,
  CheckboxGroupSchema,
  SwitchSchema,
  DatePickerSchema,
  ButtonSchema,
  FormComponentSchema,
  RowComponentSchema,
  SearchFormSchema,
  validateSearchForm,
  getSearchFormTemplate,
  normalizeSearchForm
} from './search-schema'

// 页面配置相关 Schema
export {
  PaperSchema,
  HeaderFooterSchema,
  validatePaper,
  getPaperConfigTemplate,
  getHeaderFooterTemplate,
  normalizePaper
} from './page-schema'

// 行定义相关 Schema
export {
  BandSchema,
  RowDefinitionSchema,
  RowHeaderSchema,
  validateRowDefinition,
  validateRowHeader,
  normalizeRowDefinition,
  normalizeRowDefinitions,
  getRowDefinitionsTemplate
} from './row-schema'

// 列定义相关 Schema
export {
  ColumnDefinitionSchema,
  validateColumnDefinition,
  normalizeColumnDefinition,
  normalizeColumnDefinitions,
  getColumnDefinitionsTemplate
} from './col-schema'