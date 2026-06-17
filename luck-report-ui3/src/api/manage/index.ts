/**
 * 报表管理 API
 *
 * 调用方：views/report/manage/index.vue
 *
 * 后端控制器：com.luck.report.web.controller.manage.ManageController
 * 接口前缀：/report/manage  （前端经 Vite 代理以 /api 转发）
 *
 * 后端统一响应结构：{ code, message, data }
 * utils/request.ts 已自动解包 ResultVO.data，这里直接拿到的是业务数据本身。
 */
import request from '@/utils/request'

/**
 * 报表文件记录
 * - filePath: 完整访问路径（带 provider 前缀，例如 file:xxx.ureport.xml）
 * - fileName: 原始文件名
 * - isDirectory: 是否为目录
 */
export interface ReportFileVO {
  filePath: string
  fileName: string
  isDirectory: boolean
}

/**
 * 报表分页结果
 */
export interface ReportPageVO {
  total: number
  records: ReportFileVO[]
}

/**
 * 报表提供者元数据
 */
export interface ReportProviderVO {
  name: string
  prefix: string
  disabled: boolean
}

/**
 * 分页查询参数
 */
export interface QueryReportsDTO {
  provider: string
  reportName?: string
  directory?: string
  pageNum: number
  pageSize: number
}

/**
 * 加载报表来源（provider）列表
 * @returns 报表来源数组
 */
export async function loadReportProviders(): Promise<ReportProviderVO[]> {
  return request.get<ReportProviderVO[]>('/manage/loadReportProviders')
}

/**
 * 分页查询报表列表
 * @param query 查询条件
 * @returns 分页结果
 */
export async function queryReports(query: QueryReportsDTO): Promise<ReportPageVO> {
  return request.get<ReportPageVO>('/manage/queryReports', { params: query })
}

/**
 * 删除报表
 * @param file 报表完整路径（带 provider 前缀，例如 file:xxx.ureport.xml）
 */
export async function deleteReport(file: string): Promise<void> {
  return request.get<void>('/manage/deleteReport', { params: { file } })
}

/**
 * 新建报表的返回结果
 */
export interface CreateReportResultVO {
  fileName: string
  filePath: string
  provider: string
}

/**
 * 新建报表（使用空白模板在指定 provider 下创建报表文件）
 * - 后端从 classpath:template/template.ureport.xml 读取空白模板
 * - 在指定 provider 下创建 fileName（完整路径 = provider + fileName）
 * @param fileName 报表名（含 .ureport.xml 后缀）
 * @param provider 报表来源前缀（例如 file:）
 * @returns 创建结果
 */
export async function createReport(fileName: string, provider: string): Promise<CreateReportResultVO> {
  return request.get<CreateReportResultVO>('/designer/createReport', {
    params: { fileName, provider }
  })
}
