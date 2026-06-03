import type { ToolDefinition } from './types'
import type { Task } from './types'

/**
 * todos 工具输入参数 Schema
 * 定义任务列表的输入参数结构
 */
const TodosInputSchema = {
  type: 'object',
  properties: {
    workflowNode: {
      type: 'string',
      description: '工作流节点描述，用于告知用户正在执行的操作，例如：正在验证参数...'
    },
    todos: {
      type: 'array',
      description: '任务列表',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: '任务的唯一标识符'
          },
          content: {
            type: 'string',
            description: '任务的描述/内容'
          },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            description: '任务的当前状态：pending（待执行） | in_progress（执行中） | completed（已完成） | cancelled（已取消）'
          },
          dependencies: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: '作为此任务先决条件的其他任务ID列表，即在这些任务完成之前我们无法完成此任务'
          }
        },
        required: ['id', 'content', 'status']
      }
    }
  },
  required: ['workflowNode', 'todos']
}

/**
 * queryTodos 工具输入参数 Schema
 * 定义查询任务列表的输入参数结构
 */
const QueryTodosInputSchema = {
  type: 'object',
  properties: {
    workflowNode: {
      type: 'string',
      description: '工作流节点描述，用于告知用户正在执行的操作'
    }
  },
  required: ['workflowNode']
}

/**
 * 创建 todos 工具
 * 用于创建和变更任务列表，记录任务规划和任务动作的每一步
 *
 * @param updateTasksCallback - 更新任务列表的回调函数
 * @returns todos 工具定义
 */
export function createTodosTool(
  updateTasksCallback: (tasks: Task[], workflowNode?: string) => void
): ToolDefinition {
  return {
    name: 'todos',
    description: '创建和变更任务列表，记录任务规划和任务动作的每一步，创建、更新、完成、取消任务（todo列表），这有助于跟踪进度、组织复杂任务并展示周全性。',
    inputSchema: TodosInputSchema,
    execute: async (input: any) => {
      // 构造 Task 对象列表
      const tasks: Task[] = input.todos.map((todo: any) => ({
        id: todo.id,
        content: todo.content,
        status: todo.status,
        dependencies: todo.dependencies || [],
        workflowNode: input.workflowNode,
        timestamp: Date.now()
      }))

      // 调用回调函数更新前端状态
      updateTasksCallback(tasks, input.workflowNode)

      // 返回结果给 LLM
      return {
        success: true,
        taskCount: tasks.length,
        message: `任务列表已更新，当前有 ${tasks.length} 个任务`
      }
    },
    readOnly: false,
    requireConfirm: false
  }
}

/**
 * 创建 queryTodos 工具
 * 用于查询当前的任务进度，恢复任务记忆
 *
 * @param getTasksCallback - 获取当前任务列表的回调函数
 * @returns queryTodos 工具定义
 */
export function createQueryTodosTool(
  getTasksCallback: () => Task[]
): ToolDefinition {
  return {
    name: 'queryTodos',
    description: '获取当前的任务进度，用于查询已经规划和正在进行的任务。当你已经遗忘任务的时候或者上下文无明确任务信息，可以使用这个工具恢复任务的相关记忆。',
    inputSchema: QueryTodosInputSchema,
    execute: async (input: any) => {
      // 获取当前任务列表
      const currentTasks = getTasksCallback()

      // 返回任务列表给 LLM
      return {
        tasks: currentTasks,
        workflowNode: input.workflowNode,
        message: `当前有 ${currentTasks.length} 个任务`
      }
    },
    readOnly: true,
    requireConfirm: false
  }
}

/**
 * 创建任务管理工具数组
 * 包含 todos 和 queryTodos 两个工具
 *
 * @param updateTasksCallback - 更新任务列表的回调函数
 * @param getTasksCallback - 获取当前任务列表的回调函数
 * @returns 工具定义数组
 */
export function createTaskTools(
  updateTasksCallback: (tasks: Task[], workflowNode?: string) => void,
  getTasksCallback: () => Task[]
): ToolDefinition[] {
  return [
    createTodosTool(updateTasksCallback),
    createQueryTodosTool(getTasksCallback)
  ]
}