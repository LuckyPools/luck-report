/**
 * 工作流模板定义，每个工作流对应一类用户意图，步骤顺序由代码强制控制
 */
import type { WorkflowDefinition } from './types'

// ==================== 数据源/数据集子工作流 ====================

/**
 * 修改数据源子工作流
 * 流程：读取现有数据源 → LLM修改 → 写入
 */
export const MODIFY_DATASOURCE_SUBWORKFLOW: WorkflowDefinition = {
  id: 'modify_datasource',
  name: '修改数据源',
  description: '修改已有数据源的配置（连接信息、类型等），先读取再修改后写入',
  steps: [
    {
      id: 'read_datasource',
      name: '读取数据源',
      tool: 'get_datasources',
      needsLLM: false,
      critical: true,
      silent: true,
      maxRetries: 1,
      description: '读取目标数据源的当前配置'
    },
    {
      id: 'modify_datasource_obj',
      name: '修改数据源对象',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['update_datasource', 'get_datasource_template'],
      requiredToolResults: ['update_datasource'],
      maxRetries: 1,
      description: '基于读取的数据源对象修改字段，调用 update_datasource 写入'
    }
  ]
}

/**
 * 删除数据源子工作流
 * 流程：确认存在 → 删除
 */
export const DELETE_DATASOURCE_SUBWORKFLOW: WorkflowDefinition = {
  id: 'delete_datasource',
  name: '删除数据源',
  description: '删除指定数据源，先确认存在再删除',
  steps: [
    {
      id: 'confirm_datasource_exists',
      name: '确认数据源存在',
      tool: 'get_datasources',
      needsLLM: false,
      critical: true,
      silent: true,
      maxRetries: 1,
      description: '确认目标数据源存在'
    },
    {
      id: 'delete_datasource_obj',
      name: '删除数据源',
      tool: 'remove_datasource',
      needsLLM: false,
      maxRetries: 1,
      description: '调用 remove_datasource 删除数据源'
    }
  ]
}

/**
 * 创建数据集子工作流
 * 严格对应 datasource-dataset.md 中的"创建数据集流程"
 * 代码控制步骤顺序，禁止跳步
 *
 * 优化：将原6步合并为4步，减少 LLM 调用次数
 * - confirm_datasource + prepare_sql → confirm_and_prepare（确认数据源 + 准备SQL合并）
 * - preview_sql + build_fields → validate_and_build_fields（校验SQL + 解析字段合并）
 */
export const CREATE_DATASET_SUBWORKFLOW: WorkflowDefinition = {
  id: 'create_dataset',
  name: '创建数据集',
  description: '创建数据集流程：确认数据源 → 校验SQL → 解析字段 → 写入 → 同步表单',
  steps: [
    {
      id: 'confirm_and_prepare',
      name: '确认数据源并准备SQL',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['get_datasources', 'search_schema', 'load_buildin_datasources', 'add_datasource', 'get_table_relation', 'load_bean_methods', 'get_datasets', 'get_dataset_template'],
      requiredToolResults: ['get_datasources'],
      maxRetries: 1,
      maxIterations: 4,
      description: '确认数据源存在（不存在则通过 search_schema 定位并创建），准备SQL或Bean方法，生成数据集对象'
    },
    {
      id: 'validate_and_build_fields',
      name: '校验SQL并解析字段',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['preview_data', 'build_fields'],
      requiredToolResults: ['preview_data', 'build_fields'],
      maxRetries: 1,
      maxIterations: 3,
      description: '调用 preview_data 验证SQL，调用 build_fields 解析字段'
    },
    {
      id: 'add_dataset',
      name: '写入数据集',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['add_dataset'],
      requiredToolResults: ['add_dataset'],
      maxRetries: 1,
      maxIterations: 3,
      description: '调用 add_dataset 写入数据集'
    },
    {
      id: 'sync_search_form',
      name: '同步查询表单',
      tool: '_llm_decide',
      needsLLM: true,
      allowedTools: ['get_search_form', 'set_search_form'],
      maxRetries: 1,
      maxIterations: 3,
      description: '检查查询表单是否已配置对应筛选组件，缺失则补充'
    }
  ]
}

/**
 * 创建数据源子工作流
 * 仅允许创建 buildin 类型数据源
 * 流程：search_schema定位数据源 → load_buildin_datasources校验名称 → add_datasource创建 → 确认数据源存在
 */
export const CREATE_DATASOURCE_SUBWORKFLOW: WorkflowDefinition = {
  id: 'create_datasource',
  name: '创建数据源',
  description: '创建buildin类型数据源：search_schema定位 → load_buildin_datasources校验 → add_datasource创建',
  steps: [
    {
      id: 'search_and_create_datasource',
      name: '搜索并创建数据源',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['search_schema', 'load_buildin_datasources', 'add_datasource'],
      requiredToolResults: ['search_schema', 'load_buildin_datasources', 'add_datasource'],
      maxRetries: 1,
      description: '调用 search_schema 定位数据源，调用 load_buildin_datasources 校验名称，调用 add_datasource 创建（type=buildin）'
    },
    {
      id: 'confirm_datasource',
      name: '确认数据源存在',
      tool: 'get_datasources',
      needsLLM: false,
      critical: true,
      silent: true,
      maxRetries: 1,
      description: '确认刚创建的数据源已存在',
      resultValidator: (result) => {
        if (Array.isArray(result) && result.length === 0) {
          return '数据源创建可能失败，当前报表仍无数据源'
        }
        return undefined
      }
    }
  ]
}

/**
 * 修改数据集子工作流
 * 严格对应 datasource-dataset.md 中的"修改数据集流程"7步强制顺序
 * 代码控制步骤顺序，禁止跳步
 */
export const MODIFY_DATASET_SUBWORKFLOW: WorkflowDefinition = {
  id: 'modify_dataset',
  name: '修改数据集',
  description: '修改数据集流程：确认存在 → 修改内容 → 校验SQL → 解析字段 → 写入 → 同步表单',
  steps: [
    {
      id: 'confirm_dataset_exists',
      name: '确认数据集存在',
      tool: 'get_datasets',
      needsLLM: false,
      critical: true,
      silent: true,
      maxRetries: 1,
      description: '获取现有数据集对象'
    },
    {
      id: 'modify_dataset_obj',
      name: '修改数据集内容',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['get_table_relation', 'load_bean_methods', 'get_dataset_template'],
      maxRetries: 1,
      maxIterations: 3,
      description: '基于获取的数据集对象修改字段，可调用 get_table_relation 或 load_bean_methods 辅助'
    },
    {
      id: 'validate_and_rebuild_fields',
      name: '校验SQL并重建字段',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['preview_data', 'build_fields'],
      requiredToolResults: ['preview_data', 'build_fields'],
      maxRetries: 1,
      maxIterations: 3,
      condition: (ctx) => {
        const beforeResult = ctx.stepResults['confirm_dataset_exists']
        const afterResult = ctx.stepResults['modify_dataset_obj']
        if (!beforeResult || !afterResult) return true
        const beforeDatasets = beforeResult.get_datasets
        const beforeSql = Array.isArray(beforeDatasets) ? beforeDatasets[0]?.sql : beforeDatasets?.sql
        const afterUpdateResult = afterResult.update_dataset
        const afterSql = afterUpdateResult?.sql ?? afterUpdateResult?.dataset?.sql
        if (beforeSql && afterSql && beforeSql === afterSql) return false
        return true
      },
      description: '若修改了SQL，调用 preview_data 验证，调用 build_fields 重建字段'
    },
    {
      id: 'update_dataset',
      name: '写入数据集',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['update_dataset'],
      requiredToolResults: ['update_dataset'],
      maxRetries: 1,
      maxIterations: 3,
      description: '调用 update_dataset 更新数据集'
    },
    {
      id: 'sync_modified_form',
      name: '同步查询表单',
      tool: '_llm_decide',
      needsLLM: true,
      allowedTools: ['get_search_form', 'set_search_form'],
      maxRetries: 1,
      maxIterations: 3,
      description: '检查查询表单是否已配置对应筛选组件，缺失则补充'
    }
  ]
}

/**
 * 删除数据集子工作流
 * 流程：确认存在 → 删除
 */
export const DELETE_DATASET_SUBWORKFLOW: WorkflowDefinition = {
  id: 'delete_dataset',
  name: '删除数据集',
  description: '删除指定数据集，先确认存在再删除',
  steps: [
    {
      id: 'confirm_dataset_exists',
      name: '确认数据集存在',
      tool: 'get_datasets',
      needsLLM: false,
      critical: true,
      silent: true,
      maxRetries: 1,
      description: '确认目标数据集存在'
    },
    {
      id: 'delete_dataset_obj',
      name: '删除数据集',
      tool: 'remove_dataset',
      needsLLM: false,
      maxRetries: 1,
      description: '调用 remove_dataset 删除数据集'
    }
  ]
}

/**
 * 修改单元格子工作流
 * 严格对应 cell-common-attribute.md 中的"修改单元格步骤"和"清空单元格步骤"
 * 代码强制控制步骤顺序：先读后写，禁止跳步
 */
export const MODIFY_CELL_SUBWORKFLOW: WorkflowDefinition = {
  id: 'modify_cell',
  name: '修改单元格',
  description: '修改单元格流程：读取 → 确保行列足够 → 修改并写入/清空',
  steps: [
    {
      id: 'read_cells',
      name: '读取单元格数据',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['read_cells'],
      maxRetries: 1,
      description: '调用 read_cells 读取单元格数据。用户已提供坐标则直接读取，未提供则询问'
    },
    {
      id: 'ensure_row_col',
      name: '确保行列足够',
      tool: '_llm_decide',
      needsLLM: true,
      condition: (ctx) => {
        const readResult = ctx.stepResults['read_cells']
        if (!readResult) return true
        const cellsResult = readResult.read_cells
        if (cellsResult) {
          const values = Object.values(cellsResult)
          return values.length === 0 || values.every(v => !v || (typeof v === 'object' && Object.keys(v).length === 0))
        }
        return true
      },
      allowedTools: ['get_rows', 'get_columns', 'insert_row', 'insert_col', 'set_rows', 'set_columns'],
      maxRetries: 1,
      description: '单元格不存在时补齐行列，补齐后需重新读取'
    },
    {
      id: 'modify_and_write_cells',
      name: '修改并写入单元格',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      // [修复] 移除 read_cells：上游 read_cells 节点已把数据写入 state.cellsData，本节点不允许再读
      // [修复] 新增 get_cell_template：创建/类型变更场景必须先取模板
      allowedTools: ['write_cells', 'get_cell_template', 'validate_expression', 'validate_condition', 'clear_cell_content', 'clear_cell_style', 'clear_cell_all'],
      requiredToolResults: ['write_cells'],
      maxRetries: 3,
      description: '**cellsData 已在 context 中，禁止调用 read_cells 重读**。' +
        '按"决策流程"处理每个目标：① 读取 context.cellsData 中的 cell 结构；' +
        '② 场景判断：cell 为空 → 调 get_cell_template 取初始模板；' +
        'cell.value.type 与需求类型不一致 → 调 get_cell_template({type:新类型}) 取新模板；' +
        '类型一致 → 直接复用 cellsData 中的 cell，仅改 value 字段；' +
        '③ 一次 write_cells 写完所有目标，禁止分批。' +
        '表达式用 validate_expression 校验，条件属性用 validate_condition 校验，清空选 clear_cell_*。'
    }
  ]
}

// ==================== 子工作流注册表 ====================

/**
 * 子工作流注册表
 * 根据操作类型映射到对应的子工作流模板
 */
export const SUBWORKFLOW_REGISTRY: Record<string, WorkflowDefinition> = {
  modify_datasource: MODIFY_DATASOURCE_SUBWORKFLOW,
  delete_datasource: DELETE_DATASOURCE_SUBWORKFLOW,
  create_datasource: CREATE_DATASOURCE_SUBWORKFLOW,
  create_dataset: CREATE_DATASET_SUBWORKFLOW,
  modify_dataset: MODIFY_DATASET_SUBWORKFLOW,
  delete_dataset: DELETE_DATASET_SUBWORKFLOW,
  modify_cell: MODIFY_CELL_SUBWORKFLOW
}

/**
 * 根据操作类型获取子工作流定义
 * @param operationType - 数据源操作类型，string，不可为空
 * @returns 子工作流定义或 undefined
 */
export function getSubworkflowByType(operationType: string): WorkflowDefinition | undefined {
  return SUBWORKFLOW_REGISTRY[operationType]
}

// ==================== 主工作流 ====================

/**
 * 修改报表工作流
 * 对应 system.md 中"修改报表"的完整流程：
 * 需求解析 → 加载文档 → 获取知识 → 路由数据源操作 → 执行数据源子工作流 → 修改单元格 → 修改表单 → 修改页面配置 → 完成
 * 数据源/数据集操作从 _llm_decide 升级为子工作流，用代码强制控制步骤顺序
 */
export const MODIFY_REPORT_WORKFLOW: WorkflowDefinition = {
  id: 'modify_report',
  name: '修改报表',
  description: '根据用户需求修改报表的各类配置，包括数据源、单元格、查询表单、页面配置等',
  steps: [
    {
      id: 'load_docs',
      name: '加载报表文档',
      tool: 'load_report_introduce',
      needsLLM: false,
      critical: true,
      silent: true,
      maxRetries: 1,
      dynamicParams: (ctx) => ({ fileNames: ctx.intent.requiredDocs }),
      description: '根据用户需求加载对应的报表说明文档，了解数据模型和操作步骤'
    },
    {
      id: 'search_business_knowledge',
      name: '搜索业务知识',
      tool: 'search_business_knowledge',
      needsLLM: true,
      silent: true,
      condition: (ctx) => ctx.intent.needsBusinessKnowledge,
      maxRetries: 1,
      description: '搜索与用户需求相关的业务术语、业务规则等知识'
    },
    {
      id: 'search_agent_knowledge',
      name: '搜索报表制作经验',
      tool: 'search_agent_knowledge',
      needsLLM: true,
      silent: true,
      condition: (ctx) => ctx.intent.needsAgentKnowledge,
      maxRetries: 1,
      description: '搜索报表制作的案例、最佳实践和设计经验'
    },
    {
      id: 'search_schema',
      name: '搜索数据源表结构',
      tool: 'search_schema',
      needsLLM: true,
      silent: true,
      condition: (ctx) => ctx.intent.needsSchemaSearch,
      maxRetries: 1,
      description: '跨数据源搜索表结构，定位包含相关表的数据源'
    },
    {
      id: 'route_datasource_op',
      name: '分析数据源操作类型',
      tool: '_llm_decide',
      needsLLM: true,
      condition: (ctx) => ctx.intent.needsDatasourceOperation,
      allowedTools: ['get_datasources', 'get_datasets', 'select_datasource_operation'],
      requiredToolResults: ['select_datasource_operation'],
      maxRetries: 1,
      description: '分析用户需求，确定数据源/数据集的具体操作类型。请先调用 get_datasources 了解当前数据源状态（若数据源为空则无需调用 get_datasets，数据集也必然为空），然后调用 select_datasource_operation 工具选择操作类型'
    },
    {
      id: 'execute_datasource_op',
      name: '执行数据源操作',
      tool: '_subworkflow',
      needsLLM: true,
      critical: true,
      condition: (ctx) => ctx.intent.needsDatasourceOperation,
      /** 根据路由步骤的结果动态选择子工作流 */
      subworkflowSelector: (ctx) => {
        const routeResult = ctx.stepResults['route_datasource_op']
        const operationType = routeResult?.select_datasource_operation?.operationType
        // 安全校验：数据源为空时，无论 LLM 选择了什么操作类型，都必须先创建数据源
        // 防止 LLM 在数据源为空时误选 create_dataset 导致步骤跳过
        const datasources = routeResult?.get_datasources
        if (Array.isArray(datasources) && datasources.length === 0) {
          return 'create_datasource'
        }
        // 创建数据源时走创建数据源子工作流
        if (operationType === 'create_datasource') {
          return 'create_datasource'
        }
        // 修改/删除数据源走对应子工作流
        if (operationType === 'modify_datasource' || operationType === 'delete_datasource') {
          return operationType
        }
        // 其他操作类型（如 create_dataset）不需要执行数据源子工作流，跳过
        return undefined as any
      },
      maxRetries: 1,
      description: '根据路由步骤确定的操作类型，执行数据源相关的子工作流（创建/修改/删除数据源）'
    },
    {
      id: 'execute_dataset_op',
      name: '执行数据集操作',
      tool: '_subworkflow',
      needsLLM: true,
      critical: true,
      condition: (ctx) => ctx.intent.needsDatasourceOperation,
      /** 数据集操作：创建/修改/删除数据集。数据源为空时先创建数据源后也需创建数据集 */
      subworkflowSelector: (ctx) => {
        const routeResult = ctx.stepResults['route_datasource_op']
        const operationType = routeResult?.select_datasource_operation?.operationType
        // 数据源为空时，创建数据源后必须继续创建数据集
        const datasources = routeResult?.get_datasources
        if (Array.isArray(datasources) && datasources.length === 0) {
          return 'create_dataset'
        }
        // 创建数据源后通常还需要创建数据集
        if (operationType === 'create_datasource') {
          return 'create_dataset'
        }
        // 创建/修改/删除数据集走对应子工作流
        if (operationType === 'create_dataset' || operationType === 'modify_dataset' || operationType === 'delete_dataset') {
          return operationType
        }
        // 纯数据源操作不需要执行数据集子工作流，跳过
        return undefined as any
      },
      maxRetries: 1,
      description: '根据路由步骤确定的操作类型，执行数据集相关的子工作流（创建/修改/删除数据集）'
    },
    {
      id: 'modify_cells',
      name: '修改单元格',
      tool: '_subworkflow',
      needsLLM: true,
      critical: true,
      condition: (ctx) => ctx.intent.needsCellOperation,
      subworkflowId: 'modify_cell',
      maxRetries: 1,
      description: '执行修改单元格子工作流：读取单元格 → 确保行列足够 → 修改并写入 → 清空（可选）'
    },
    {
      id: 'modify_row',
      name: '修改行结构',
      tool: '_llm_decide',
      needsLLM: true,
      condition: (ctx) => ctx.intent.needsRowOperation,
      allowedTools: ['get_rows', 'set_rows', 'update_row', 'insert_row', 'delete_row'],
      maxRetries: 1,
      description: '根据需求修改行高、插入/删除行等'
    },
    {
      id: 'modify_col',
      name: '修改列结构',
      tool: '_llm_decide',
      needsLLM: true,
      condition: (ctx) => ctx.intent.needsColOperation,
      allowedTools: ['get_columns', 'set_columns', 'update_column', 'insert_col', 'delete_col'],
      maxRetries: 1,
      description: '根据需求修改列宽、插入/删除列等'
    },
    {
      id: 'modify_search_form',
      name: '修改查询表单',
      tool: '_llm_decide',
      needsLLM: true,
      condition: (ctx) => ctx.intent.needsFormOperation,
      allowedTools: ['get_search_form', 'set_search_form'],
      maxRetries: 1,
      description: '根据需求修改查询表单的配置'
    },
    {
      id: 'modify_page_config',
      name: '修改页面配置',
      tool: '_llm_decide',
      needsLLM: true,
      condition: (ctx) => ctx.intent.needsPageConfigOperation,
      allowedTools: ['get_paper_config', 'update_paper'],
      maxRetries: 1,
      description: '根据需求修改页面配置（纸张大小、边距、方向等）'
    }
  ]
}

/**
 * 分析报表工作流
 * 对应 system.md 中"分析报表"的流程：
 * 需求解析 → 加载文档 → 读取数据源 → 读取单元格 → 读取表单 → 读取页面配置 → 返回分析结果
 */
export const ANALYZE_REPORT_WORKFLOW: WorkflowDefinition = {
  id: 'analyze_report',
  name: '分析报表',
  description: '读取报表的各类配置数据，分析报表结构并返回分析结果',
  steps: [
    {
      id: 'load_docs',
      name: '加载报表文档',
      tool: 'load_report_introduce',
      needsLLM: false,
      critical: true,
      silent: true,
      maxRetries: 1,
      dynamicParams: (ctx) => ({ fileNames: ctx.intent.requiredDocs }),
      description: '加载报表说明文档，了解数据模型'
    },
    {
      id: 'read_datasource',
      name: '读取数据源/数据集',
      tool: '_llm_decide',
      needsLLM: true,
      condition: (ctx) => ctx.intent.needsDatasourceOperation,
      allowedTools: ['get_datasources', 'get_datasets'],
      maxRetries: 1,
      description: '本步骤仅负责读取数据源和数据集配置，禁止调用任何写入工具。读取完成后立即结束本步骤'
    },
    {
      id: 'read_cells',
      name: '读取单元格',
      tool: '_llm_decide',
      needsLLM: true,
      condition: (ctx) => ctx.intent.needsCellOperation,
      allowedTools: ['read_cells'],
      maxRetries: 1,
      description: '本步骤仅负责读取单元格数据，禁止调用任何写入工具。使用 read_cells 一次性传入全部目标坐标进行批量读取。读取完成后立即结束本步骤'
    },
    {
      id: 'read_search_form',
      name: '读取查询表单',
      tool: 'get_search_form',
      needsLLM: false,
      condition: (ctx) => ctx.intent.needsFormOperation,
      maxRetries: 1,
      description: '读取查询表单的配置'
    },
    {
      id: 'read_page_config',
      name: '读取页面配置',
      tool: 'get_paper_config',
      needsLLM: false,
      condition: (ctx) => ctx.intent.needsPageConfigOperation,
      maxRetries: 1,
      description: '读取页面配置'
    }
  ]
}

// ==================== 工作流注册表 ====================

/**
 * 工作流注册表
 * 根据意图类型映射到对应的工作流模板
 */
export const WORKFLOW_REGISTRY: Record<string, WorkflowDefinition> = {
  modify_report: MODIFY_REPORT_WORKFLOW,
  analyze_report: ANALYZE_REPORT_WORKFLOW
}

/**
 * 根据意图类型获取工作流定义
 * @param intentType - 意图类型，string，不可为空
 * @returns 工作流定义或 undefined
 */
export function getWorkflowByIntent(intentType: string): WorkflowDefinition | undefined {
  return WORKFLOW_REGISTRY[intentType]
}
