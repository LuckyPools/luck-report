/**
 * 数据模型 JSON Schema 定义
 *
 * 本文件定义了报表系统的核心数据模型、约束规则和校验函数。
 * 所有数据规范在此集中管理，markdown 文档中不再重复定义。
 *
 * ==================== 一、单元格数据模型 ====================
 *
 * 单元格（Cell）是报表的基本组成单元，包含以下核心属性：
 *
 * 【位置属性】
 * - rowNumber: 行号，从1开始（必填）
 * - columnNumber: 列号，从1开始（必填）
 * - rowSpan: 行合并数，0表示不合并
 * - colSpan: 列合并数，0表示不合并
 * - name: 单元格名称，如A1、B2（自动生成）
 *
 * 【值对象】（必填，根据type有不同结构）
 * - type: 值类型，可选值：
 *   - simple: 简单文本值
 *   - expression: 表达式值
 *   - dataset: 数据集值
 *   - image: 图片值
 *   - chart: 图表值
 *   - slash: 斜线表头值
 *   - zxing: 二维码/条码值
 *
 * 【样式属性】
 * - bgcolor: 背景色，RGB格式"R,G,B"，如"255,255,0"表示黄色
 * - forecolor: 前景色（字体颜色），RGB格式
 * - fontSize: 字体大小，如10、12、14
 * - fontFamily: 字体族，如"宋体"、"微软雅黑"
 * - format: 格式化模式，如"#.##"保留两位小数
 * - align: 水平对齐，可选值：left/center/right
 * - valign: 垂直对齐，可选值：top/middle/bottom
 * - bold/italic/underline: 是否加粗/斜体/下划线
 * - wrapCompute: 是否自动换行
 * - leftBorder/rightBorder/topBorder/bottomBorder: 边框对象
 *
 * 【展开属性】
 * - expand: 展开方向，可选值：None/Down/Right
 * - leftParentCellName: 左父格名称，null表示无，root表示根
 * - topParentCellName: 上父格名称，null表示无，root表示根
 *
 * 【其他属性】
 * - linkUrl: 链接地址，支持表达式${...}
 * - linkTargetWindow: 链接打开方式，_blank或null
 * - linkParameters: 链接参数数组
 * - fillBlankRows: 是否填充空白行
 * - multiple: 填充行数倍数
 * - conditionPropertyItems: 条件属性列表
 *
 * ==================== 二、单元格值类型详解 ====================
 *
 * 【simple - 简单文本值】
 * {
 *   type: 'simple',
 *   value: '文本内容'
 * }
 *
 * 【expression - 表达式值】
 * {
 *   type: 'expression',
 *   value: '表达式结果',
 *   text: '表达式源码'
 * }
 *
 * 【dataset - 数据集值】
 * {
 *   type: 'dataset',
 *   datasetName: '数据集名称',
 *   aggregate: '聚合方式',  // group/select/sum/count/max/min/avg/customgroup
 *   property: '字段名',
 *   order: 'none/asc/desc',
 *   conditions: [],  // 过滤条件
 *   mappingType: 'simple/dataset/custom',
 *   mappingItems: []  // 自定义映射项
 * }
 *
 * 【image - 图片值】
 * {
 *   type: 'image',
 *   path: '图片路径',
 *   source: 'text',
 *   width: 100,
 *   height: 100
 * }
 *
 * 【zxing - 二维码/条码值】
 * {
 *   type: 'zxing',
 *   category: 'qrcode/barcode',
 *   text: '编码内容',
 *   width: 100,
 *   height: 100,
 *   format: '条码格式',  // 如AZTEC
 *   codeDisplay: false  // 是否显示编码
 * }
 *
 * ==================== 三、数据源/数据集模型 ====================
 *
 * 【数据源 Datasource】
 * - name: 数据源名称，报表内唯一（必填）
 * - type: 数据源类型，可选值：jdbc/spring/buildin（必填）
 * - datasets: 数据集列表
 *
 * jdbc类型独有属性：
 * - driver: JDBC驱动类名（必填）
 * - url: 数据库连接URL（必填）
 * - username: 数据库用户名（必填）
 * - password: 数据库密码（必填）
 *
 * spring类型独有属性：
 * - beanId: Spring Bean ID（必填）
 *
 * 【数据集 Dataset】
 * - name: 数据集名称，数据源内唯一（必填）
 * - sql: SQL查询语句（SQL数据集必填）
 * - parameters: 查询参数列表
 * - fields: 字段列表（必填）
 *
 * 【查询参数 Parameter】
 * - name: 参数名称，需与查询表单vModel一致（必填）
 * - type: 参数类型，可选值：String/Integer/Float/Boolean/Date/List（必填）
 * - defaultValue: 默认值，空字符串表示无默认值
 *
 * 【字段 Field】
 * - name: 字段名称（必填）
 *
 * ==================== 四、约束规则 ====================
 *
 * 【单元格约束】
 * 1. rowNumber、columnNumber 必须是大于0的整数
 * 2. value.type 必须是 simple/expression/dataset/image/chart/slash/zxing 之一
 * 3. expand 必须是 None/Down/Right 之一
 * 4. cellStyle.align 必须是 left/center/right 之一
 * 5. cellStyle.valign 必须是 top/middle/bottom 之一
 * 6. 颜色格式必须是 RGB 格式 "R,G,B"，如 "255,0,0"
 * 7. dataset类型单元格必须包含 datasetName、aggregate、property
 * 8. aggregate 必须是 group/select/sum/count/max/min/avg/customgroup 之一
 *
 * 【数据集约束】
 * 1. name 不能为空
 * 2. fields 数组不能为空（至少包含一个字段）
 * 3. SQL数据集必须包含 sql 字段
 * 4. 参数 name 和 type 不能为空
 *
 * 【数据源约束】
 * 1. name 不能为空
 * 2. type 必须是 jdbc/spring/buildin 之一
 * 3. jdbc类型必须包含 driver、url、username、password
 * 4. spring类型必须包含 beanId
 *
 * ==================== 五、使用方式 ====================
 *
 * 【获取数据模板】
 * 调用 get_cell_template/get_dataset_template/get_datasource_template 工具获取符合规范的完整模板。
 *
 * 【数据校验】
 * 在工具执行前调用 validateCell/validateDataset/validateDatasource 进行校验，
 * 校验失败会返回错误信息，LLM 根据错误信息修正数据后重试。
 *
 * 用于：
 * 1. 工具 inputSchema 定义，指导 LLM 生成符合规范的数据
 * 2. 工具执行前校验，拦截不符合规范的数据
 */

// ==================== 单元格相关 Schema ====================

/**
 * Border 边框 Schema
 */
export const BorderSchema = {
  type: 'object',
  properties: {
    width: { type: 'integer', description: '边框宽度，如1、2' },
    color: { type: 'string', description: '边框颜色，RGB格式如"0,0,0"', pattern: '^[0-9]+,[0-9]+,[0-9]+$' },
    style: { type: 'string', enum: ['solid', 'dashed', 'doublesolid'], description: '边框样式：实线/虚线/双实线' }
  },
  required: ['width', 'color', 'style']
}

/**
 * CellStyle 单元格样式 Schema
 */
export const CellStyleSchema = {
  type: 'object',
  properties: {
    bgcolor: { type: 'string', description: '背景色，RGB格式"R,G,B"，null为透明', pattern: '^[0-9]+,[0-9]+,[0-9]+$' },
    forecolor: { type: 'string', description: '前景色（字体颜色），RGB格式如"0,0,0"' },
    fontSize: { type: 'integer', description: '字体大小，如10、12、14' },
    fontFamily: { type: 'string', description: '字体族，如"宋体"、"微软雅黑"' },
    format: { type: 'string', description: '格式化模式，如"#.##"保留两位小数' },
    lineHeight: { type: 'integer', description: '行高倍数，0为默认，>0为倍数' },
    align: { type: 'string', enum: ['left', 'center', 'right'], description: '水平对齐' },
    valign: { type: 'string', enum: ['top', 'middle', 'bottom'], description: '垂直对齐' },
    bold: { type: 'boolean', description: '是否加粗' },
    italic: { type: 'boolean', description: '是否斜体' },
    underline: { type: 'boolean', description: '是否下划线' },
    wrapCompute: { type: 'boolean', description: '是否自动换行' },
    leftBorder: { ...BorderSchema, description: '左边框' },
    rightBorder: { ...BorderSchema, description: '右边框' },
    topBorder: { ...BorderSchema, description: '上边框' },
    bottomBorder: { ...BorderSchema, description: '下边框' }
  }
}

/**
 * SimpleValue 简单文本值 Schema
 */
export const SimpleValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'simple' },
    value: { type: 'string', description: '文本内容' }
  },
  required: ['type', 'value']
}

/**
 * ExpressionObject 表达式对象 Schema
 * 表达式解析后的结构化对象，包含表达式列表和返回表达式
 */
export const ExpressionObjectSchema = {
  type: 'object',
  properties: {
    expr: { type: 'string', description: '表达式字符串，去除空格和换行后的紧凑形式' },
    expressionList: {
      type: 'array',
      description: '表达式列表，包含变量赋值、聚合函数调用等表达式片段',
      items: {
        type: 'object',
        properties: {
          expr: { type: 'string', description: '表达式片段，如"a=B2;"' },
          variable: { type: 'string', description: '变量名，如a、b、c、d' },
          expression: {
            type: 'object',
            description: '子表达式对象，可能是单元格引用、数据集聚合、函数调用等',
            properties: {
              expr: { type: 'string', description: '子表达式字符串' },
              cellName: { type: 'string', description: '单元格名称，如B2、C2' },
              datasetName: { type: 'string', description: '数据集名称' },
              aggregate: { type: 'string', description: '聚合方式，如max、sum' },
              property: { type: 'string', description: '字段名' },
              name: { type: 'string', description: '函数名称，如sum' },
              expressions: {
                type: 'array',
                description: '函数参数表达式列表',
                items: {
                  type: 'object',
                  properties: {
                    expr: { type: 'string', description: '参数表达式' },
                    cellName: { type: 'string', description: '单元格名称' }
                  }
                }
              },
              operators: {
                type: 'array',
                description: '运算符列表，如["Add","Add","Add"]',
                items: { type: 'string', enum: ['Add', 'Subtract', 'Multiply', 'Divide'] }
              },
              text: { type: 'string', description: '文本值，用于变量引用' },
              value: { type: 'number', description: '数值' }
            }
          },
          operators: {
            type: 'array',
            description: '运算符列表',
            items: { type: 'string', enum: ['Add', 'Subtract', 'Multiply', 'Divide'] }
          },
          expressions: {
            type: 'array',
            description: '表达式数组，用于运算表达式',
            items: {
              type: 'object',
              properties: {
                expr: { type: 'string', description: '表达式' },
                operators: { type: 'array', description: '运算符列表' },
                expressions: { type: 'array', description: '嵌套表达式列表' },
                text: { type: 'string', description: '文本值' },
                value: { type: 'number', description: '数值' }
              }
            }
          }
        }
      }
    },
    returnExpression: {
      type: 'object',
      description: '返回表达式，通常为null，表达式列表中最后一个表达式即为返回值',
      properties: {
        expr: { type: 'string', description: '返回表达式字符串' }
      }
    }
  },
  required: ['expr']
}

/**
 * ExpressionValue 表达式值 Schema
 * 表达式单元格的值对象，包含表达式源码和解析后的表达式对象
 */
export const ExpressionValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'expression' },
    value: { type: 'string', description: '表达式源码，包含换行和空格的完整表达式文本' },
    text: { type: 'string', description: '表达式源码，与value相同' },
    expression: { ...ExpressionObjectSchema, description: '表达式对象，解析后的结构化数据' }
  },
  required: ['type', 'value', 'text']
}

/**
 * DatasetCondition 数据集过滤条件 Schema
 * 支持链式嵌套条件结构
 */
export const DatasetConditionSchema = {
  type: 'object',
  properties: {
    left: { type: 'string', description: '左侧表达式，字段名或表达式' },
    op: { type: 'string', enum: ['GreatThen', 'EqualsGreatThen', 'LessThen', 'EqualsLessThen', 'Equals', 'NotEquals', 'In', 'NotIn', 'Like'], description: '比较运算符枚举值' },
    operation: { type: 'string', description: '操作符符号，如==、<、>、<=' },
    right: { type: 'string', description: '右侧表达式，比较值' },
    join: { type: 'string', enum: ['and', 'or'], description: '条件连接方式' },
    type: { type: 'string', description: '条件类型，如property表示属性条件' },
    nextCondition: { type: 'object', nullable: true, description: '下一个嵌套条件（已废弃，必须设为null）' }
  }
}

/**
 * DatasetValue 数据集值 Schema
 * 文档参考: dataset-cell.md
 */
export const DatasetValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'dataset' },
    datasetName: { type: 'string', description: '数据集名称，必须为报表中已定义的数据集' },
    property: { type: 'string', description: '字段名称，必须为数据集中的字段名' },
    aggregate: {
      type: 'string',
      enum: ['select', 'group', 'customgroup', 'regroup', 'reselect', 'sum', 'count', 'max', 'min', 'avg'],
      description: '聚合方式：select/group/customgroup/regroup/reselect支持展开，sum/count/max/min/avg返回单值'
    },
    order: { type: 'string', enum: ['none', 'asc', 'desc'], description: '排序方式，仅select/group等聚合可用' },
    expr: { type: 'string', nullable: true, description: '表达式字符串，通常为null' },
    value: { type: 'string', description: '表达式值字符串，如"orders.group(price)"' },
    conditions: {
      type: 'array',
      description: '过滤条件列表，支持链式嵌套结构',
      items: DatasetConditionSchema
    },
    groupItems: {
      type: 'array',
      description: '自定义分组项列表，当aggregate为customgroup时使用',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '分组名称' },
          conditions: { type: 'array', description: '分组条件列表', items: DatasetConditionSchema }
        }
      }
    },
    mappingType: { type: 'string', enum: ['simple', 'dataset'], description: '数据映射类型，仅group/select聚合可用' },
    mappingItems: {
      type: 'array',
      description: '简单映射项列表，当mappingType为simple时使用',
      items: {
        type: 'object',
        properties: {
          value: { type: 'string', description: '实际值' },
          label: { type: 'string', description: '显示值' }
        }
      }
    },
    mappingDataset: { type: 'string', description: '数据集映射-数据集名称，当mappingType为dataset时使用' },
    mappingKeyProperty: { type: 'string', description: '数据集映射-键字段' },
    mappingValueProperty: { type: 'string', description: '数据集映射-值字段' }
  },
  required: ['type', 'datasetName', 'aggregate', 'property'],
  description: '数据集值对象，通过聚合方式从数据集提取数据'
}

/**
 * ImageValue 图片值 Schema
 * 文档参考: image-cell.md
 */
export const ImageValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'image' },
    source: { type: 'string', enum: ['text', 'expression'], description: '图片来源：text为静态路径，expression为表达式动态计算' },
    path: { type: 'string', description: '图片路径，当source为text时为静态路径，当source为expression时为表达式计算结果路径' },
    value: { type: 'string', description: '表达式文本，当source为expression时使用，如"return https://..."' },
    expr: { type: 'string', description: '表达式字符串（已废弃，通常为null）' },
    expression: { ...ExpressionObjectSchema, description: '表达式对象，当source为expression时可能包含，通常为null' },
    width: { type: 'integer', description: '图片宽度(px)，最小值1', minimum: 1 },
    height: { type: 'integer', description: '图片高度(px)，最小值1', minimum: 1 }
  },
  required: ['type', 'source', 'width', 'height'],
  description: '图片值对象，支持静态路径和表达式两种来源模式'
}

/**
 * ZxingValue 二维码/条码值 Schema
 * 文档参考: qrcode-cell.md, barcode-cell.md
 */
export const ZxingValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'zxing' },
    category: { type: 'string', enum: ['qrcode', 'barcode'], description: '分类：qrcode为二维码，barcode为条码' },
    source: { type: 'string', enum: ['text', 'expression'], description: '数据来源：text为静态文本，expression为表达式动态计算' },
    value: { type: 'string', description: '编码内容或表达式文本' },
    text: { type: 'string', description: '编码内容文本，与value相同' },
    expr: { type: 'string', nullable: true, description: '表达式字符串，通常为null' },
    expression: { ...ExpressionObjectSchema, description: '表达式对象，当source为expression时可能包含，通常为null' },
    width: { type: 'integer', description: '宽度(px)，最小值1，默认100', minimum: 1 },
    height: { type: 'integer', description: '高度(px)，最小值1，默认100', minimum: 1 },
    format: {
      type: 'string',
      enum: ['QR_CODE', 'AZTEC', 'CODABAR', 'CODE_39', 'CODE_93', 'CODE_128', 'DATA_MATRIX', 'EAN_8', 'EAN_13', 'ITF', 'PDF_417', 'UPC_A', 'UPC_E'],
      description: '编码格式：qrcode固定QR_CODE，barcode可选多种格式'
    },
    codeDisplay: { type: 'boolean', description: '是否显示编码文本' }
  },
  required: ['type', 'category', 'source', 'value'],
  description: '二维码/条码值对象，支持静态文本和表达式两种来源模式'
}

/**
 * ChartDataset 图表数据集 Schema
 * 文档参考: chart-cell.md
 *
 * 不同图表类型的数据集配置差异：
 * - 基础图表(bar/horizontalBar/line/radar)：使用 categoryProperty/valueProperty/seriesType/collectType
 * - 饼图类(pie/doughnut/polarArea)：使用 categoryProperty/valueProperty/seriesType/collectType/labels
 * - 散点图(scatter)：使用 xProperty/yProperty/fill/lineTension
 * - 气泡图(bubble)：使用 xProperty/yProperty/rProperty
 */
export const ChartDatasetSchema = {
  type: 'object',
  properties: {
    // 图表类型
    type: {
      type: 'string',
      enum: ['bar', 'horizontalBar', 'line', 'pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble'],
      description: '图表类型：bar-柱状图，horizontalBar-横向柱状图，line-折线图，pie-饼图，doughnut-环形图，radar-雷达图，polarArea-极区图，scatter-散点图，bubble-气泡图'
    },

    // 数据集名称（所有图表类型必填）
    datasetName: { type: 'string', description: '绑定的数据集名称，必须为报表中已定义的数据集' },

    // 分类属性（所有图表类型必填）
    categoryProperty: { type: 'string', description: '分类属性，用于数据分组' },

    // ========== 基础图表属性（bar/line/pie等）==========
    valueProperty: { type: 'string', description: '值属性(Y轴字段)，基础图表(bar/line/pie等)使用' },
    seriesType: { type: 'string', enum: ['text', 'property'], description: '系列类型：text为静态文本，property为属性分组，基础图表使用' },
    seriesProperty: { type: 'string', description: '系列属性字段，当seriesType为property时使用' },
    seriesText: { type: 'string', description: '系列静态文本，当seriesType为text时使用' },
    collectType: { type: 'string', enum: ['select', 'sum', 'count', 'avg', 'max', 'min'], description: '聚合方式，基础图表使用' },
    labels: { type: 'array', items: { type: 'string' }, description: '标签列表，饼图类图表使用' },

    // ========== 散点图/气泡图属性==========
    xProperty: { type: 'string', description: 'X轴字段，散点图/气泡图使用' },
    yProperty: { type: 'string', description: 'Y轴字段，散点图/气泡图使用' },
    rProperty: { type: 'string', description: '半径字段，仅气泡图使用' },
    fill: { type: 'boolean', description: '是否填充区域，散点图使用' },
    lineTension: { type: 'number', description: '线条张力(0-1)，散点图使用' },

    // 格式化
    format: { type: 'string', description: '格式化模式，如#.##、yyyy-MM-dd' }
  },
  required: ['type', 'datasetName', 'categoryProperty'],
  description: '图表数据集配置，不同图表类型使用不同属性组合'
}

/**
 * ChartAxisScaleLabel 图表轴标题配置 Schema
 */
export const ChartAxisScaleLabelSchema = {
  type: 'object',
  properties: {
    display: { type: 'boolean', description: '是否显示轴标题' },
    labelString: { type: 'string', description: '标题文本' },
    fontColor: { type: 'string', description: '字体颜色，如#666' },
    fontSize: { type: 'integer', description: '字体大小' },
    fontStyle: { type: 'string', enum: ['normal', 'bold', 'italic'], description: '字体样式' }
  },
  description: '图表轴标题配置'
}

/**
 * ChartAxisTicks 图表轴刻度配置 Schema
 */
export const ChartAxisTicksSchema = {
  type: 'object',
  properties: {
    minRotation: { type: 'integer', description: '最小旋转角度' },
    maxRotation: { type: 'integer', description: '最大旋转角度' }
  },
  description: '图表轴刻度配置'
}

/**
 * ChartAxis 图表轴配置 Schema
 */
export const ChartAxisSchema = {
  type: 'object',
  properties: {
    rotation: { type: 'integer', description: '标签旋转角度，如0、45、90' },
    scaleLabel: { ...ChartAxisScaleLabelSchema, description: '轴标题配置' },
    xposition: { type: 'string', enum: ['top', 'bottom'], description: 'X轴位置' },
    yposition: { type: 'string', enum: ['left', 'right'], description: 'Y轴位置' },
    ticks: { ...ChartAxisTicksSchema, description: '刻度配置' }
  },
  description: '图表轴配置'
}

/**
 * ChartOption 图表选项 Schema
 * 支持多种选项类型：title/legend/animation/layout
 */
export const ChartOptionSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['title', 'legend', 'layout', 'animation'], description: '选项类型' },
    // title 选项属性
    display: { type: 'boolean', description: '是否显示' },
    position: { type: 'string', enum: ['top', 'bottom', 'left', 'right'], description: '位置' },
    text: { type: 'string', description: '标题文本，type为title时使用' },
    fontSize: { type: 'integer', description: '字体大小' },
    fontColor: { type: 'string', description: '字体颜色，如#666' },
    fontStyle: { type: 'string', enum: ['normal', 'bold', 'italic'], description: '字体样式' },
    padding: { type: 'integer', description: '内边距' },
    // legend 选项属性
    labels: { type: 'array', items: { type: 'string' }, description: '图例标签列表' },
    // animation 选项属性
    duration: { type: 'integer', description: '动画持续时间(ms)' },
    easing: { type: 'string', description: '动画缓动效果' },
    // layout 选项属性
    layout: {
      type: 'object',
      properties: {
        top: { type: 'integer', description: '上边距' },
        bottom: { type: 'integer', description: '下边距' },
        left: { type: 'integer', description: '左边距' },
        right: { type: 'integer', description: '右边距' }
      },
      description: '布局配置'
    }
  },
  description: '图表选项配置'
}

/**
 * ChartPlugin 图表插件 Schema
 */
export const ChartPluginSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '插件名称，如data-labels' },
    display: { type: 'boolean', description: '是否启用' }
  },
  description: '图表插件配置'
}

/**
 * ChartValue 图表值 Schema
 * 文档参考: chart-cell.md
 */
export const ChartValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'chart' },
    value: { type: 'string', nullable: true, description: '值字段，通常为null' },
    chart: {
      type: 'object',
      properties: {
        dataset: ChartDatasetSchema,
        xaxes: { ...ChartAxisSchema, description: 'X轴配置，饼图/环形图等无轴图表无需配置' },
        yaxes: { ...ChartAxisSchema, description: 'Y轴配置，饼图/环形图等无轴图表无需配置' },
        options: { type: 'array', items: ChartOptionSchema, description: '图表选项列表(title/legend/layout/animation)' },
        plugins: { type: 'array', items: ChartPluginSchema, description: '图表插件列表(data-labels等)' }
      },
      required: ['dataset']
    }
  },
  required: ['type', 'chart'],
  description: '图表值对象，包含完整图表配置'
}

/**
 * Slash 斜线对象 Schema
 * 文档参考: diagonal-header-cell.md
 */
export const SlashSchema = {
  type: 'object',
  properties: {
    x: { type: 'number', description: '文本X坐标，相对于单元格的横坐标位置' },
    y: { type: 'number', description: '文本Y坐标，相对于单元格的纵坐标位置' },
    degree: { type: 'number', description: '斜线角度，如45、30' },
    text: { type: 'string', description: '斜线上的文本标签' }
  },
  required: ['x', 'y', 'degree', 'text'],
  description: '斜线对象，包含坐标、角度和文本'
}

/**
 * SlashValue 斜线表头值 Schema
 * 文档参考: diagonal-header-cell.md
 */
export const SlashValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'slash' },
    slashes: {
      type: 'array',
      items: SlashSchema,
      description: '斜线列表，每条斜线包含坐标、角度和文本'
    },
    value: { type: 'string', nullable: true, description: '值字段，通常为null' },
    svg: { type: 'string', description: 'SVG内容，由系统渲染时自动生成' },
    base64Data: { type: 'string', description: 'Base64图片数据，由系统渲染时自动生成' }
  },
  required: ['type', 'slashes'],
  description: '斜线表头值对象，用于绘制斜线表头'
}

/**
 * CellValue 单元格值 Schema（根据 type 动态匹配）
 * 使用 oneOf 组合所有值类型，确保每种类型都有完整的属性校验
 */
export const CellValueSchema = {
  oneOf: [
    SimpleValueSchema,
    ExpressionValueSchema,
    DatasetValueSchema,
    ImageValueSchema,
    ZxingValueSchema,
    ChartValueSchema,
    SlashValueSchema
  ],
  description: '单元格值对象，根据type不同有不同结构'
}

/**
 * LinkParameter 链接参数 Schema
 */
/**
 * LinkParameter 链接参数 Schema
 * 条件属性中的链接参数，可包含表达式
 */
export const LinkParameterSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '参数名' },
    value: { type: 'string', description: '参数值，可为表达式' },
    valueExpression: {
      ...ExpressionObjectSchema,
      description: '参数值表达式对象，当value为表达式时使用'
    }
  },
  required: ['name', 'value']
}

/**
 * Condition 条件对象 Schema
 * 条件属性中的单个条件，用于判断是否满足条件
 */
export const ConditionSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['property', 'expression', 'cell', 'current'],
      description: '条件类型：property-属性条件(比较数据集字段值)，expression-表达式条件(左右均为表达式)，cell-单元格条件(比较指定单元格的值)，current-当前值条件(比较当前单元格自身值)'
    },
    left: { type: 'string', description: '左侧表达式，type为property时为字段名，type为cell时为单元格名称，type为current时为null' },
    op: {
      type: 'string',
      enum: ['GreatThen', 'EqualsGreatThen', 'LessThen', 'EqualsLessThen', 'Equals', 'NotEquals', 'In', 'NotIn', 'Like'],
      description: '比较运算符枚举值'
    },
    operation: {
      type: 'string',
      enum: ['>', '>=', '<', '<=', '==', '!=', 'in', 'not in', 'like'],
      description: '运算符符号表示'
    },
    right: { type: 'string', description: '右侧比较值' },
    join: { type: 'string', enum: ['and', 'or', null], description: '条件连接方式，多个条件时使用and或or连接' },
    nextCondition: { type: 'object', nullable: true, description: '下一个嵌套条件（已废弃，必须设为null）'}
  },
  required: ['type', 'op', 'right']
}

/**
 * ConditionCellStyle 条件样式 Schema
 * 继承 CellStyle 并增加样式作用范围属性
 */
export const ConditionCellStyleSchema = {
  type: 'object',
  properties: {
    ...CellStyleSchema.properties,
    bgcolorScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '背景色作用范围：cell-仅当前单元格，row-当前单元格所在整行，column-当前单元格所在整列' },
    forecolorScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '前景色作用范围' },
    fontSizeScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '字体大小作用范围' },
    fontFamilyScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '字体族作用范围' },
    alignScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '水平对齐作用范围' },
    valignScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '垂直对齐作用范围' },
    boldScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '加粗作用范围' },
    italicScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '斜体作用范围' },
    underlineScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '下划线作用范围' }
  },
  description: '条件样式对象，继承CellStyle并增加样式作用范围属性'
}

/**
 * Paging 分页配置 Schema
 * 条件属性中的分页配置，满足条件时触发分页
 */
export const PagingSchema = {
  type: 'object',
  properties: {
    position: { type: 'string', enum: ['before', 'after'], description: '分页位置：before-之前分页，after-之后分页' },
    line: { type: 'integer', description: '分页行数，0表示不分页' }
  },
  description: '分页配置对象，满足条件时触发分页'
}

/**
 * ConditionPropertyItem 条件属性项 Schema
 * 条件属性分组，包含一组条件及满足条件后的效果
 */
export const ConditionPropertyItemSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '条件名称，如"条件1"、"条件2"' },
    conditions: {
      type: 'array',
      items: ConditionSchema,
      description: '条件列表，条件之间通过join连接，空数组表示无条件限制'
    },
    rowHeight: { type: 'integer', description: '行高，0表示不修改' },
    colWidth: { type: 'integer', description: '列宽，0表示不修改' },
    newValue: { type: 'string', description: '新值，满足条件时替换单元格值，null表示不修改' },
    linkUrl: { type: 'string', description: '链接地址，满足条件时设置单元格链接' },
    linkTargetWindow: { type: 'string', enum: ['_blank', null], description: '链接打开方式' },
    linkParameters: { type: 'array', items: LinkParameterSchema, description: '链接参数列表' },
    cellStyle: { ...ConditionCellStyleSchema, description: '条件样式，满足条件时应用的样式' },
    paging: { ...PagingSchema, description: '分页配置，满足条件时触发分页' },
    expr: { type: 'string', description: '条件表达式（已废弃）' }
  },
  required: ['name', 'conditions']
}

/**
 * Cell 单元格完整定义 Schema
 * 基于 cell-common-attribute.md 数据模型
 */
export const CellSchema = {
  type: 'object',
  properties: {
    rowNumber: { type: 'integer', description: '行号，从1开始', minimum: 1 },
    columnNumber: { type: 'integer', description: '列号，从1开始', minimum: 1 },
    rowSpan: { type: 'integer', description: '行合并数，0表示不合并', minimum: 0 },
    colSpan: { type: 'integer', description: '列合并数，0表示不合并', minimum: 0 },
    name: { type: 'string', description: '单元格名称，如A1、B2' },
    value: CellValueSchema,
    cellStyle: CellStyleSchema,
    linkUrl: { type: 'string', description: '链接地址，支持表达式${...}' },
    linkTargetWindow: { type: 'string', enum: ['_blank', null], description: '链接打开方式' },
    linkParameters: { type: 'array', items: LinkParameterSchema, description: '链接参数列表' },
    fillBlankRows: { type: 'boolean', description: '是否填充空白行' },
    multiple: { type: 'integer', description: '填充行数倍数，0不限制', minimum: 0 },
    expand: { type: 'string', enum: ['None', 'Down', 'Right'], description: '展开方向' },
    leftParentCellName: { type: 'string', description: '左父格名称，如A1，null表示无，root表示根' },
    topParentCellName: { type: 'string', description: '上父格名称，如A1，null表示无，root表示根' },
    conditionPropertyItems: {
      type: 'array',
      items: ConditionPropertyItemSchema,
      description: '条件属性分组列表，每个分组包含一组条件及满足条件后的效果，按分组顺序依次判断，效果可叠加'
    }
  },
  required: ['rowNumber', 'columnNumber', 'value'],
  description: '单元格完整定义，包含位置、值、样式、展开方式等属性'
}

/**
 * CellPosition 单元格坐标 Schema
 * 用于 readCells 工具的参数，row/col 从1开始
 */
export const CellPositionSchema = {
  type: 'object',
  properties: {
    row: { type: 'integer', description: '行号，从1开始', minimum: 1 },
    col: { type: 'integer', description: '列号，从1开始', minimum: 1 }
  },
  required: ['row', 'col'],
  description: '单元格坐标，row/col从1开始'
}

/**
 * CellsSchema 批量单元格数据 Schema
 * 用于 writeCells 工具的参数，key为 "row,col" 格式（从1开始），value为单元格定义对象
 */
export const CellsSchema = {
  type: 'object',
  description: '批量单元格数据，key为 "row,col" 格式（从1开始），value为单元格定义对象',
  additionalProperties: CellSchema,
  patternProperties: {
    '^[0-9]+,[0-9]+$': CellSchema
  }
}

// ==================== 数据源/数据集相关 Schema ====================

/**
 * Parameter 查询参数 Schema
 */
export const ParameterSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '参数名称，需与查询表单vModel一致' },
    type: {
      type: 'string',
      enum: ['String', 'Integer', 'Float', 'Boolean', 'Date', 'List'],
      description: '参数数据类型'
    },
    defaultValue: { type: 'string', description: '默认值，空字符串表示无默认值' }
  },
  required: ['name', 'type'],
  description: 'SQL数据集查询参数，与查询表单绑定'
}

/**
 * Field 字段 Schema
 */
export const FieldSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '字段名称，如order_id、price' }
  },
  required: ['name'],
  description: '数据集字段定义'
}

/**
 * SqlDataset SQL数据集 Schema
 */
export const SqlDatasetSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '数据集名称，数据源内唯一' },
    sql: { type: 'string', description: 'SQL查询语句，支持参数占位符:paramName和脚本式SQL' },
    parameters: { type: 'array', items: ParameterSchema, description: '查询参数列表' },
    fields: { type: 'array', items: FieldSchema, description: '字段列表' },
    sqlExpression: { type: 'object', description: '脚本式SQL表达式解析结果' }
  },
  required: ['name', 'sql', 'fields'],
  description: 'SQL数据集定义，适用于jdbc和buildin数据源'
}

/**
 * BeanDataset Spring Bean数据集 Schema
 */
export const BeanDatasetSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '数据集名称' },
    method: { type: 'string', description: 'Bean方法名' },
    clazz: { type: 'string', description: '返回值类型，如java.util.Map' },
    fields: { type: 'array', items: FieldSchema, description: '字段列表' }
  },
  required: ['name', 'method', 'clazz'],
  description: 'Spring Bean数据集定义'
}

/**
 * Dataset 数据集 Schema（通用）
 */
export const DatasetSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '数据集名称，必填' },
    sql: { type: 'string', description: 'SQL语句（SQL数据集必填）' },
    parameters: { type: 'array', items: ParameterSchema, description: '查询参数' },
    fields: { type: 'array', items: FieldSchema, description: '字段列表，必填' }
  },
  required: ['name', 'fields'],
  description: '数据集定义对象，必须是JSON对象，禁止传JSON字符串'
}

/**
 * Datasource 数据源 Schema
 */
export const DatasourceSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '数据源名称，报表内唯一' },
    type: {
      type: 'string',
      enum: ['jdbc', 'spring', 'buildin'],
      description: '数据源类型'
    },
    datasets: { type: 'array', items: DatasetSchema, description: '数据集列表' },
    // jdbc 独有属性
    driver: { type: 'string', description: 'JDBC驱动类名（jdbc类型必填）' },
    url: { type: 'string', description: '数据库连接URL（jdbc类型必填）' },
    username: { type: 'string', description: '数据库用户名（jdbc类型必填）' },
    password: { type: 'string', description: '数据库密码（jdbc类型必填）' },
    // spring 独有属性
    beanId: { type: 'string', description: 'Spring Bean ID（spring类型必填）' }
  },
  required: ['name', 'type'],
  description: '数据源定义对象'
}

// ==================== 查询表单 Schema ====================

/**
 * Option 选项 Schema
 * 文档参考: form-design.md
 */
export const OptionSchema = {
  type: 'object',
  properties: {
    label: { type: 'string', description: '选项显示文本' },
    value: { type: 'string', description: '选项实际值' }
  },
  required: ['label', 'value'],
  description: '下拉选择/单选框组/多选框组的选项'
}

/**
 * RegList 正则校验规则 Schema
 */
export const RegListSchema = {
  type: 'object',
  properties: {
    pattern: { type: 'string', description: '正则表达式，如/^1[3-9]\\d{9}$/' },
    message: { type: 'string', description: '校验失败提示信息' }
  },
  required: ['pattern', 'message'],
  description: '正则校验规则'
}

/**
 * BaseInputComponent 输入组件公共属性 Schema
 * 文档参考: form-design.md
 */
export const BaseInputComponentSchema = {
  type: 'object',
  properties: {
    label: { type: 'string', description: '字段标签名，显示在表单中的名称' },
    tag: { type: 'string', description: '渲染标签，如u-input、u-select' },
    tagIcon: { type: 'string', description: '图标标识' },
    vModel: { type: 'string', description: '绑定字段名，必须与数据集Parameter的name一致' },
    span: { type: 'integer', minimum: 1, maximum: 24, description: '栅格占位，同一行内多个组件span之和应≤24' },
    labelWidth: { type: 'string', description: '标签宽度(px)' },
    style: { type: 'object', description: '自定义样式' },
    required: { type: 'boolean', description: '是否必填' },
    regList: { type: 'array', items: RegListSchema, description: '正则校验规则列表' },
    changeTag: { type: 'boolean', description: '是否可切换组件类型' },
    document: { type: 'string', description: '组件文档路径' },
    formId: { type: 'string', description: '表单组件ID' },
    renderKey: { type: 'string', description: '渲染唯一键' },
    layout: { type: 'string', const: 'colFormItem', description: '布局类型' },
    defaultValue: { description: '默认值，各组件类型不同' },
    disabled: { type: 'boolean', description: '是否禁用' },
    type: { type: 'string', description: '组件子类型' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout'],
  description: '输入组件公共属性基类'
}

/**
 * Input 单行文本 Schema
 * 文档参考: form-design.md
 */
export const InputSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'u-input' },
    tagIcon: { type: 'string', const: 'input' },
    placeholder: { type: 'string', description: '占位文本' },
    clearable: { type: 'boolean', description: '是否可清空' },
    readonly: { type: 'boolean', description: '是否只读' },
    maxlength: { type: 'string', description: '最大输入长度' },
    showWordLimit: { type: 'boolean', description: '是否显示字数统计' },
    prepend: { type: 'string', description: '前置内容' },
    append: { type: 'string', description: '后置内容' },
    prefixIcon: { type: 'string', description: '前缀图标' },
    suffixIcon: { type: 'string', description: '后缀图标' },
    defaultValue: { type: 'string', description: '默认值' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout'],
  description: '单行文本输入组件'
}

/**
 * InputNumber 计数器 Schema
 * 文档参考: form-design.md
 */
export const InputNumberSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'u-input-number' },
    tagIcon: { type: 'string', const: 'number' },
    stepStrictly: { type: 'boolean', description: '是否只能输入步长的倍数' },
    controlsPosition: { type: 'string', enum: ['', 'right'], description: '控制按钮位置' },
    defaultValue: { type: 'string', description: '默认值' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout'],
  description: '计数器组件'
}

/**
 * Select 下拉选择 Schema
 * 文档参考: form-design.md
 */
export const SelectSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'u-select' },
    tagIcon: { type: 'string', const: 'select' },
    multiple: { type: 'boolean', description: '是否多选' },
    clearable: { type: 'boolean', description: '是否可清空' },
    filterable: { type: 'boolean', description: '是否可搜索' },
    placeholder: { type: 'string', description: '占位文本' },
    options: { type: 'array', items: OptionSchema, description: '选项列表' },
    defaultValue: { type: 'string', description: '默认值' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout', 'options'],
  description: '下拉选择组件'
}

/**
 * RadioGroup 单选框组 Schema
 * 文档参考: form-design.md
 */
export const RadioGroupSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'u-radio-group' },
    tagIcon: { type: 'string', const: 'radio' },
    options: { type: 'array', items: OptionSchema, description: '选项列表' },
    optionType: { type: 'string', enum: ['default', 'button'], description: '单选框样式' },
    border: { type: 'boolean', description: '是否带边框' },
    size: { type: 'string', enum: ['medium', 'small', 'mini'], description: '尺寸' },
    defaultValue: { type: 'string', description: '默认值' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout', 'options'],
  description: '单选框组组件'
}

/**
 * CheckboxGroup 多选框组 Schema
 * 文档参考: form-design.md
 */
export const CheckboxGroupSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'u-checkbox-group' },
    tagIcon: { type: 'string', const: 'checkbox' },
    options: { type: 'array', items: OptionSchema, description: '选项列表' },
    optionType: { type: 'string', enum: ['default', 'button'], description: '多选框样式' },
    border: { type: 'boolean', description: '是否带边框' },
    size: { type: 'string', enum: ['medium', 'small', 'mini'], description: '尺寸' },
    defaultValue: { type: 'array', items: { type: 'string' }, description: '默认值（数组）' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout', 'options'],
  description: '多选框组组件'
}

/**
 * Switch 开关 Schema
 * 文档参考: form-design.md
 */
export const SwitchSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'u-switch' },
    tagIcon: { type: 'string', const: 'switch' },
    activeColor: { type: 'string', description: '打开时颜色' },
    inactiveColor: { type: 'string', description: '关闭时颜色' },
    activeValue: { type: 'boolean', description: '打开时的值', default: true },
    inactiveValue: { type: 'boolean', description: '关闭时的值', default: false },
    defaultValue: { type: 'boolean', description: '默认值' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout'],
  description: '开关组件'
}

/**
 * DatePicker 日期选择 Schema
 * 文档参考: form-design.md
 */
export const DatePickerSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'u-date-picker' },
    tagIcon: { type: 'string', const: 'date' },
    type: { type: 'string', enum: ['date', 'datetime', 'week', 'month', 'year', 'daterange'], description: '选择器类型' },
    format: { type: 'string', description: '显示格式，如YYYY-MM-DD' },
    valueFormat: { type: 'string', enum: ['format', 'timestamp'], description: '值格式' },
    placeholder: { type: 'string', description: '占位文本' },
    clearable: { type: 'boolean', description: '是否可清空' },
    readonly: { type: 'boolean', description: '是否只读' },
    defaultValue: { type: 'string', description: '默认值' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout', 'type'],
  description: '日期选择组件'
}

/**
 * Button 按钮 Schema
 * 文档参考: form-design.md
 */
export const ButtonSchema = {
  type: 'object',
  properties: {
    label: { type: 'string', description: '按钮文本' },
    type: { type: 'string', enum: ['primary', 'success', 'warning', 'danger', 'info', 'default'], description: '按钮类型' },
    size: { type: 'string', enum: ['medium', 'small', 'mini'], description: '尺寸' },
    icon: { type: 'string', description: '图标类名' },
    disabled: { type: 'boolean', description: '是否禁用' },
    tag: { type: 'string', const: 'u-button' },
    tagIcon: { type: 'string', const: 'button' },
    span: { type: 'integer', minimum: 1, maximum: 24, description: '栅格占位' },
    layout: { type: 'string', const: 'colFormItem', description: '布局类型' },
    changeTag: { type: 'boolean', description: '是否可切换类型' },
    defaultValue: { type: 'string', description: '默认值（按钮文本）' },
    vModel: { type: 'string', description: '绑定字段名（按钮一般不需要）' },
    formId: { type: 'string', description: '表单组件ID' },
    renderKey: { type: 'string', description: '渲染唯一键' },
    document: { type: 'string', description: '组件文档路径' }
  },
  required: ['label', 'tag', 'span', 'layout'],
  description: '按钮组件'
}

/**
 * FormComponent 表单组件 Schema（动态类型）
 */
export const FormComponentSchema = {
  oneOf: [
    InputSchema,
    InputNumberSchema,
    SelectSchema,
    RadioGroupSchema,
    CheckboxGroupSchema,
    SwitchSchema,
    DatePickerSchema,
    ButtonSchema
  ],
  description: '表单组件，可以是任意输入组件或按钮'
}

/**
 * RowComponent 行容器 Schema
 * 文档参考: form-design.md
 */
export const RowComponentSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'default', description: '行类型' },
    tag: { type: 'string', const: 'u-row', description: '渲染标签' },
    tagIcon: { type: 'string', const: 'row', description: '图标标识' },
    span: { type: 'integer', description: '行占位', default: 24 },
    gutter: { type: 'integer', description: '列间距(px)', default: 15 },
    justify: { type: 'string', enum: ['start', 'end', 'center', 'space-around', 'space-between'], description: '水平排列方式' },
    align: { type: 'string', enum: ['top', 'middle', 'bottom'], description: '垂直排列方式' },
    layout: { type: 'string', const: 'rowFormItem', description: '布局类型' },
    layoutTree: { type: 'boolean', const: true, description: '是否为树形布局容器' },
    componentName: { type: 'string', description: '组件名称（唯一）' },
    formId: { type: 'string', description: '表单组件ID' },
    renderKey: { type: 'string', description: '渲染唯一键' },
    document: { type: 'string', description: '组件文档路径' },
    children: { type: 'array', items: FormComponentSchema, description: '行内子组件列表' }
  },
  required: ['tag', 'layout', 'layoutTree', 'children'],
  description: '行容器组件，用于放置输入组件'
}

/**
 * SearchForm 查询表单 Schema
 * 文档参考: form-design.md
 */
export const SearchFormSchema = {
  type: 'object',
  properties: {
    formRef: { type: 'string', description: '表单ref标识', default: 'uForm' },
    tag: { type: 'string', const: 'u-form', description: '表单渲染标签' },
    formModel: { type: 'string', description: '表单数据对象名', default: 'formData' },
    size: { type: 'string', enum: ['small', 'medium', 'large'], description: '表单组件尺寸' },
    labelPosition: { type: 'string', enum: ['left', 'right', 'top'], description: '标签对齐方式' },
    labelWidth: { type: 'integer', description: '标签宽度(px)', default: 100 },
    formRules: { type: 'string', description: '校验规则对象名', default: 'rules' },
    gutter: { type: 'integer', description: '栅格间距(px)', default: 15 },
    disabled: { type: 'boolean', description: '是否禁用整表' },
    span: { type: 'integer', description: '默认栅格占位', default: 24 },
    formBtns: { type: 'boolean', description: '是否显示查询/重置按钮' },
    fields: { type: 'array', items: RowComponentSchema, description: '表单字段列表（树形结构）' }
  },
  required: ['tag', 'fields'],
  description: '查询表单配置对象'
}

// ==================== 页面配置 Schema ====================

/**
 * Paper 纸张配置 Schema
 * 文档参考: page-config.md
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
 * 文档参考: page-config.md
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

/**
 * Band 行类型枚举 Schema
 */
export const BandSchema = {
  type: 'string',
  enum: ['headerrepeat', 'footerrepeat', 'title', 'summary'],
  description: '行类型：headerrepeat(重复表头)、footerrepeat(重复表尾)、title(标题行)、summary(总结行)'
}

/**
 * RowDefinition 行定义 Schema
 * 文档参考: page-config.md, row.md
 */
export const RowDefinitionSchema = {
  type: 'object',
  properties: {
    rowNumber: { type: 'integer', minimum: 1, description: '行号，从1开始' },
    height: { type: 'integer', description: '行高(pt)' },
    band: { ...BandSchema, description: '行类型，null为普通行' }
  },
  required: ['rowNumber', 'height'],
  description: '行定义对象'
}

/**
 * RowHeader 行头对象 Schema
 * 文档参考: row.md
 */
export const RowHeaderSchema = {
  type: 'object',
  properties: {
    rowNumber: { type: 'integer', minimum: 0, description: '行号，从0开始的行索引' },
    height: { type: 'integer', description: '行高(px)' },
    band: { ...BandSchema, description: '行类型，null为普通行' }
  },
  required: ['rowNumber'],
  description: '行头对象，用于管理行类型配置'
}

/**
 * ColumnDefinition 列定义 Schema
 * 文档参考: page-config.md, col.md
 */
export const ColumnDefinitionSchema = {
  type: 'object',
  properties: {
    columnNumber: { type: 'integer', minimum: 1, description: '列号，从1开始' },
    width: { type: 'integer', description: '列宽(px)' },
    hide: { type: 'boolean', description: '是否隐藏列' }
  },
  required: ['columnNumber', 'width'],
  description: '列定义对象'
}

// ==================== 数据模板生成函数 ====================

/**
 * 生成简单文本单元格模板
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @returns 符合规范的单元格模板对象
 */
export function getSimpleCellTemplate(rowIndex: number, colIndex: number): object {
  const rowNumber = rowIndex + 1
  const colNumber = colIndex + 1
  // 列字母转换：1->A, 2->B, ...
  const colLetter = String.fromCharCode(65 + colIndex)

  return {
    rowNumber,
    columnNumber: colNumber,
    rowSpan: 0,
    colSpan: 0,
    name: `${colLetter}${rowNumber}`,
    value: {
      value: '',
      type: 'simple'
    },
    cellStyle: {
      bgcolor: null,
      forecolor: '0,0,0',
      fontSize: 10,
      fontFamily: '宋体',
      format: null,
      lineHeight: 0,
      align: 'center',
      valign: 'middle',
      bold: null,
      italic: null,
      underline: null,
      wrapCompute: null,
      leftBorder: null,
      rightBorder: null,
      topBorder: null,
      bottomBorder: null
    },
    linkUrl: null,
    linkTargetWindow: null,
    linkParameters: null,
    fillBlankRows: false,
    multiple: 0,
    expand: 'None',
    leftParentCellName: null,
    topParentCellName: null,
    conditionPropertyItems: null
  }
}

/**
 * 生成数据集单元格模板
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @param datasetName - 数据集名称
 * @param property - 字段名
 * @param aggregate - 聚合方式
 * @returns 符合规范的单元格模板对象
 */
export function getDatasetCellTemplate(
  rowIndex: number,
  colIndex: number,
  datasetName: string,
  property: string,
  aggregate: string = 'group'
): object {
  const baseCell = getSimpleCellTemplate(rowIndex, colIndex) as any
  baseCell.value = {
    expr: null,
    datasetName,
    aggregate,
    property,
    groupItems: null,
    mappingType: 'simple',
    mappingDataset: null,
    mappingKeyProperty: null,
    mappingValueProperty: null,
    mappingItems: null,
    conditions: null,
    order: 'none',
    value: `${datasetName}.${aggregate}(${property})`,
    type: 'dataset'
  }
  // 数据集单元格通常需要展开
  if (aggregate === 'group' || aggregate === 'select') {
    baseCell.expand = 'Down'
    baseCell.topParentCellName = 'root'
  }
  return baseCell
}

/**
 * 生成表达式单元格模板
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @param expression - 表达式内容
 * @returns 符合规范的单元格模板对象
 */
export function getExpressionCellTemplate(rowIndex: number, colIndex: number, expression: string = ''): object {
  const baseCell = getSimpleCellTemplate(rowIndex, colIndex) as any
  baseCell.value = {
    text: expression,
    expression: null,
    value: expression,
    type: 'expression'
  }
  return baseCell
}

/**
 * 生成图片单元格模板
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @param imagePath - 图片路径
 * @returns 符合规范的单元格模板对象
 */
export function getImageCellTemplate(rowIndex: number, colIndex: number, imagePath: string = ''): object {
  const baseCell = getSimpleCellTemplate(rowIndex, colIndex) as any
  baseCell.value = {
    path: imagePath,
    expr: null,
    expression: null,
    source: 'text',
    width: 100,
    height: 100,
    value: imagePath,
    type: 'image'
  }
  return baseCell
}

/**
 * 生成二维码单元格模板
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @param text - 二维码内容
 * @returns 符合规范的单元格模板对象
 */
export function getQrcodeCellTemplate(rowIndex: number, colIndex: number, text: string = ''): object {
  const baseCell = getSimpleCellTemplate(rowIndex, colIndex) as any
  baseCell.value = {
    width: 100,
    height: 100,
    source: 'text',
    text,
    expr: null,
    format: null,
    expression: null,
    category: 'qrcode',
    codeDisplay: false,
    value: text,
    type: 'zxing'
  }
  return baseCell
}

/**
 * 生成条码单元格模板
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @param text - 条码内容
 * @param format - 条码格式
 * @returns 符合规范的单元格模板对象
 */
export function getBarcodeCellTemplate(rowIndex: number, colIndex: number, text: string = '', format: string = 'AZTEC'): object {
  const baseCell = getSimpleCellTemplate(rowIndex, colIndex) as any
  baseCell.value = {
    width: 103,
    height: 40,
    source: 'text',
    text,
    expr: null,
    format,
    expression: null,
    category: 'barcode',
    codeDisplay: false,
    value: text,
    type: 'zxing'
  }
  return baseCell
}

/**
 * 根据值类型获取单元格模板
 * @param type - 值类型
 * @param rowIndex - 行索引
 * @param colIndex - 列索引
 * @param options - 可选参数（如datasetName、property等）
 * @returns 单元格模板对象
 */
export function getCellTemplateByType(
  type: string,
  rowIndex: number,
  colIndex: number,
  options?: {
    datasetName?: string;
    property?: string;
    aggregate?: string;
    expression?: string;
    imagePath?: string;
    qrcodeText?: string;
    barcodeText?: string;
    barcodeFormat?: string;
  }
): object {
  switch (type) {
    case 'simple':
      return getSimpleCellTemplate(rowIndex, colIndex)
    case 'dataset':
      return getDatasetCellTemplate(
        rowIndex,
        colIndex,
        options?.datasetName || 'dataset_name',
        options?.property || 'field_name',
        options?.aggregate || 'group'
      )
    case 'expression':
      return getExpressionCellTemplate(rowIndex, colIndex, options?.expression || '')
    case 'image':
      return getImageCellTemplate(rowIndex, colIndex, options?.imagePath || '')
    case 'qrcode':
      return getQrcodeCellTemplate(rowIndex, colIndex, options?.qrcodeText || '')
    case 'barcode':
      return getBarcodeCellTemplate(rowIndex, colIndex, options?.barcodeText || '', options?.barcodeFormat || 'AZTEC')
    default:
      return getSimpleCellTemplate(rowIndex, colIndex)
  }
}

/**
 * 生成 SQL 数据集模板
 * @param name - 数据集名称
 * @param sql - SQL语句
 * @returns 符合规范的数据集模板对象
 */
export function getSqlDatasetTemplate(name: string = 'dataset_name', sql: string = ''): object {
  return {
    name,
    sql,
    parameters: [],
    fields: [],
    sqlExpression: null
  }
}

/**
 * 生成 buildin 数据源模板
 * @param name - 数据源名称
 * @returns 符合规范的数据源模板对象
 */
export function getBuildinDatasourceTemplate(name: string = 'datasource_name'): object {
  return {
    name,
    type: 'buildin',
    datasets: []
  }
}

// ==================== 数据校验函数 ====================

/**
 * 校验单元格数据是否符合规范
 * @param cell - 单元格对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateCell(cell: any): string | undefined {
  if (!cell || typeof cell !== 'object') {
    return 'cell 必须是对象类型'
  }

  // 必填字段检查
  if (typeof cell.rowNumber !== 'number' || cell.rowNumber < 1) {
    return 'rowNumber 必须是大于0的整数'
  }
  if (typeof cell.columnNumber !== 'number' || cell.columnNumber < 1) {
    return 'columnNumber 必须是大于0的整数'
  }

  // value 校验
  if (!cell.value || typeof cell.value !== 'object') {
    return 'value 必须是对象且包含 type 字段'
  }
  const validTypes = ['simple', 'expression', 'dataset', 'image', 'chart', 'slash', 'zxing']
  if (!validTypes.includes(cell.value.type)) {
    return `value.type 必须是 ${validTypes.join('/')} 之一，当前为 ${cell.value.type}`
  }

  // expand 校验
  if (cell.expand && !['None', 'Down', 'Right'].includes(cell.expand)) {
    return `expand 必须是 None/Down/Right 之一，当前为 ${cell.expand}`
  }

  // cellStyle 校验
  if (cell.cellStyle) {
    const style = cell.cellStyle
    if (style.align && !['left', 'center', 'right'].includes(style.align)) {
      return `cellStyle.align 必须是 left/center/right 之一，当前为 ${style.align}`
    }
    if (style.valign && !['top', 'middle', 'bottom'].includes(style.valign)) {
      return `cellStyle.valign 必须是 top/middle/bottom 之一，当前为 ${style.valign}`
    }
    // 颜色格式校验
    if (style.bgcolor && typeof style.bgcolor === 'string' && !/^[0-9]+,[0-9]+,[0-9]+$/.test(style.bgcolor)) {
      return `cellStyle.bgcolor 格式错误，应为 RGB 格式如 "255,0,0"，当前为 ${style.bgcolor}`
    }
    if (style.forecolor && typeof style.forecolor === 'string' && !/^[0-9]+,[0-9]+,[0-9]+$/.test(style.forecolor)) {
      return `cellStyle.forecolor 格式错误，应为 RGB 格式如 "0,0,0"，当前为 ${style.forecolor}`
    }
  }

  // dataset 类型值校验
  if (cell.value.type === 'dataset') {
    if (!cell.value.datasetName) {
      return 'dataset 类型单元格必须包含 datasetName'
    }
    if (!cell.value.aggregate) {
      return 'dataset 类型单元格必须包含 aggregate'
    }
    if (!cell.value.property) {
      return 'dataset 类型单元格必须包含 property'
    }
    const validAggregates = ['group', 'select', 'sum', 'count', 'max', 'min', 'avg', 'customgroup']
    if (!validAggregates.includes(cell.value.aggregate)) {
      return `value.aggregate 必须是 ${validAggregates.join('/')} 之一`
    }
  }

  return undefined
}

/**
 * 校验批量单元格数据是否符合规范
 * 遍历 cells 对象的每个 value，调用 validateCell 进行校验
 *
 * @param cells - 批量单元格数据对象，key为 "row,col" 格式，value为单元格定义对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateCells(cells: any): string | undefined {
  if (!cells || typeof cells !== 'object') {
    return 'cells 必须是对象类型'
  }

  const keys = Object.keys(cells)
  if (keys.length === 0) {
    return 'cells 不能为空对象'
  }

  for (const key of keys) {
    // 校验 key 格式
    if (!/^[0-9]+,[0-9]+$/.test(key)) {
      return `cells 的 key 格式错误，应为 "row,col"（从1开始），当前为 "${key}"`
    }
    // 校验每个单元格
    const cellError = validateCell(cells[key])
    if (cellError) {
      return `单元格 ${key} 校验失败: ${cellError}`
    }
  }

  return undefined
}

/**
 * 校验数据集数据是否符合规范
 * @param dataset - 数据集对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateDataset(dataset: any): string | undefined {
  if (!dataset || typeof dataset !== 'object') {
    return 'dataset 必须是对象类型（禁止传JSON字符串）'
  }

  // 必填字段检查
  if (!dataset.name || typeof dataset.name !== 'string') {
    return 'dataset.name 必须是非空字符串'
  }

  if (!Array.isArray(dataset.fields)) {
    return 'dataset.fields 必须是数组'
  }

  // SQL 数据集必须有 sql
  if (!dataset.sql || typeof dataset.sql !== 'string') {
    return 'dataset.sql 必须是非空字符串'
  }

  // parameters 校验
  if (dataset.parameters) {
    if (!Array.isArray(dataset.parameters)) {
      return 'dataset.parameters 必须是数组'
    }
    const validParamTypes = ['String', 'Integer', 'Float', 'Boolean', 'Date', 'List']
    for (const param of dataset.parameters) {
      if (!param.name) {
        return 'dataset.parameters 中每个参数必须包含 name'
      }
      if (!param.type || !validParamTypes.includes(param.type)) {
        return `dataset.parameters[${param.name}].type 必须是 ${validParamTypes.join('/')} 之一`
      }
    }
  }

  return undefined
}

/**
 * 校验数据源数据是否符合规范
 * @param datasource - 数据源对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateDatasource(datasource: any): string | undefined {
  if (!datasource || typeof datasource !== 'object') {
    return 'datasource 必须是对象类型'
  }

  if (!datasource.name || typeof datasource.name !== 'string') {
    return 'datasource.name 必须是非空字符串'
  }

  const validTypes = ['jdbc', 'spring', 'buildin']
  if (!datasource.type || !validTypes.includes(datasource.type)) {
    return `datasource.type 必须是 ${validTypes.join('/')} 之一`
  }

  // jdbc 类型必填字段
  if (datasource.type === 'jdbc') {
    if (!datasource.driver) return 'jdbc 类型数据源必须包含 driver'
    if (!datasource.url) return 'jdbc 类型数据源必须包含 url'
    if (!datasource.username) return 'jdbc 类型数据源必须包含 username'
    if (!datasource.password) return 'jdbc 类型数据源必须包含 password'
  }

  // spring 类型必填字段
  if (datasource.type === 'spring') {
    if (!datasource.beanId) return 'spring 类型数据源必须包含 beanId'
  }

  return undefined
}

/**
 * 校验查询表单数据是否符合规范
 * @param searchForm - 查询表单对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateSearchForm(searchForm: any): string | undefined {
  if (!searchForm || typeof searchForm !== 'object') {
    return 'searchForm 必须是对象类型'
  }

  // tag 必须是 u-form
  if (searchForm.tag !== 'u-form') {
    return 'searchForm.tag 必须是 "u-form"'
  }

  // fields 必须是数组
  if (!Array.isArray(searchForm.fields)) {
    return 'searchForm.fields 必须是数组'
  }

  // 校验每个 field（RowComponent）
  for (let i = 0; i < searchForm.fields.length; i++) {
    const row = searchForm.fields[i]
    const rowError = validateRowComponent(row, i)
    if (rowError) return rowError
  }

  return undefined
}

/**
 * 校验行容器组件
 * @param row - 行容器对象
 * @param index - 行索引
 * @returns 错误信息，undefined 表示校验通过
 */
function validateRowComponent(row: any, index: number): string | undefined {
  if (!row || typeof row !== 'object') {
    return `searchForm.fields[${index}] 必须是对象类型`
  }

  // tag 必须是 u-row
  if (row.tag !== 'u-row') {
    return `searchForm.fields[${index}].tag 必须是 "u-row"`
  }

  // layout 必须是 rowFormItem
  if (row.layout !== 'rowFormItem') {
    return `searchForm.fields[${index}].layout 必须是 "rowFormItem"`
  }

  // children 必须是数组
  if (!Array.isArray(row.children)) {
    return `searchForm.fields[${index}].children 必须是数组`
  }

  // 校验每个子组件
  for (let j = 0; j < row.children.length; j++) {
    const child = row.children[j]
    const childError = validateFormComponent(child, index, j)
    if (childError) return childError
  }

  return undefined
}

/**
 * 校验表单组件
 * @param component - 表单组件对象
 * @param rowIndex - 行索引
 * @param childIndex - 子组件索引
 * @returns 错误信息，undefined 表示校验通过
 */
function validateFormComponent(component: any, rowIndex: number, childIndex: number): string | undefined {
  if (!component || typeof component !== 'object') {
    return `searchForm.fields[${rowIndex}].children[${childIndex}] 必须是对象类型`
  }

  const validTags = ['u-input', 'u-input-number', 'u-select', 'u-radio-group', 'u-checkbox-group', 'u-switch', 'u-date-picker', 'u-button']
  if (!validTags.includes(component.tag)) {
    return `searchForm.fields[${rowIndex}].children[${childIndex}].tag 必须是 ${validTags.join('/')} 之一`
  }

  // layout 必须是 colFormItem
  if (component.layout !== 'colFormItem') {
    return `searchForm.fields[${rowIndex}].children[${childIndex}].layout 必须是 "colFormItem"`
  }

  // span 校验
  if (typeof component.span !== 'number' || component.span < 1 || component.span > 24) {
    return `searchForm.fields[${rowIndex}].children[${childIndex}].span 必须是 1-24 之间的整数`
  }

  // 非按钮组件必须有 vModel
  if (component.tag !== 'u-button') {
    if (!component.vModel || typeof component.vModel !== 'string') {
      return `searchForm.fields[${rowIndex}].children[${childIndex}].vModel 必须是非空字符串`
    }
  }

  // Select/RadioGroup/CheckboxGroup 必须有 options
  if (['u-select', 'u-radio-group', 'u-checkbox-group'].includes(component.tag)) {
    if (!Array.isArray(component.options)) {
      return `searchForm.fields[${rowIndex}].children[${childIndex}].options 必须是数组`
    }
    for (let k = 0; k < component.options.length; k++) {
      const opt = component.options[k]
      if (!opt.label || !opt.value) {
        return `searchForm.fields[${rowIndex}].children[${childIndex}].options[${k}] 必须包含 label 和 value`
      }
    }
  }

  // DatePicker 必须有 type
  if (component.tag === 'u-date-picker') {
    const validDateTypes = ['date', 'datetime', 'week', 'month', 'year', 'daterange']
    if (!validDateTypes.includes(component.type)) {
      return `searchForm.fields[${rowIndex}].children[${childIndex}].type 必须是 ${validDateTypes.join('/')} 之一`
    }
  }

  // 补全布尔属性默认值，防止后端解析时 NPE（Java 基本类型 boolean 无法接收 null）
  // 公共布尔属性（所有表单组件）
  if (component.disabled === undefined || component.disabled === null) {
    component.disabled = false
  }
  if (component.required === undefined || component.required === null) {
    component.required = false
  }
  if (component.changeTag === undefined || component.changeTag === null) {
    component.changeTag = false
  }

  // u-input 特有布尔属性
  if (component.tag === 'u-input') {
    if (component.clearable === undefined || component.clearable === null) {
      component.clearable = false
    }
    if (component.readonly === undefined || component.readonly === null) {
      component.readonly = false
    }
    if (component.showWordLimit === undefined || component.showWordLimit === null) {
      component.showWordLimit = false
    }
  }

  // u-input-number 特有布尔属性
  if (component.tag === 'u-input-number') {
    if (component.stepStrictly === undefined || component.stepStrictly === null) {
      component.stepStrictly = false
    }
  }

  // u-select 特有布尔属性
  if (component.tag === 'u-select') {
    if (component.clearable === undefined || component.clearable === null) {
      component.clearable = false
    }
    if (component.multiple === undefined || component.multiple === null) {
      component.multiple = false
    }
    if (component.filterable === undefined || component.filterable === null) {
      component.filterable = false
    }
  }

  // u-date-picker 特有布尔属性
  if (component.tag === 'u-date-picker') {
    if (component.clearable === undefined || component.clearable === null) {
      component.clearable = false
    }
  }

  return undefined
}

/**
 * 校验页面配置数据是否符合规范
 * @param paper - 页面配置对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validatePaper(paper: any): string | undefined {
  if (!paper || typeof paper !== 'object') {
    return 'paper 必须是对象类型'
  }

  // paperType 校验
  const validPaperTypes = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10',
                           'B0', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'CUSTOM']
  if (paper.paperType && !validPaperTypes.includes(paper.paperType)) {
    return `paper.paperType 必须是 ${validPaperTypes.join('/')} 之一`
  }

  // pagingMode 校验
  if (paper.pagingMode && !['fitpage', 'fixrows'].includes(paper.pagingMode)) {
    return 'paper.pagingMode 必须是 fitpage/fixrows 之一'
  }

  // orientation 校验
  if (paper.orientation && !['portrait', 'landscape'].includes(paper.orientation)) {
    return 'paper.orientation 必须是 portrait/landscape 之一'
  }

  // fixRows 校验（pagingMode 为 fixrows 时）
  if (paper.pagingMode === 'fixrows') {
    if (typeof paper.fixRows !== 'number' || paper.fixRows < 1) {
      return 'paper.fixRows 必须是大于0的整数（当 pagingMode 为 fixrows 时）'
    }
  }

  // columnCount 校验（columnEnabled 为 true 时）
  if (paper.columnEnabled === true) {
    if (typeof paper.columnCount !== 'number' || paper.columnCount < 2 || paper.columnCount > 10) {
      return 'paper.columnCount 必须是 2-10 之间的整数（当 columnEnabled 为 true 时）'
    }
  }

  // 边距校验
  const margins = ['leftMargin', 'rightMargin', 'topMargin', 'bottomMargin']
  for (const margin of margins) {
    if (paper[margin] !== undefined && typeof paper[margin] !== 'number') {
      return `paper.${margin} 必须是数字类型`
    }
  }

  return undefined
}

/**
 * 校验行定义数据是否符合规范
 * @param row - 行定义对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateRowDefinition(row: any): string | undefined {
  if (!row || typeof row !== 'object') {
    return 'row 必须是对象类型'
  }

  // rowNumber 校验（从1开始）
  if (typeof row.rowNumber !== 'number' || row.rowNumber < 1) {
    return 'row.rowNumber 必须是大于0的整数'
  }

  // height 校验
  if (row.height !== undefined && typeof row.height !== 'number') {
    return 'row.height 必须是数字类型'
  }

  // band 校验
  const validBands = ['headerrepeat', 'footerrepeat', 'title', 'summary']
  if (row.band && !validBands.includes(row.band)) {
    return `row.band 必须是 ${validBands.join('/')} 之一或为 null`
  }

  return undefined
}

/**
 * 校验行头对象是否符合规范
 * @param rowHeader - 行头对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateRowHeader(rowHeader: any): string | undefined {
  if (!rowHeader || typeof rowHeader !== 'object') {
    return 'rowHeader 必须是对象类型'
  }

  // rowNumber 校验（从0开始）
  if (typeof rowHeader.rowNumber !== 'number' || rowHeader.rowNumber < 0) {
    return 'rowHeader.rowNumber 必须是非负整数'
  }

  // height 校验
  if (rowHeader.height !== undefined && typeof rowHeader.height !== 'number') {
    return 'rowHeader.height 必须是数字类型'
  }

  // band 校验
  const validBands = ['headerrepeat', 'footerrepeat', 'title', 'summary']
  if (rowHeader.band && !validBands.includes(rowHeader.band)) {
    return `rowHeader.band 必须是 ${validBands.join('/')} 之一或为 null`
  }

  return undefined
}

/**
 * 校验列定义数据是否符合规范
 * @param column - 列定义对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateColumnDefinition(column: any): string | undefined {
  if (!column || typeof column !== 'object') {
    return 'column 必须是对象类型'
  }

  // columnNumber 校验（从1开始）
  if (typeof column.columnNumber !== 'number' || column.columnNumber < 1) {
    return 'column.columnNumber 必须是大于0的整数'
  }

  // width 校验
  if (column.width !== undefined && typeof column.width !== 'number') {
    return 'column.width 必须是数字类型'
  }

  // hide 校验
  if (column.hide !== undefined && typeof column.hide !== 'boolean') {
    return 'column.hide 必须是布尔类型'
  }

  return undefined
}
