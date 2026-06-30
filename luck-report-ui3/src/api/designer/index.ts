/**
 * 设计器相关 API
 *
 * 调用方：designer 视图及其子组件（数据源面板、单元格编辑器、工具栏等）
 *
 * 后端统一响应结构：{ code, message, data }
 * utils/request.ts 已自动解包 ResultVO.data，这里直接拿到的是业务数据本身。
 */
import request from "@/utils/request";

/** 脚本校验错误信息 */
export interface ScriptErrorInfo {
  message: string
  line?: number
  column?: number
  [key: string]: any
}

/** 解析数据集名称结果 */
export interface ParseDatasetNameResult {
  datasetName: string
}

/** 测试数据源连接结果 */
export interface TestConnectionResult {
  result: boolean
}

/** 数据预览结果 */
export interface PreviewDataResult {
  fields: string[]
  currentTotal: number
  total: number
  data: Array<Record<string, any>>
}

/** 导入 Excel 结果 */
export interface ImportExcelResult {
  result: boolean
}

/**
 * 报表提供者元数据。
 *
 * 字段与后端 {@code com.luck.report.web.domain.vo.report.ReportProviderVo} 对齐。
 * 后端对应接口：{@code GET /designer/loadReportProviders}。
 */
export interface ReportProviderVO {
  /** 展示名（如"服务器文件系统"、"数据库"） */
  name: string
  /** provider 前缀（如"file:"、"db:"），用于 filePath 拼接 */
  prefix: string
  /** 是否禁用；禁用的 provider 不会出现在管理 UI 中 */
  disabled: boolean
}

/**
 * 报表文件记录。
 *
 * 字段与后端 {@code com.luck.report.core.provider.report.ReportFile} 对齐。
 */
export interface ReportFileItemVO {
  name: string
  path: string
  directory: boolean
  updateDate?: string
}

/**
 * 报表提供者详情。
 *
 * 在 {@link ReportProviderVO} 基础上附加指定路径下的报表文件列表。
 * 后端对应接口：{@code GET /designer/loadReportFiles?path=xxx}，
 * 响应为 {@code ReportProviderDetailVO} 数组，前端按 {@code vo.prefix} 识别 provider。
 */
export interface ReportProviderDetailVO extends ReportProviderVO {
  reportFiles: ReportFileItemVO[]
}

/**
 * 加载报表定义文件
 */
export async function loadReport(formData: FormData): Promise<any> {
  return await request.post<any>('/designer/loadReport', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 测试数据源连接
 */
export async function testConnection(formData: FormData): Promise<TestConnectionResult> {
  return await request.post<TestConnectionResult>('/datasource/testConnection', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 预览数据源数据
 */
export async function previewData(parameters: Record<string, any>): Promise<PreviewDataResult> {
  const formData = new URLSearchParams();
  for (const key in parameters) {
    const value = parameters[key];
    if (typeof value === 'object' && value !== null) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  }

  return await request.post<PreviewDataResult>('/datasource/previewData', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 加载系统内置数据源列表
 */
export async function loadBuildinDatasources(): Promise<string[]> {
  return await request.get<string[]>('/datasource/loadBuildinDatasources');
}

/**
 * 构建数据源字段
 */
export async function buildFields(parameters: Record<string, any>): Promise<any[]> {
  const formData = new URLSearchParams();
  for (const key in parameters) {
    formData.append(key, parameters[key]);
  }

  return await request.post<any[]>('/datasource/buildFields', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 脚本校验
 */
export async function scriptValidation(content: string): Promise<ScriptErrorInfo[]> {
  const formData = new URLSearchParams();
  formData.append('content', content);

  return await request.post<ScriptErrorInfo[]>('/designer/scriptValidation', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 条件脚本校验
 */
export async function conditionScriptValidation(content: string): Promise<ScriptErrorInfo[]> {
  const formData = new URLSearchParams();
  formData.append('content', content);

  return await request.post<ScriptErrorInfo[]>('/designer/conditionScriptValidation', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 构建数据库表列表
 */
export async function buildDatabaseTables(parameters: Record<string, any>): Promise<Array<{ name: string; type: string }>> {
  const formData = new URLSearchParams();
  for (const key in parameters) {
    formData.append(key, parameters[key]);
  }

  return await request.post<Array<{ name: string; type: string }>>('/datasource/buildDatabaseTables', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 构建 JDBC 数据源字段
 */
export async function buildJdbcFields(parameters: Record<string, any>): Promise<any[]> {
  const formData = new URLSearchParams();
  for (const key in parameters) {
    formData.append(key, parameters[key]);
  }
  return await request.post<any[]>('/datasource/buildFields', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 加载 Spring Bean 的方法列表
 */
export async function loadMethods(beanId: string): Promise<string[]> {
  return await request.get<string[]>('/datasource/loadMethods', {
    params: { beanId }
  });
}

/**
 * 根据类名构建字段
 */
export async function buildClass(clazz: string): Promise<any[]> {
  return await request.get<any[]>('/datasource/buildClass', {
    params: { clazz }
  });
}

/**
 * 解析表达式中的数据集名称
 */
export async function parseDatasetName(expr: string): Promise<ParseDatasetNameResult> {
  const formData = new URLSearchParams();
  formData.append('expr', expr);
  return await request.post<ParseDatasetNameResult>('/designer/parseDatasetName', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 保存报表定义文件
 * - filePath: 报表完整路径（带 provider 前缀），如 file:xxx / db:123
 * - fileName: 报表展示名（db: provider 用作 title，file: provider 忽略）
 * - content: 报表 XML 内容
 *
 * 兼容旧版：仅传 file 时，fileName 缺省为空字符串，filePath 取 file
 */
export async function saveReportFile(
  fileName: string,
  filePath: string,
  content: string
): Promise<void> {
  const formData = new URLSearchParams();
  formData.append('fileName', fileName);
  formData.append('filePath', filePath);
  formData.append('content', content);
  return await request.post<void>('/designer/saveReportFile', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 删除报表定义文件
 */
export async function deleteReportFile(filePath: string): Promise<void> {
  const formData = new URLSearchParams();
  formData.append('filePath', filePath);
  return await request.post<void>('/designer/deleteReportFile', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 保存预览文件
 * - filePath: 报表唯一路径（缓存 key），如 file:xxx / db:123
 * - fileName: 报表展示名（用于 reportParser 内部 name），如 "销售月报"
 * - content: 报表 XML 内容
 */
export async function savePreviewFile(
  filePath: string,
  content: string
): Promise<void> {
  const formData = new URLSearchParams();
  formData.append('filePath', filePath);
  formData.append('content', content);
  return await request.post<void>('/designer/savePreviewFile', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/**
 * 加载报表提供者列表。
 *
 * 后端对应：{@code GET /designer/loadReportProviders}
 * 响应 data：{@link ReportProviderVO} 数组（仅 provider 元数据，不含文件）。
 *
 * 使用场景：管理页 provider 下拉、报表来源过滤等"仅需元数据"的地方。
 */
export async function loadReportProviders(): Promise<ReportProviderVO[]> {
  return await request.get<ReportProviderVO[]>('/designer/loadReportProviders');
}

/**
 * 按路径加载每个 provider 的报表文件列表（含目录）。
 *
 * 后端对应：{@code GET /designer/loadReportFiles?path=xxx}
 * 响应 data：{@link ReportProviderDetailVO} 数组，前端按 {@code vo.prefix} 识别 provider。
 *
 * 使用场景：设计器的"打开报表"弹窗、"另存为"弹窗等需要展示文件树的地方。
 * 根目录请传空串 {@code ''}。
 */
export async function loadReportFiles(
  path: string
): Promise<ReportProviderDetailVO[]> {
  return await request.get<ReportProviderDetailVO[]>(
    '/designer/loadReportFiles',
    { params: { path } }
  );
}

/**
 * 导入 Excel 文件
 */
export async function importExcelFile(file: File): Promise<ImportExcelResult> {
  const formData = new FormData();
  formData.append('_excel_file', file);

  return await request.post<ImportExcelResult>('/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 报表分页查询 DTO（用于设计器打开/保存对话框）
 */
export interface DesignerReportQueryDTO {
  /** 报表来源前缀（例如 file:） */
  provider: string
  /** 报表名称（模糊查询，可选） */
  reportName?: string
  /** 目录路径（可选） */
  directory?: string
  /** 当前页码 */
  pageNum: number
  /** 每页大小 */
  pageSize: number
}

/**
 * 分页查询报表列表（设计器专用）
 *
 * 后端对应：{@code POST /designer/queryReports}
 * 响应 data：{@code PageResultVO<ReportFileItemVO>}
 * utils/request.ts 已自动解包 ResultVO.data，这里直接拿到的是业务数据本身。
 *
 * 使用场景：设计器的"打开报表"弹窗、"另存为"弹窗的分页加载。
 */
export async function queryDesignerReports(
  queryDTO: DesignerReportQueryDTO
): Promise<{ records: ReportFileItemVO[]; total: number }> {
  return await request.post<{ records: ReportFileItemVO[]; total: number }>(
    '/designer/queryReports',
    queryDTO
  );
}
