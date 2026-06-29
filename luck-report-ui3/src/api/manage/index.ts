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
import type { PageResultVO } from '@/types/api'

/**
 * 报表文件记录
 * 字段与后端 com.luck.report.core.provider.report.ReportFile 保持一致
 * - name: 文件名（展示名）
 * - path: 不带 provider 前缀的原始路径（如 db 存储的数据库 id "123"、file 存储的相对文件名 "x.ureport.xml"）
 * - directory: 是否为目录
 * - updateDate: 更新时间
 */
export interface ReportFileVO {
  name: string
  path: string
  directory: boolean
  updateDate: string
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
 * 报表分页查询 DTO
 */
export interface ReportQueryDTO {
  /** 报表来源前缀（例如 file:） */
  provider: string
  /** 报表名称（模糊查询） */
  reportName?: string
  /** 目录路径（可选） */
  directory?: string
  /** 当前页码 */
  pageNum: number
  /** 每页大小 */
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
 * @param queryDTO 查询条件
 * @returns 分页结果
 */
export async function queryReports(queryDTO: ReportQueryDTO): Promise<PageResultVO<ReportFileVO>> {
  return request.post<PageResultVO<ReportFileVO>>('/manage/queryReports', queryDTO)
}

/**
 * 删除报表
 * @param file 报表完整路径（带 provider 前缀，例如 file:xxx）
 */
export async function deleteReport(file: string): Promise<void> {
  return request.get<void>('/manage/deleteReport', { params: { file } })
}

/**
 * 新建报表
 * - 后端从 classpath:template/template.ureport.xml 读取空白模板
 * - 在指定 provider 下创建 fileName（完整路径 = provider + fileName）
 * - 后端返回保存后的 ReportFile，其 path 不含 provider 前缀
 * @param fileName 报表名
 * @param provider 报表来源前缀（例如 file:）
 * @returns 创建结果 ReportFile
 */
export async function createReport(fileName: string, provider: string): Promise<ReportFileVO> {
  return request.get<ReportFileVO>('/designer/createReport', {
    params: { fileName, provider }
  })
}

/**
 * 复制报表
 * - 复制源报表到同 provider 下的 newFilePath
 * - 后端通过 provider.loadReport 读取源内容，再 provider.saveReport 写入新位置
 * - 后端返回保存后的 ReportFile，其 path 不含 provider 前缀
 * @param sourceFilePath 源报表完整路径（带 provider 前缀），如 file:xxx.ureport.xml / db:123
 * @param newFilePath 目标报表完整路径（带 provider 前缀），如 file:xxx_copy.ureport.xml / db:xxx_copy
 * @param newTitle 目标报表展示名（db: provider 用作 title，可选）
 * @returns 复制结果 ReportFile
 */
export async function copyReport(
  sourceFilePath: string,
  newFilePath: string,
  newTitle?: string
): Promise<ReportFileVO> {
  return request.get<ReportFileVO>('/designer/copyReport', {
    params: { sourceFilePath, newFilePath, newTitle }
  })
}
