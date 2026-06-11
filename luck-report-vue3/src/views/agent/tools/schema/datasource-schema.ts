/**
 * 数据源/数据集数据模型 JSON Schema 定义
 */

/** Parameter 查询参数 Schema */
export const ParameterSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '参数名称，需与查询表单vModel一致，只允许英文+字符串的组合' },
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

/** Field 字段 Schema */
export const FieldSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '字段名称，如order_id、price' }
  },
  required: ['name'],
  description: '数据集字段定义'
}

/** SqlDataset SQL数据集 Schema */
export const SqlDatasetSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '数据集名称，数据源内唯一，只允许英文+字符串的组合'},
    sql: { type: 'string', description: 'SQL查询语句，支持参数占位符:paramName和表达式SQL，表达式SQL用 `${...}` 包裹，用于与普通SQL区分。' },
    parameters: { type: 'array', items: ParameterSchema, description: '查询参数列表' },
    fields: { type: 'array', items: FieldSchema, description: '字段列表' },
    sqlExpression: { type: 'object', description: '脚本式SQL表达式解析结果' }
  },
  required: ['name', 'sql', 'fields'],
  description: 'SQL数据集定义，适用于jdbc和buildin数据源'
}

/** BeanDataset Spring Bean数据集 Schema */
export const BeanDatasetSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '数据集名称，只允许英文+字符串的组合' },
    method: { type: 'string', description: 'Bean方法名' },
    clazz: { type: 'string', description: '返回值类型，如java.util.Map' },
    fields: { type: 'array', items: FieldSchema, description: '字段列表' }
  },
  required: ['name', 'method', 'clazz'],
  description: 'Spring Bean数据集定义'
}

/** Dataset 数据集 Schema（通用） */
export const DatasetSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '数据集名称，只允许英文+字符串的组合' },
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

// ==================== 数据模板生成函数 ====================

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
 *
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
 * 校验数据集数据，收集所有错误一次性返回
 *
 * @param dataset - 数据集对象
 * @returns 错误信息，undefined 表示通过
 */
export function validateDataset(dataset: any): string | undefined {
  if (!dataset || typeof dataset !== 'object') {
    return 'dataset 必须是对象类型（禁止传JSON字符串）'
  }
  const errors: string[] = []

  // 必填字段检查
  if (!dataset.name || typeof dataset.name !== 'string') {
    errors.push('dataset.name 必须是非空字符串')
  }

  if (!Array.isArray(dataset.fields)) {
    errors.push('dataset.fields 必须是数组')
  }

  // SQL 数据集必须有 sql
  if (!dataset.sql || typeof dataset.sql !== 'string') {
    errors.push('dataset.sql 必须是非空字符串')
  }

  // parameters 校验
  if (dataset.parameters !== undefined) {
    if (!Array.isArray(dataset.parameters)) {
      errors.push('dataset.parameters 必须是数组')
    } else {
      // 遍历每个参数，收集所有参数的错误而不是只取第一个
      const validParamTypes = ['String', 'Integer', 'Float', 'Boolean', 'Date', 'List']
      for (let i = 0; i < dataset.parameters.length; i++) {
        const param = dataset.parameters[i]
        const paramErrors: string[] = []
        if (!param || !param.name) {
          paramErrors.push('必须包含 name')
        }
        if (!param || !param.type || !validParamTypes.includes(param.type)) {
          paramErrors.push(`type 必须是 ${validParamTypes.join('/')} 之一，当前为 ${param?.type}`)
        }
        if (paramErrors.length) {
          errors.push(`parameters[${param?.name ?? i}]: ${paramErrors.join('; ')}`)
        }
      }
    }
  }

  return errors.length ? errors.join('\n') : undefined
}

/**
 * 校验数据源数据，收集所有错误一次性返回
 *
 * @param datasource - 数据源对象
 * @returns 错误信息，undefined 表示通过
 */
export function validateDatasource(datasource: any): string | undefined {
  if (!datasource || typeof datasource !== 'object') {
    return 'datasource 必须是对象类型'
  }
  const errors: string[] = []

  if (!datasource.name || typeof datasource.name !== 'string') {
    errors.push('datasource.name 必须是非空字符串')
  }

  const validTypes = ['jdbc', 'spring', 'buildin']
  if (!datasource.type || !validTypes.includes(datasource.type)) {
    errors.push(`datasource.type 必须是 ${validTypes.join('/')} 之一，当前为 ${datasource.type}`)
  }

  // jdbc 类型必填字段
  if (datasource.type === 'jdbc') {
    if (!datasource.driver) errors.push('jdbc 类型数据源必须包含 driver')
    if (!datasource.url) errors.push('jdbc 类型数据源必须包含 url')
    if (!datasource.username) errors.push('jdbc 类型数据源必须包含 username')
    if (!datasource.password) errors.push('jdbc 类型数据源必须包含 password')
  }

  // spring 类型必填字段
  if (datasource.type === 'spring') {
    if (!datasource.beanId) errors.push('spring 类型数据源必须包含 beanId')
  }

  return errors.length ? errors.join('\n') : undefined
}
