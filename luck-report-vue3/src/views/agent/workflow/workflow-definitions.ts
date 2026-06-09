/**
 * 工作流模板定义
 * 根据当前 system.md 中的任务规划流程，将其转化为代码级的工作流模板
 * 每个工作流对应一类用户意图，步骤顺序由代码强制控制
 *
 * 子工作流机制：
 * 数据源/数据集操作从 _llm_decide 升级为子工作流，
 * 用代码强制控制步骤顺序（如 preview_data 必须在 add_dataset 之前），
 * LLM 只参与需要决策的环节（生成SQL、构造数据集对象等）
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
      description: '基于读取到的数据源对象，按用户需求修改对应字段，然后调用 update_datasource 工具写入。可调用get_datasource_template获取符合规范的数据源模板作为参考'
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
 * 严格对应 datasource-dataset.md 中的"创建数据集流程"7步强制顺序
 * 代码控制步骤顺序，禁止跳步
 */
export const CREATE_DATASET_SUBWORKFLOW: WorkflowDefinition = {
  id: 'create_dataset',
  name: '创建数据集',
  description: '创建数据集的完整流程：确认数据源 → 准备SQL → 补充参数 → 校验SQL → 解析字段 → 写入 → 同步表单',
  steps: [
    {
      id: 'confirm_datasource',
      name: '确认数据源存在',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['get_datasources', 'search_schema', 'load_buildin_datasources', 'add_datasource'],
      requiredToolResults: ['get_datasources'],
      maxRetries: 1,
      description: '先调用get_datasources确认数据源是否存在。若数据源已存在则直接进入下一步；若不存在则：1.调用search_schema搜索内置数据源中包含相关表的数据源；2.调用load_buildin_datasources确认search_schema返回的datasourceName在内置数据源列表中；3.调用add_datasource创建数据源（type设为buildin，name与search_schema返回的datasourceName一致）；4.若search_schema也无结果，告知用户手动添加数据源并终止任务'
    },
    {
      id: 'prepare_sql_or_bean',
      name: '准备SQL或Bean方法',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['get_table_relation', 'load_bean_methods', 'get_datasets', 'get_dataset_template'],
      maxRetries: 1,
      description: '根据数据源类型准备查询逻辑：jdbc需用户提供SQL；buildin可根据用户意图调用get_table_relation获取表结构生成SQL；spring需调用load_bean_methods选择方法。可调用get_dataset_template获取符合规范的数据集模板。生成完整的数据集对象（含name、sql、parameters等）'
    },
    {
      id: 'preview_sql',
      name: '校验SQL可执行性',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['preview_data'],
      requiredToolResults: ['preview_data'],
      maxRetries: 1,
      description: 'SQL数据集必须调用preview_data验证SQL是否可执行。请从前序步骤"准备SQL或Bean方法"的结果中获取sql、type等参数，然后调用preview_data。不可执行则调整SQL后重试'
    },
    {
      id: 'build_fields',
      name: '解析字段列表',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['build_fields'],
      requiredToolResults: ['build_fields'],
      maxRetries: 1,
      description: 'SQL数据集必须调用build_fields解析字段列表。请从前序步骤的结果中获取sql、type等参数，然后调用build_fields。禁止自行编造fields'
    },
    {
      id: 'add_dataset',
      name: '写入数据集',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['add_dataset', 'restore_data'],
      requiredToolResults: ['add_dataset'],
      maxRetries: 1,
      description: '调用add_dataset工具写入数据集，dataset参数必须是JSON对象（禁止传JSON字符串），必须包含完整的name、sql、parameters、fields等必填字段。若调用异常则重试1次'
    },
    {
      id: 'sync_search_form',
      name: '同步查询表单',
      tool: '_llm_decide',
      needsLLM: true,
      allowedTools: ['get_search_form', 'set_search_form'],
      maxRetries: 1,
      description: '若数据集包含parameters条件参数，检查报表查询表单是否已配置对应的筛选组件，缺失则调用get_search_form和set_search_form补充'
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
  description: '创建buildin类型数据源。先通过search_schema根据用户意图定位数据源，再从load_buildin_datasources列表中校验名称，禁止凭空编造',
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
      description: '创建数据源（仅限buildin类型），按以下顺序执行：\n1. 调用search_schema搜索与用户需求匹配的数据源（传入用户意图相关的关键词），从返回结果中获取datasourceName作为数据源名称\n2. 调用load_buildin_datasources获取内置数据源名称列表，确认search_schema返回的datasourceName在该列表中\n3. 调用add_datasource创建数据源（type必须设为buildin，name必须与search_schema返回的datasourceName一致）\n禁止创建jdbc或spring类型数据源，禁止凭空编造名称'
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
  description: '修改数据集的完整流程：确认数据集存在 → 修改内容 → 调整参数 → 校验SQL → 解析字段 → 写入 → 同步表单',
  steps: [
    {
      id: 'confirm_dataset_exists',
      name: '确认数据集存在',
      tool: 'get_datasets',
      needsLLM: false,
      critical: true,
      silent: true,
      maxRetries: 1,
      description: '获取现有数据集对象，确认数据集存在'
    },
    {
      id: 'modify_dataset_obj',
      name: '修改数据集内容',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['get_table_relation', 'load_bean_methods', 'get_dataset_template'],
      maxRetries: 1,
      description: '基于获取的数据集对象，按用户要求修改对应字段。jdbc数据源修改SQL需用户提供；buildin可根据用户意图调用get_table_relation辅助修改；spring需调用load_bean_methods选择方法。可调用get_dataset_template获取符合规范的数据集模板作为参考'
    },
    {
      id: 'preview_modified_sql',
      name: '校验修改后SQL',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['preview_data'],
      requiredToolResults: ['preview_data'],
      maxRetries: 1,
      /** 仅修改了SQL时才需要校验，由上一步在stepResults中标记 */
      condition: (ctx) => {
        const modifyResult = ctx.stepResults['modify_dataset_obj']
        return modifyResult?.sqlModified !== false
      },
      description: '若修改了SQL，必须调用preview_data验证。请从前序步骤的结果中获取sql、type等参数，然后调用preview_data'
    },
    {
      id: 'rebuild_fields',
      name: '重新解析字段列表',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['build_fields'],
      requiredToolResults: ['build_fields'],
      maxRetries: 1,
      condition: (ctx) => {
        const modifyResult = ctx.stepResults['modify_dataset_obj']
        return modifyResult?.sqlModified !== false
      },
      description: '若修改了SQL，必须调用build_fields重新解析字段。请从前序步骤的结果中获取sql、type等参数，然后调用build_fields。禁止自行编造fields'
    },
    {
      id: 'update_dataset',
      name: '写入数据集',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['update_dataset', 'restore_data'],
      requiredToolResults: ['update_dataset'],
      maxRetries: 1,
      description: '调用update_dataset工具更新数据集，dataset对象必须包含完整必填字段。若调用异常则重试1次'
    },
    {
      id: 'sync_modified_form',
      name: '同步查询表单',
      tool: '_llm_decide',
      needsLLM: true,
      allowedTools: ['get_search_form', 'set_search_form'],
      maxRetries: 1,
      description: '若数据集parameters有新增或修改，检查查询表单是否已配置对应筛选组件，缺失则补充'
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
  description: '修改单元格的完整流程：读取单元格 → 确保行列足够 → 修改并写入/清空',
  steps: [
    {
      id: 'read_cells',
      name: '读取单元格数据',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['read_cell'],
      maxRetries: 1,
      description: '执行流程：\n1. 如果用户未提供单元格坐标，先输出文本询问用户（例如："请提供要修改的单元格坐标（rowIndex、colIndex，从0开始）"）\n2. 用户回复后，立即调用 read_cell 工具读取单元格数据\n3. 必须先读取再修改，禁止跳过此步骤直接写入\n\n工具参数：\n- rowIndex: 行索引，从0开始\n- colIndex: 列索引，从0开始'
    },
    {
      id: 'ensure_row_col',
      name: '确保行列足够',
      tool: '_llm_decide',
      needsLLM: true,
      /** 仅当 read_cell 返回的单元格数据不存在时才需要补齐行列 */
      condition: (ctx) => {
        const readResult = ctx.stepResults['read_cells']
        if (!readResult || !readResult.read_cell) return true
        // read_cell 返回空对象或 null 说明单元格不存在，需要补齐行列
        const cellData = readResult.read_cell
        return !cellData || (typeof cellData === 'object' && Object.keys(cellData).length === 0)
      },
      allowedTools: ['get_rows', 'get_columns', 'insert_row', 'insert_col', 'set_rows', 'set_columns'],
      maxRetries: 1,
      description: 'read_cell 返回的单元格数据不存在，说明报表行列数不足，需要先补齐行或列。补齐后需重新读取单元格数据再修改'
    },
    {
      id: 'modify_and_write_cells',
      name: '修改并写入单元格',
      tool: '_llm_decide',
      needsLLM: true,
      critical: true,
      allowedTools: ['write_cell', 'validate_expression', 'validate_condition', 'restore_data', 'read_cell', 'get_datasets', 'get_datasources', 'clear_cell_content', 'clear_cell_style', 'clear_cell_all'],
      requiredToolResults: ['write_cell'],
      maxRetries: 1,
      description: '执行流程：\n1. 从前序步骤 read_cells 的结果中获取单元格完整数据\n2. 根据用户需求修改单元格的对应字段（值、样式、表达式、条件属性等）\n3. **合并修改**：如果需要修改多个属性，必须一次性在同一个 write_cell 调用中完成，不要分多次调用\n4. **校验流程**：表达式要调用 validate_expression 校验，条件属性要调用 validate_condition 校验\n5. **写入流程**：调用 write_cell 工具写入修改后的单元格数据\n6. **失败处理**：若 write_cell 返回 0，可重试\n7. **清空操作**：若用户需要清空单元格，根据需求选择：仅清空内容（保留样式）→ clear_cell_content；仅清空样式（保留内容）→ clear_cell_style；全部清空（内容+样式）→ clear_cell_all\n\n工具参数：\n- rowIndex: 行索引，从0开始\n- colIndex: 列索引，从0开始\n- cell: 完整的单元格定义对象（JSON对象，禁止传JSON字符串），必须基于 read_cell 返回的数据修改\n\n【禁止凭空构造】必须基于 read_cell 返回的完整数据修改，不要凭空构造 cell 对象'
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
      condition: (ctx) => ctx.intent.needsDatasourceChange,
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
      condition: (ctx) => ctx.intent.needsDatasourceChange,
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
      condition: (ctx) => ctx.intent.needsDatasourceChange,
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
      condition: (ctx) => ctx.intent.needsCellChange,
      subworkflowId: 'modify_cell',
      maxRetries: 1,
      description: '执行修改单元格子工作流：读取单元格 → 确保行列足够 → 修改并写入 → 清空（可选）'
    },
    {
      id: 'modify_row_col',
      name: '修改行列结构',
      tool: '_llm_decide',
      needsLLM: true,
      condition: (ctx) => ctx.intent.needsRowColChange,
      allowedTools: ['get_rows', 'set_rows', 'update_row', 'get_columns', 'set_columns', 'update_column', 'insert_row', 'delete_row', 'insert_col', 'delete_col', 'merge_cells'],
      maxRetries: 1,
      description: '根据需求修改行高、列宽、插入/删除行列等'
    },
    {
      id: 'modify_search_form',
      name: '修改查询表单',
      tool: '_llm_decide',
      needsLLM: true,
      condition: (ctx) => ctx.intent.needsFormChange,
      allowedTools: ['get_search_form', 'set_search_form'],
      maxRetries: 1,
      description: '根据需求修改查询表单的配置'
    },
    {
      id: 'modify_page_config',
      name: '修改页面配置',
      tool: '_llm_decide',
      needsLLM: true,
      condition: (ctx) => ctx.intent.needsPageConfigChange,
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
      condition: (ctx) => ctx.intent.needsDatasourceChange,
      allowedTools: ['get_datasources', 'get_datasets'],
      maxRetries: 1,
      description: '读取报表的数据源和数据集配置'
    },
    {
      id: 'read_cells',
      name: '读取单元格',
      tool: '_llm_decide',
      needsLLM: true,
      condition: (ctx) => ctx.intent.needsCellChange,
      allowedTools: ['read_cell'],
      maxRetries: 1,
      description: '读取指定单元格的数据'
    },
    {
      id: 'read_search_form',
      name: '读取查询表单',
      tool: 'get_search_form',
      needsLLM: false,
      condition: (ctx) => ctx.intent.needsFormChange,
      maxRetries: 1,
      description: '读取查询表单的配置'
    },
    {
      id: 'read_page_config',
      name: '读取页面配置',
      tool: 'get_paper_config',
      needsLLM: false,
      condition: (ctx) => ctx.intent.needsPageConfigChange,
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
