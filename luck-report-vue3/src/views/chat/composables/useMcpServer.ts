import { ref, computed } from 'vue'
import type { McpServer, McpTool } from '../types/chat'

/**
 * MCP 服务器管理 Hook
 * 对应 HiveChat useMcpServerStore，管理 MCP 服务器列表、选中状态、工具列表
 */
export function useMcpServer() {
  /** 是否有可用的 MCP 服务器 */
  const hasUseMcp = ref(false)

  /** 是否有已选中的 MCP 服务器 */
  const hasMcpSelected = ref(false)

  /** MCP 服务器列表 */
  const mcpServers = ref<Array<McpServer & { selected?: boolean }>>([])

  /** 所有 MCP 工具列表 */
  const allTools = ref<McpTool[]>([])

  /** 已选中的 MCP 工具列表（根据选中的服务器过滤） */
  const selectedTools = computed(() => {
    return allTools.value.filter(tool =>
      mcpServers.value.some(s => s.name === tool.serverName && s.selected)
    )
  })

  /**
   * 设置是否有可用的 MCP 服务器
   * @param value - 是否可用
   */
  const setHasUseMcp = (value: boolean) => {
    hasUseMcp.value = value
  }

  /**
   * 设置 MCP 服务器列表
   * @param servers - 服务器列表
   */
  const setMcpServers = (servers: McpServer[]) => {
    mcpServers.value = servers.map(s => ({ ...s, selected: false }))
    hasUseMcp.value = servers.length > 0
  }

  /**
   * 切换 MCP 服务器选中状态
   * 同步更新 hasMcpSelected 和 selectedTools
   *
   * @param name - 服务器名称
   * @param selected - 是否选中
   */
  const changeMcpServerSelect = (name: string, selected: boolean) => {
    const server = mcpServers.value.find(s => s.name === name)
    if (server) {
      server.selected = selected
    }
    hasMcpSelected.value = mcpServers.value.some(s => s.selected)
  }

  /**
   * 设置所有 MCP 工具列表
   * @param tools - 工具列表
   */
  const setAllTools = (tools: McpTool[]) => {
    allTools.value = tools
  }

  /**
   * 清除所有 MCP 服务器选中状态
   */
  const clearAllSelect = () => {
    mcpServers.value.forEach(s => { s.selected = false })
    hasMcpSelected.value = false
  }

  return {
    hasUseMcp,
    hasMcpSelected,
    mcpServers,
    allTools,
    selectedTools,
    setHasUseMcp,
    setMcpServers,
    changeMcpServerSelect,
    setAllTools,
    clearAllSelect
  }
}
