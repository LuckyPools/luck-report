/**
 * 编译图节点元数据查询
 * 编译图本身已支持 stream/invoke/getGraph，无需适配层
 * 这里只保留"从编译图提取节点元数据"两个查询函数
 */

import type { CompiledReportGraph, NodeMeta } from './types.ts'

/**
 * 从编译图取所有业务节点名（过滤 __start__ / __end__ 等内部节点）
 * @param compiled - LangGraph 编译图
 * @returns 节点名列表
 */
export function getCompiledNodeNames(compiled: CompiledReportGraph): string[] {
  const names = new Set<string>()
  try {
    const graph = (compiled as any).getGraph?.()
    if (graph?.nodes) {
      for (const name of Object.keys(graph.nodes)) {
        if (!name.startsWith('__')) names.add(name)
      }
    }
  } catch {
    // 静默失败，回退到 builder.allEdges
  }
  if (names.size === 0) {
    try {
      const edges = (compiled as any).builder?.allEdges
      if (edges && typeof edges.forEach === 'function') {
        edges.forEach((edge: [string, string]) => {
          if (edge[0] && !edge[0].startsWith('__')) names.add(edge[0])
          if (edge[1] && !edge[1].startsWith('__')) names.add(edge[1])
        })
      }
    } catch {
      // 静默失败
    }
  }
  return Array.from(names)
}

/**
 * 从编译图取节点元数据（type / description）
 * @param compiled - LangGraph 编译图
 * @param name - 节点名
 * @returns 节点元数据（找不到返回 undefined）
 */
export function getCompiledNode(compiled: CompiledReportGraph, name: string): NodeMeta | undefined {
  if (name.startsWith('__')) return undefined
  try {
    const graph = (compiled as any).getGraph?.()
    const spec = graph?.nodes?.[name] ?? (compiled as any).builder?.spec?.[name]
    if (!spec) return undefined
    return { type: 'node', description: spec?.metadata?.description }
  } catch {
    return undefined
  }
}
