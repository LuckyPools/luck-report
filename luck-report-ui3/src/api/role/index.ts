/**
 * 角色报表授权 API
 *
 * 调用方：views/report/role/index.vue
 *
 * 后端控制器：com.luck.report.web.modules.role.controller.ReportRoleController
 * 接口前缀：/role （前端经 Vite 代理以 /api 转发）
 *
 * 后端统一响应结构：{ code, message, data }
 * utils/request.ts 已自动解包 ResultVO.data，这里直接拿到的是业务数据本身。
 */
import request from '@/utils/request'

// ReportFile 类型从 manage 模块 re-export，保持前端单点引用
export type { ReportFileVO as ReportFile } from '@/api/manage'

/** 角色信息（第三方系统提供，用于表格展示） */
export interface RoleInfo {
  code: string   // 角色编码
  name: string   // 角色名
}

/** 角色绑定初始化（穿梭框右侧） */
export interface RoleBindings {
  filePaths: string[]
  hasAll: boolean
}

/** 保存绑定请求 */
export interface RoleBindingDTO {
  roleCode: string
  roleName: string
  provider: string
  filePaths: string[]
  hasAll: boolean
  operator: string
}

/** 获取第三方全量角色列表（管理页表格，不分页） */
export async function listRole(): Promise<RoleInfo[]> {
  return request.get<RoleInfo[]>('/role/list')
}

/**
 * 列出某 provider 下所有非目录报表（穿梭框左侧用，不分页）。
 * <p>返回的 records 即 a-transfer 的全集 dataSource，a-transfer 自带的 pagination
 * 会做客户端分页展示。后端通过 {@code TRANSFER_REPORT_LIMIT} 阈值监控数量，
 * 超过后只记录 warn 日志不截断，由前端决定是否弹 toast 提示用搜索。
 */
export async function listAllReportsForTransfer(
  provider: string
): Promise<ReportFile[]> {
  return request.get<ReportFile[]>('/role/reports', {
    params: { provider }
  })
}

/** 某角色在某 provider 下的已绑 file_path（穿梭框右侧初始化） */
export async function getRoleBindings(
  roleCode: string,
  provider: string
): Promise<RoleBindings> {
  return request.get<RoleBindings>(`/role/bindings/${roleCode}`, {
    params: { provider }
  })
}

/** 保存某角色在某 provider 下的报表绑定 */
export async function saveRoleBindings(dto: RoleBindingDTO): Promise<void> {
  return request.post<void>('/role/bindings', dto)
}

/** 轻量管理员检查（前端用，决定是否显示"角色报表"菜单） */
export async function checkRoleAdmin(): Promise<boolean> {
  return request.get<boolean>('/role/auth/check-admin')
}