/**
 * 通用类型定义文件
 * 用于定义前后端交互的通用数据结构
 */

/**
 * 分页结果接口定义
 * 用于统一分页查询的返回格式，自带 code 和 message，无需再套 ResultVO
 */
export interface PageResultVO<T> {
  /** 响应码：0表示成功，非0表示失败 */
  code: number
  /** 响应消息 */
  message: string
  /** 数据列表 */
  records: T[]
  /** 总记录数 */
  total: number
  /** 当前页码 */
  pageNum: number
  /** 每页数量 */
  pageSize: number
}

/**
 * API响应结果接口定义
 * 用于统一API响应格式，包含code、message、data
 * code=0表示成功，非0表示失败
 */
export interface ResultVO<T> {
  /** 响应码：0表示成功，非0表示失败 */
  code: number
  /** 响应消息 */
  message: string
  /** 响应数据 */
  data: T
}