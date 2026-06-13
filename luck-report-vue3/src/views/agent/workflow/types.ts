/**
 * 意图分析结果类型定义
 * LLM 分析用户输入后输出的结构化意图，用于确定走哪个工作流以及步骤条件
 */

/**
 * 意图分析结果
 */
export interface IntentAnalysisResult {
  /** 用户意图类型 */
  intentType: 'modify_report' | 'analyze_report' | 'irrelevant' | 'create_report'
  /** 是否涉及数据源/数据集的操作（读取或修改） */
  needsDatasourceOperation: boolean
  /** 是否涉及单元格的操作（读取或修改） */
  needsCellOperation: boolean
  /** 是否涉及查询表单的操作（读取或修改） */
  needsFormOperation: boolean
  /** 是否涉及页面配置的操作（读取或修改） */
  needsPageConfigOperation: boolean
  /** 是否涉及行操作（行高调整、插入/删除行等） */
  needsRowOperation: boolean
  /** 是否涉及列操作（列宽调整、插入/删除列等） */
  needsColOperation: boolean
  /** 是否涉及业务知识查询 */
  needsBusinessKnowledge: boolean
  /** 是否需要参考报表制作经验 */
  needsAgentKnowledge: boolean
  /** 是否需要跨数据源搜索表结构 */
  needsSchemaSearch: boolean
  /** 需要加载的文档列表 */
  requiredDocs: string[]
  /** 任务描述，供后续步骤的 LLM 参考 */
  taskDescription: string
}
