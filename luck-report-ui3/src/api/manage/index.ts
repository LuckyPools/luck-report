/**
 * 报表管理 API
 *
 * 调用方：views/report/manage/index.vue
 *
 * 后端控制器：com.luck.report.web.controller.manage.ManageController
 * 接口前缀：/report/manage  （前端经 Vite 代理以 /api 转发）
 */
import request from '@/utils/request'
import type { ResultVO } from '@/types/api'

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
export async function loadReportProviders(): Promise<ResultVO<ReportProviderVO[]>> {
  const response = await request.get('/manage/loadReportProviders')
  return response as ResultVO<ReportProviderVO[]>
}

/**
 * 分页查询报表列表
 * @param query 查询条件
 * @returns 分页结果
 */
export async function queryReports(query: QueryReportsDTO): Promise<ResultVO<ReportPageVO>> {
  const response = await request.get('/manage/queryReports', { params: query })
  return response as ResultVO<ReportPageVO>
}

/**
 * 删除报表
 * @param file 报表完整路径（带 provider 前缀，例如 file:xxx.ureport.xml）
 * @returns 删除结果
 */
export async function deleteReport(file: string): Promise<ResultVO<void>> {
  const response = await request.get('/manage/deleteReport', { params: { file } })
  return response as ResultVO<void>
}
