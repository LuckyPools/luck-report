/**
 * 设计器相关 API
 *
 * 调用方：designer 视图及其子组件（数据源面板、单元格编辑器、工具栏等）
 */
import request from "@/utils/request";

/**
 * 加载报表定义文件
 * @param formData 上传的报表文件表单数据
 * @returns 后端返回的报表定义内容
 */
export async function loadReport(formData: FormData): Promise<any> {
  return await request.post('/designer/loadReport', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 测试数据源连接
 * @param formData 数据源连接参数
 * @returns 后端返回的连接测试结果
 */
export async function testConnection(formData: FormData): Promise<any> {
  return await request.post('/datasource/testConnection', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 预览数据源数据
 * @param parameters 预览参数对象（值为对象时会被 JSON 序列化）
 * @returns 后端返回的数据预览结果
 */
export async function previewData(parameters: Record<string, any>): Promise<any> {
  const formData = new URLSearchParams();
  for (const key in parameters) {
    const value = parameters[key];
    if (typeof value === 'object' && value !== null) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  }

  return await request.post('/datasource/previewData', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 加载系统内置数据源列表
 * @returns 后端返回的内置数据源数组
 */
export async function loadBuildinDatasources(): Promise<any> {
  return await request.get('/datasource/loadBuildinDatasources');
}

/**
 * 构建数据源字段
 * @param parameters 构建字段所需参数
 * @returns 后端返回的字段定义列表
 */
export async function buildFields(parameters: Record<string, any>): Promise<any> {
  const formData = new FormData();
  for (const key in parameters) {
    formData.append(key, parameters[key]);
  }

  return await request.post('/datasource/buildFields', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 脚本校验
 * @param content 脚本内容
 * @returns 校验结果
 */
export async function scriptValidation(content: string): Promise<any> {
  const formData = new FormData();
  formData.append('content', content);

  return await request.post('/designer/scriptValidation', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 条件脚本校验
 * @param content 条件脚本内容
 * @returns 校验结果
 */
export async function conditionScriptValidation(content: string): Promise<any> {
  const formData = new FormData();
  formData.append('content', content);

  return await request.post('/designer/conditionScriptValidation', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 构建数据库表列表
 * @param parameters 数据库连接参数
 * @returns 表列表
 */
export async function buildDatabaseTables(parameters: Record<string, any>): Promise<any> {
  const formData = new FormData();
  for (const key in parameters) {
    formData.append(key, parameters[key]);
  }

  return await request.post('/datasource/buildDatabaseTables', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 构建 JDBC 数据源字段
 * @param parameters JDBC 连接与查询参数
 * @returns 字段定义列表
 */
export async function buildJdbcFields(parameters: Record<string, any>): Promise<any> {
  const formData = new FormData();
  for (const key in parameters) {
    formData.append(key, parameters[key]);
  }
  return await request.post('/datasource/buildFields', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 加载 Spring Bean 的方法列表
 * @param beanId Spring Bean 名称
 * @returns 方法列表
 */
export async function loadMethods(beanId: string): Promise<any> {
  return await request.get('/datasource/loadMethods', {
    params: { beanId }
  });
}

/**
 * 根据类名构建字段
 * @param clazz 完整的类名
 * @returns 类的字段定义
 */
export async function buildClass(clazz: string): Promise<any> {
  return await request.get('/datasource/buildClass', {
    params: { clazz }
  });
}

/**
 * 解析表达式中的数据集名称
 * @param expr 待解析的表达式
 * @returns 解析出的数据集名称
 */
export async function parseDatasetName(expr: string): Promise<any> {
  const formData = new FormData();
  formData.append('expr', expr);
  return await request.post('/designer/parseDatasetName', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 保存报表定义文件
 * @param file 文件对象
 * @param content 文件内容
 * @returns 保存结果
 */
export async function saveReportFile(file: File, content: string): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('content', content);
  return await request.post('/designer/saveReportFile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 删除报表定义文件
 * @param file 文件名
 * @returns 删除结果
 */
export async function deleteReportFile(file: string): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  return await request.post('/designer/deleteReportFile', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 保存预览文件
 * @param fileName 预览文件名
 * @param content 文件内容
 * @returns 保存结果
 */
export async function savePreviewFile(fileName: string, content: string): Promise<any> {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('fileName', fileName);
  return await request.post('/designer/savePreviewFile', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 加载报表提供者（报表目录树）
 * @returns 报表提供者列表
 */
export async function loadReportProviders(): Promise<any> {
  return await request.get('/designer/loadReportProviders');
}

/**
 * 加载指定路径下的报表提供者
 * @param path 报表目录路径
 * @returns 指定路径下的报表提供者列表
 */
export async function loadReportProvidersByPath(path: string): Promise<any> {
  return await request.get('/designer/loadReportProviders', {
    params: { path }
  });
}

/**
 * 导入 Excel 文件
 * @param file Excel 文件对象
 * @returns 导入结果
 */
export async function importExcelFile(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('_excel_file', file);

  return await request.post('/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}
