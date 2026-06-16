/**
 * 全局静态配置（聚合导出）
 *
 * 业务域拆分：
 * - agent  : AI Agent 引擎 / 上下文 / 压缩 / 快照 相关
 * - report : 报表设计器相关（预留）
 * - 其它业务域按需扩展
 */

export * from './agent'
