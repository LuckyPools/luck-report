/**
 * 页面配置数据模型 JSON Schema 定义
 */

// ==================== 页面配置 Schema ====================

/**
 * Paper 纸张配置 Schema
 */
export const PaperSchema = {
  type: 'object',
  properties: {
    leftMargin: { type: 'integer', description: '左边距(pt)', default: 90 },
    rightMargin: { type: 'integer', description: '右边距(pt)', default: 90 },
    topMargin: { type: 'integer', description: '上边距(pt)', default: 72 },
    bottomMargin: { type: 'integer', description: '下边距(pt)', default: 72 },
    paperType: {
      type: 'string',
      enum: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10',
             'B0', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'CUSTOM'],
      description: '纸张类型，默认A4'
    },
    pagingMode: { type: 'string', enum: ['fitpage', 'fixrows'], description: '分页模式' },
    fixRows: { type: 'integer', description: '固定行数分页时每页行数' },
    width: { type: 'integer', description: '纸张宽度(pt)，CUSTOM时需手动指定' },
    height: { type: 'integer', description: '纸张高度(pt)，CUSTOM时需手动指定' },
    orientation: { type: 'string', enum: ['portrait', 'landscape'], description: '纸张方向' },
    htmlReportAlign: { type: 'string', enum: ['left', 'center', 'right'], description: 'HTML报表对齐方式' },
    bgImage: { type: 'string', description: '背景图片URL' },
    columnEnabled: { type: 'boolean', description: '是否启用分栏' },
    columnCount: { type: 'integer', minimum: 2, maximum: 10, description: '分栏数' },
    columnMargin: { type: 'integer', description: '分栏间距(pt)' },
    htmlIntervalRefreshValue: { type: 'integer', minimum: 0, description: 'HTML自动刷新间隔(秒)' }
  },
  required: ['paperType', 'pagingMode', 'orientation'],
  description: '纸张配置对象'
}

/**
 * HeaderFooterDefinition 页眉页脚 Schema
 */
export const HeaderFooterSchema = {
  type: 'object',
  properties: {
    left: { type: 'string', description: '左侧内容，支持表达式' },
    center: { type: 'string', description: '中间内容，支持表达式' },
    right: { type: 'string', description: '右侧内容，支持表达式如page()和pages()' },
    fontFamily: { type: 'string', description: '字体族', default: '宋体' },
    fontSize: { type: 'integer', description: '字体大小', default: 10 },
    forecolor: { type: 'string', description: '字体颜色，RGB格式如0,0,0' },
    bold: { type: 'boolean', description: '是否加粗' },
    italic: { type: 'boolean', description: '是否斜体' },
    underline: { type: 'boolean', description: '是否下划线' },
    height: { type: 'integer', description: '页眉/页脚高度(pt)', default: 30 },
    margin: { type: 'integer', description: '页眉/页脚与内容的间距(pt)', default: 30 }
  },
  required: [],
  description: '页眉页脚配置对象'
}

// ==================== 数据校验函数 ====================

/**
 * 校验页面配置数据是否符合规范
 * 收集 paperType/pagingMode/orientation/fixRows/columnCount/边距 等字段的错误，一次性返回
 * 避免 LLM 一次只看到一条报错反复重试
 *
 * @param paper - 页面配置对象
 * @returns 错误信息（多条用换行分隔），undefined 表示校验通过
 */
export function validatePaper(paper: any): string | undefined {
  if (!paper || typeof paper !== 'object') {
    return 'paper 必须是对象类型'
  }
  const errors: string[] = []

  // paperType 校验
  const validPaperTypes = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10',
                           'B0', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'CUSTOM']
  if (paper.paperType && !validPaperTypes.includes(paper.paperType)) {
    errors.push(`paper.paperType 必须是 ${validPaperTypes.join('/')} 之一，当前为 ${paper.paperType}`)
  }

  // pagingMode 校验
  if (paper.pagingMode && !['fitpage', 'fixrows'].includes(paper.pagingMode)) {
    errors.push(`paper.pagingMode 必须是 fitpage/fixrows 之一，当前为 ${paper.pagingMode}`)
  }

  // orientation 校验
  if (paper.orientation && !['portrait', 'landscape'].includes(paper.orientation)) {
    errors.push(`paper.orientation 必须是 portrait/landscape 之一，当前为 ${paper.orientation}`)
  }

  // fixRows 校验（pagingMode 为 fixrows 时）
  if (paper.pagingMode === 'fixrows') {
    if (typeof paper.fixRows !== 'number' || paper.fixRows < 1) {
      errors.push('paper.fixRows 必须是大于0的整数（当 pagingMode 为 fixrows 时）')
    }
  }

  // columnCount 校验（columnEnabled 为 true 时）
  if (paper.columnEnabled === true) {
    if (typeof paper.columnCount !== 'number' || paper.columnCount < 2 || paper.columnCount > 10) {
      errors.push('paper.columnCount 必须是 2-10 之间的整数（当 columnEnabled 为 true 时）')
    }
  }

  // 边距校验：逐个边距独立报错，LLM 一次能看到所有非法的边距字段
  const margins = ['leftMargin', 'rightMargin', 'topMargin', 'bottomMargin']
  for (const margin of margins) {
    if (paper[margin] !== undefined && typeof paper[margin] !== 'number') {
      errors.push(`paper.${margin} 必须是数字类型`)
    }
  }

  return errors.length ? errors.join('\n') : undefined
}

// ==================== 模板生成函数 ====================

/**
 * 生成页面配置模板，包含 A4 纵向的默认纸张设置
 * 注意：paper 只包含纸张相关配置，header/footer 是 reportDef 的独立字段，不在此模板中
 *
 * @returns 完整的页面配置模板对象，包含所有必填字段和默认值
 */
export function getPaperConfigTemplate(): any {
  return {
    paperType: 'A4',
    pagingMode: 'fitpage',
    orientation: 'portrait',
    leftMargin: 90,
    rightMargin: 90,
    topMargin: 72,
    bottomMargin: 72,
    width: 595,
    height: 842,
    htmlReportAlign: 'center',
    bgImage: '',
    columnEnabled: false,
    columnCount: 2,
    columnMargin: 20,
    htmlIntervalRefreshValue: 0
  }
}

/**
 * 生成页眉页脚配置模板
 * header 和 footer 是 reportDef 的独立字段，与 paper 平级
 *
 * @param {'header'|'footer'} type - 生成页眉还是页脚的模板
 * @returns 页眉或页脚的配置模板对象
 */
export function getHeaderFooterTemplate(type: 'header' | 'footer'): any {
  const isFooter = type === 'footer'
  return {
    left: '',
    center: isFooter ? '第page()页/共pages()页' : '',
    right: '',
    fontFamily: '宋体',
    fontSize: 10,
    forecolor: '0,0,0',
    bold: false,
    italic: false,
    underline: false,
    height: 30,
    margin: 30
  }
}

// ==================== 数据规范化函数 ====================

/**
 * 规范化页面配置数据
 *
 * @param paper - 页面配置对象
 * @returns 规范化后的页面配置对象
 */
export function normalizePaper(paper: any): any {
  if (!paper || typeof paper !== 'object') return paper

  // 补齐分栏相关布尔属性
  if (paper.columnEnabled === undefined || paper.columnEnabled === null) {
    paper.columnEnabled = false
  }
  // 启用分栏但缺 columnCount 时补默认值
  if (paper.columnEnabled === true && (paper.columnCount === undefined || paper.columnCount === null)) {
    paper.columnCount = 2
  }
  if (paper.columnEnabled === true && (paper.columnMargin === undefined || paper.columnMargin === null)) {
    paper.columnMargin = 20
  }

  // fixrows 模式下补 fixRows 默认值
  if (paper.pagingMode === 'fixrows' && (paper.fixRows === undefined || paper.fixRows === null)) {
    paper.fixRows = 30
  }

  return paper
}