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
    fields: { type: 'array', items: FieldSchema, description: '字段列表' }
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
    fields: []
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

/** 数据集名称合法字符：英文/数字/下划线，且以英文开头 */
const DATASET_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/

/**
 * 规范化数据集对象，补齐必填字段默认值并剥离非法字段
 * 作用：让 LLM 传"残缺"数据时也能写出符合规范的数据集，避免 add_dataset 写入时因字段缺失失败
 *
 * @param dataset - 原始数据集对象（可能来自 LLM）
 * @returns 符合规范的数据集对象；非法输入兜底返回空 SQL 模板
 */
export function normalizeDataset(dataset: any): Record<string, any> {
  // 防御：非对象 / 数组输入 → 兜底为空 SQL 模板
  if (!dataset || typeof dataset !== 'object' || Array.isArray(dataset)) {
    return { ...getSqlDatasetTemplate() }
  }

  // name 兜底：去前后空格，空则用占位名
  const name = typeof dataset.name === 'string' && dataset.name.trim() !== ''
    ? dataset.name.trim()
    : 'dataset_name'

  // sql 兜底：必须是非空字符串，否则用空串（validateDataset 会拦截空 SQL）
  const sql = typeof dataset.sql === 'string' ? dataset.sql : ''

  // parameters 兜底为数组；逐项补齐 name/type/defaultValue
  const validParamTypes = ['String', 'Integer', 'Float', 'Boolean', 'Date', 'List']
  const parameters: any[] = Array.isArray(dataset.parameters)
    ? dataset.parameters
        .filter((p: any) => p && typeof p === 'object')
        .map((p: any) => ({
          name: typeof p.name === 'string' && p.name.trim() !== '' ? p.name.trim() : 'param_name',
          type: validParamTypes.includes(p.type) ? p.type : 'String',
          defaultValue: typeof p.defaultValue === 'string' ? p.defaultValue : ''
        }))
    : []

  // fields 兜底为数组；只保留 { name } 形态
  const fields: any[] = Array.isArray(dataset.fields)
    ? dataset.fields
        .filter((f: any) => f && typeof f === 'object' && typeof f.name === 'string' && f.name.trim() !== '')
        .map((f: any) => ({ name: f.name.trim() }))
    : []


  return { name, sql, parameters, fields }
}

/**
 * 规范化数据源对象，按 type 补齐必填字段默认值并剥离非法字段
 * 作用：让 LLM 传"残缺"数据时也能写出符合规范的数据源
 *
 * @param datasource - 原始数据源对象（可能来自 LLM）
 * @returns 符合规范的数据源对象；非法输入兜底返回 buildin 模板
 */
export function normalizeDatasource(datasource: any): Record<string, any> {
  // 防御：非对象 / 数组输入 → 兜底为 buildin 模板
  if (!datasource || typeof datasource !== 'object' || Array.isArray(datasource)) {
    return { ...getBuildinDatasourceTemplate() }
  }

  const name = typeof datasource.name === 'string' && datasource.name.trim() !== ''
    ? datasource.name.trim()
    : 'datasource_name'
  const datasets = Array.isArray(datasource.datasets) ? datasource.datasets : []

  if (datasource.type === 'buildin') {
    return {
      name,
      type: 'buildin',
      datasets
    }
  }
  if (datasource.type === 'jdbc') {
    return {
      name,
      type: 'jdbc',
      driver: typeof datasource.driver === 'string' ? datasource.driver : '',
      url: typeof datasource.url === 'string' ? datasource.url : '',
      username: typeof datasource.username === 'string' ? datasource.username : '',
      password: typeof datasource.password === 'string' ? datasource.password : '',
      datasets
    }
  }
  if (datasource.type === 'spring') {
    return {
      name,
      type: 'spring',
      beanId: typeof datasource.beanId === 'string' ? datasource.beanId : '',
      datasets
    }
  }
  // 未知 type：保留原样由 validate 拦截
  return { ...datasource, name, datasets }
}

/** 数据源名称合法字符：英文/数字/下划线，且以英文开头 */
const DATASOURCE_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/

/**
 * 校验数据源对象，收集所有错误并按字段分组返回详细提示
 * 校验维度：name 格式、type 合法、字段互斥、必填字段、datasets 形态
 *
 * @param datasource - 数据源对象
 * @returns 错误信息（多条用换行分隔），undefined 表示通过
 */
export function validateDatasource(datasource: any): string | undefined {
  if (!datasource || typeof datasource !== 'object' || Array.isArray(datasource)) {
    return 'datasource 必须是对象类型（禁止传 JSON 字符串或数组）。请按数据源 Schema 传入完整对象，建议先调用 get_datasource_template 取得模板再修改字段'
  }
  const errors: string[] = []

  // name 校验
  const name = datasource.name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('datasource.name 必须是非空字符串')
  } else if (!DATASOURCE_NAME_PATTERN.test(name)) {
    errors.push(`datasource.name "${name}" 格式不合法，只能包含英文/数字/下划线，且以英文开头。请使用 load_buildin_datasources 返回列表中的名称（buildin 类型）或自定义合法名称（jdbc/spring 类型）`)
  }

  // type 校验：Agent 仅支持 buildin；jdbc/spring 走提示用户手动添加路径
  const validTypes = ['jdbc', 'spring', 'buildin']
  if (!datasource.type || !validTypes.includes(datasource.type)) {
    errors.push(
      `datasource.type 必须是 ${validTypes.join('/')} 之一，当前为 ${datasource.type ?? 'undefined'}。` +
      `注意：Agent 仅支持创建 buildin 类型数据源；jdbc/spring 类型数据源需在报表设计器中手动添加`
    )
    // type 非法时不再继续校验子字段，避免无效信息淹没
    return errors.join('\n')
  }

  // type 字段互斥校验：buildin 不应携带 jdbc/spring 字段
  if (datasource.type === 'buildin') {
    const forbidden = ['driver', 'url', 'username', 'password', 'beanId']
    for (const k of forbidden) {
      if (datasource[k] !== undefined && datasource[k] !== null && datasource[k] !== '') {
        errors.push(`buildin 类型数据源不应包含 ${k} 字段（该字段仅 jdbc/spring 类型使用）。请删除 ${k} 字段后重试`)
      }
    }
  }
  // jdbc 必填 + 互斥
  if (datasource.type === 'jdbc') {
    if (!datasource.driver) errors.push('jdbc 类型数据源必须包含 driver（JDBC 驱动类名，如 com.mysql.cj.jdbc.Driver）')
    if (!datasource.url) errors.push('jdbc 类型数据源必须包含 url（数据库连接 URL，如 jdbc:mysql://host:3306/db）')
    if (!datasource.username) errors.push('jdbc 类型数据源必须包含 username（数据库用户名）')
    if (!datasource.password) errors.push('jdbc 类型数据源必须包含 password（数据库密码）')
    if (datasource.beanId) errors.push('jdbc 类型数据源不应包含 beanId 字段（该字段仅 spring 类型使用）。请删除 beanId 字段后重试')
  }
  // spring 必填 + 互斥
  if (datasource.type === 'spring') {
    if (!datasource.beanId) errors.push('spring 类型数据源必须包含 beanId（Spring Bean ID）')
    const forbidden = ['driver', 'url', 'username', 'password']
    for (const k of forbidden) {
      if (datasource[k] !== undefined && datasource[k] !== null && datasource[k] !== '') {
        errors.push(`spring 类型数据源不应包含 ${k} 字段（该字段仅 jdbc 类型使用）。请删除 ${k} 字段后重试`)
      }
    }
  }

  // datasets 形态校验
  if (datasource.datasets !== undefined && !Array.isArray(datasource.datasets)) {
    errors.push('datasource.datasets 必须是数组（如不需要数据集可传 [] 或省略）')
  }

  return errors.length ? errors.join('\n') : undefined
}
