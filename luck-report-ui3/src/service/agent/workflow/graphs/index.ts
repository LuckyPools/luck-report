/**
 * 业务子图统一导出（LangGraph 版本）
 * 工作流图注册（langgraph/workflow-graphs.ts）从这里导入所需能力
 *
 * 模块结构（按"组件域"组织：read / write 同文件就近维护）：
 * - datasource-graphs.ts         数据源（create / modify / delete / read_datasources）
 * - dataset-create-graphs.ts     数据集创建/修改/删除/读（create / modify / delete / read_datasets）
 * - cell-graphs.ts               单元格（modify / read_cells）
 * - row-col-graphs.ts            行/列结构（modify_row / modify_col / read_rows / read_cols）
 * - form-graphs.ts          查询表单/页面配置（modify / read_form / read_page）
 * - dataset-shared-builders.ts   数据集工作流共享节点构造器
 * - unit-report-graph.ts      顶层唯一主图（read + write 自由混排）
 *
 * 关键约定：read_* 工厂不在 index.ts 单独导出，仅由 unit-report-graph.ts 的 ActionRegistry 内部调用
 */

export {
  createDatasourceGraph,
  modifyDatasourceGraph,
  deleteDatasourceGraph
} from './datasource-graphs.ts'

export {
  createDatasetGraph,
  modifyDatasetGraph,
  deleteDatasetGraph
} from './dataset-create-graphs.ts'

export { modifyCellGraph, mergeCellsGraph } from './cell-graphs.ts'

export { modifyRowGraph, modifyColGraph, deleteRowGraph, deleteColGraph } from './row-col-graphs.ts'

export { modifyFormGraph } from './form-graphs.ts'

export { modifyPageGraph } from './page-graphs.ts'

/** 统一报表主图（顶层唯一入口，read + write 自由混排） */
export { buildUnifiedReportGraph } from './unit-report-graph.ts'
