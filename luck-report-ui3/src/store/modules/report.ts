/**
 * 报表设计器状态管理（Pinia）
 *
 * 改造说明：
 * - 原 Vuex 3 模块（state/mutations/actions/getters + namespaced）合并为单一 Pinia store
 * - 原 mutations 全部并入 actions，对外暴露为小驼峰方法；this 指向当前 store
 * - 原 actions 仅做 commit 转发，已合并到新 actions，行为保持不变
 * - 移除 `Vue.set` 调用：Pinia 的 state 基于 reactive，新增对象属性 / 数组 push 均会被追踪
 * - 对 views 暴露的 API：import { useReportStore } from '@/store/modules/report'；const report = useReportStore()；report.contextAddCell(cell)
 */
import { defineStore, type Store } from 'pinia'
import type {
    ReportCell,
    ReportContext,
    ReportDatasource,
    ReportDataset,
    ReportDef,
    ReportPaperLike,
    ReportRowDef,
    ReportColumnDef
} from '@/types/report-def'

/**
 * contextUpdateProperty / contextSetCell / contextDeleteCell 这类需要多字段的 action 入参类型
 * - 字段全部可选，由调用方按需传入
 */
export interface ContextUpdatePropertyPayload {
    /** context 上的属性名（用于 this.context[property] = value 写入） */
    property: string
    /** 任意可序列化值 */
    value: unknown
}

export interface ContextSetCellPayload {
    rowIndex: number
    colIndex: number
    cell: ReportCell
}

export interface ContextDeleteCellPayload {
    rowNumber: number
    columnNumber: number
}

export interface ContextAddRowHeaderPayload {
    row: number
    band: string
}

export interface ContextAdjustInsertRowHeadersPayload {
    row: number
}

export interface ContextAdjustDelRowHeadersPayload {
    row: number
}

export interface ContextUpdateDatasourcePayload {
    name: string
    datasource: ReportDatasource
}

export interface ContextAddDatasetPayload {
    datasourceName: string
    dataset: ReportDataset
}

export interface ContextUpdateDatasetPayload {
    datasourceName: string
    datasetName: string
    dataset: ReportDataset
}

export interface ContextRemoveDatasetPayload {
    datasourceName: string
    datasetName: string
}

/**
 * 报表设计器 store state
 * - context: 设计器全局上下文，可能为空
 * - 其余字段均为 UI 状态
 */
export interface ReportStoreState {
    context: ReportContext | null
    fileName: string
    disableSaveBtn: boolean
    isSaved: boolean
    showPrintLine: boolean
    isPrintLineRefresh: boolean
    isCellUpdate: boolean
    isDatasourcePanelUpdate: boolean
}

/**
 * 报表设计器 store 完整类型
 * - 通过 Store<...> 让 Pinia 自动推断 actions/getters 的 this 上下文
 * - 同时导出供 augment.d.ts 等场景直接引用
 */
export type ReportStore = Store<
    'report',
    ReportStoreState,
    Record<string, never>, // getters 由 setup 风格以下方 _Getters 表达；当前为 options 写法
    Record<string, never>
> & {
    // ============ Context 操作 ============
    setContext(context: ReportContext | null): void
    clearContext(): void
    contextUpdateReportDef(reportDef: Partial<ReportDef>): void
    contextUpdateProperty(payload: ContextUpdatePropertyPayload): void

    // ============ CellsMap 操作 ============
    contextAddCell(cell: ReportCell): void
    contextRemoveCell(cell: ReportCell): void
    contextSetCell(payload: ContextSetCellPayload): void
    contextDeleteCell(payload: ContextDeleteCellPayload): void

    // ============ RowHeaders 操作 ============
    contextAddRowHeader(payload: ContextAddRowHeaderPayload): void
    contextAdjustInsertRowHeaders(payload: ContextAdjustInsertRowHeadersPayload): void
    contextAdjustDelRowHeaders(payload: ContextAdjustDelRowHeadersPayload): void

    // ============ Datasource 操作 ============
    contextSetDatasources(datasources: ReportDatasource[]): void
    contextAddDatasource(datasource: ReportDatasource): void
    contextUpdateDatasource(payload: ContextUpdateDatasourcePayload): void
    contextRemoveDatasource(name: string): void

    // ============ Dataset 操作 ============
    contextAddDataset(payload: ContextAddDatasetPayload): void
    contextUpdateDataset(payload: ContextUpdateDatasetPayload): void
    contextRemoveDataset(payload: ContextRemoveDatasetPayload): void

    // ============ SearchForm 操作 ============
    contextSetSearchForm(searchForm: ReportContext['reportDef']['searchForm']): void

    // ============ Paper / Header / Footer 操作 ============
    contextUpdatePaper(paper: ReportPaperLike): void
    contextUpdateHeader(header: ReportPaperLike): void
    contextUpdateFooter(footer: ReportPaperLike): void

    // ============ Row / Column 操作 ============
    contextSetRows(rows: ReportRowDef[]): void
    contextSetColumns(columns: ReportColumnDef[]): void

    // ============ UI 状态操作 ============
    setFileName(fileName: string): void
    setDisableSaveBtn(disable: boolean): void
    setIsSaved(isSaved: boolean): void
    setIsPrintLineRefresh(shouldRefresh: boolean): void
    setShowPrintLine(showPrintLine: boolean): void
    setCellUpdate(isCellUpdate: boolean): void
    triggerCellUpdate(): void
    setDatasourcePanelUpdate(isDatasourcePanelUpdate: boolean): void
    triggerDatasourcePanelUpdate(): void
    /** 批量执行 context 操作（接收一个回调，回调里直接操作 context） */
    contextBatchExecute(operationFn: (context: ReportContext) => void): void

    // ============ 参数化 getter（仅在类型中体现，运行时 Pinia options 会展开为独立 getter） ============
    getDatasources(name?: string): ReportDatasource | ReportDatasource[] | null
    getDatasets(datasourceName?: string, datasetName?: string): ReportDataset | ReportDataset[] | Array<{ datasourceName: string; dataset: ReportDataset }> | null
    getRows(rowNumber?: number): ReportRowDef | ReportRowDef[] | null
    getColumns(columnNumber?: number): ReportColumnDef | ReportColumnDef[] | null
}

/**
 * 报表设计器 store
 * - state 包含设计器全局上下文（context）以及若干 UI 状态（文件名、保存按钮、保存状态、打印线等）
 * - actions 既包含纯 setter，也包含对 context 内部 cellsMap / rowHeaders / datasources / datasets / paper / header / footer 等的复合操作
 * - getters 用于按需查询 context 内的数据（datasources、datasets、rows、columns、searchForm 等）
 */
export const useReportStore = defineStore('report', {
    // state 必须是返回初始状态的函数，避免多个 store 实例共享同一份引用
    state: (): ReportStoreState => ({
        // 设计器全局上下文
        context: null,
        // 报表名称
        fileName: '',
        // 禁用保存按钮
        disableSaveBtn: true,
        // 报表是否已保存
        isSaved: false,
        // 打印线是否显示
        showPrintLine: true,
        // 打印线是否需要刷新
        isPrintLineRefresh: false,
        // 单元格是否需要更新
        isCellUpdate: false,
        // 数据源面板是否需要更新
        isDatasourcePanelUpdate: false
    }),

    getters: {
        // 获取上下文
        getContext: (state): ReportContext | null => state.context,
        // 检查是否有上下文
        hasContext: (state): boolean => !!state.context,
        // 获取文件名
        getFileName: (state): string => state.fileName,
        // 获取保存按钮状态
        getSaveBtnDisable: (state): boolean => state.disableSaveBtn,
        // 获取报表保存状态
        getSaveStatus: (state): boolean => state.isSaved,
        // 打印线是否需要刷新
        getPrintLineShouldRefresh: (state): boolean => state.isPrintLineRefresh,
        // 获取打印线显示状态
        getShowPrintLine: (state): boolean => state.showPrintLine,
        // 获取单元格更新状态
        getIsCellUpdate: (state): boolean => state.isCellUpdate,
        // 获取数据源面板更新状态
        getIsDatasourcePanelUpdate: (state): boolean => state.isDatasourcePanelUpdate,

        // ============ Datasource Getters ============

        /**
         * 获取数据源
         * @param {string} [name] - 数据源名称，不传则返回全部
         * @returns {ReportDatasource | ReportDatasource[] | null}
         */
        getDatasources: (state) => (name?: string): ReportDatasource | ReportDatasource[] | null => {
            if (!state.context || !state.context.reportDef || !state.context.reportDef.datasources) {
                return name ? null : []
            }
            if (name) {
                return state.context.reportDef.datasources.find((ds) => ds.name === name) || null
            }
            return state.context.reportDef.datasources
        },

        // ============ Dataset Getters ============

        /**
         * 获取数据集
         * @param {string} [datasourceName] - 数据源名称，不传则返回所有数据源下的数据集
         * @param {string} [datasetName] - 数据集名称，需配合 datasourceName 使用
         * @returns {ReportDataset | ReportDataset[] | Array<{datasourceName: string, dataset: ReportDataset}> | null}
         */
        getDatasets: (state) =>
            (datasourceName?: string, datasetName?: string):
                | ReportDataset
                | ReportDataset[]
                | Array<{ datasourceName: string; dataset: ReportDataset }>
                | null => {
                if (!state.context || !state.context.reportDef || !state.context.reportDef.datasources) {
                    return (datasourceName || datasetName) ? null : []
                }
                if (datasourceName) {
                    const ds = state.context.reportDef.datasources.find((d) => d.name === datasourceName)
                    if (!ds || !ds.datasets) {
                        return datasetName ? null : []
                    }
                    if (datasetName) {
                        return ds.datasets.find((dt) => dt.name === datasetName) || null
                    }
                    return ds.datasets
                }
                const result: Array<{ datasourceName: string; dataset: ReportDataset }> = []
                for (const ds of state.context.reportDef.datasources) {
                    if (ds.datasets) {
                        if (datasetName) {
                            const found = ds.datasets.find((dt) => dt.name === datasetName)
                            if (found) {
                                result.push({ datasourceName: ds.name, dataset: found })
                            }
                        } else {
                            for (const dt of ds.datasets) {
                                result.push({ datasourceName: ds.name, dataset: dt })
                            }
                        }
                    }
                }
                return result
            },

        // ============ SearchForm Getters ============

        /** 获取表单设计对象（可能为 undefined：未配置时） */
        getSearchForm: (state): ReportContext['reportDef']['searchForm'] => {
            if (!state.context || !state.context.reportDef) return undefined
            return state.context.reportDef.searchForm
        },

        // ============ Paper Getters ============

        /** 获取页面配置 */
        getPaperConfig: (state): ReportPaperLike | null => {
            if (!state.context || !state.context.reportDef) return null
            return state.context.reportDef.paper || null
        },

        /** 获取页眉配置 */
        getHeaderConfig: (state): ReportPaperLike | null => {
            if (!state.context || !state.context.reportDef) return null
            return state.context.reportDef.header || null
        },

        /** 获取页脚配置 */
        getFooterConfig: (state): ReportPaperLike | null => {
            if (!state.context || !state.context.reportDef) return null
            return state.context.reportDef.footer || null
        },

        // ============ Row Getters ============

        /**
         * 获取表格行
         * @param {number} [rowNumber] - 行号，不传则返回全部
         * @returns {ReportRowDef | ReportRowDef[] | null}
         */
        getRows: (state) => (rowNumber?: number): ReportRowDef | ReportRowDef[] | null => {
            if (!state.context || !state.context.reportDef || !state.context.reportDef.rows) {
                return rowNumber ? null : []
            }
            if (rowNumber !== undefined) {
                return state.context.reportDef.rows.find((r) => r.rowNumber === rowNumber) || null
            }
            return state.context.reportDef.rows
        },

        // ============ Column Getters ============

        /**
         * 获取表格列
         * @param {number} [columnNumber] - 列号，不传则返回全部
         * @returns {ReportColumnDef | ReportColumnDef[] | null}
         */
        getColumns: (state) => (columnNumber?: number): ReportColumnDef | ReportColumnDef[] | null => {
            if (!state.context || !state.context.reportDef || !state.context.reportDef.columns) {
                return columnNumber ? null : []
            }
            if (columnNumber !== undefined) {
                return state.context.reportDef.columns.find((c) => c.columnNumber === columnNumber) || null
            }
            return state.context.reportDef.columns
        }
    },

    actions: {
        // ============ Context 操作 ============

        /**
         * 设置设计器全局上下文
         * @param {ReportContext | null} context - 设计器上下文，传入 null 等价于清空
         */
        setContext(context: ReportContext | null) {
            this.context = context
        },

        /** 清除上下文 */
        clearContext() {
            this.context = null
        },

        /**
         * 更新 context.reportDef
         * @param {Partial<ReportDef>} reportDef - 报表定义属性（合并更新）
         */
        contextUpdateReportDef(reportDef: Partial<ReportDef>) {
            if (this.context) {
                Object.assign(this.context.reportDef, reportDef)
            }
        },

        /**
         * 更新 context 的任意属性（用于扩展）
         * @param {ContextUpdatePropertyPayload} payload - 包含 property/value
         */
        contextUpdateProperty(payload: ContextUpdatePropertyPayload) {
            if (this.context) {
                // 显式断言为 any，避免索引签名对 unknown 类型不可赋值的限制
                ;(this.context as Record<string, unknown>)[payload.property] = payload.value
            }
        },

        // ============ CellsMap 操作 ============

        /**
         * 添加单元格
         * @param {ReportCell} cell - 单元格定义（必须包含 rowNumber、columnNumber）
         */
        contextAddCell(cell: ReportCell) {
            if (this.context && this.context.cellsMap) {
                const key = `${cell.rowNumber},${cell.columnNumber}`
                this.context.cellsMap.set(key, cell)
            }
        },

        /**
         * 移除单元格
         * @param {ReportCell} cell - 单元格定义
         */
        contextRemoveCell(cell: ReportCell) {
            if (this.context && this.context.cellsMap) {
                const key = `${cell.rowNumber},${cell.columnNumber}`
                this.context.cellsMap.delete(key)
            }
        },

        /**
         * 设置单元格（按行列号）
         * @param {ContextSetCellPayload} payload - 包含 rowIndex/colIndex/cell
         */
        contextSetCell(payload: ContextSetCellPayload) {
            if (this.context && this.context.cellsMap) {
                const key = `${payload.rowIndex},${payload.colIndex}`
                this.context.cellsMap.set(key, payload.cell)
            }
        },

        /**
         * 删除单元格（按行列号）
         * @param {ContextDeleteCellPayload} payload - 包含 rowNumber/columnNumber
         */
        contextDeleteCell(payload: ContextDeleteCellPayload) {
            if (this.context && this.context.cellsMap) {
                const key = `${payload.rowNumber},${payload.columnNumber}`
                this.context.cellsMap.delete(key)
            }
        },

        // ============ RowHeaders 操作 ============

        /**
         * 添加行头（已存在则更新 band）
         * @param {ContextAddRowHeaderPayload} payload - row/band
         */
        contextAddRowHeader(payload: ContextAddRowHeaderPayload) {
            if (this.context && this.context.rowHeaders) {
                const target = this.context.rowHeaders.find((h) => h.rowNumber === payload.row)
                if (target) {
                    target.band = payload.band
                } else {
                    // Pinia 默认 reactive，数组 push 即可追踪
                    this.context.rowHeaders.push({ band: payload.band, rowNumber: payload.row })
                }
            }
        },

        /**
         * 调整插入行头（行号 >= row 的全部 +1）
         * @param {ContextAdjustInsertRowHeadersPayload} payload - row
         */
        contextAdjustInsertRowHeaders(payload: ContextAdjustInsertRowHeadersPayload) {
            if (this.context && this.context.rowHeaders) {
                for (const header of this.context.rowHeaders) {
                    if (header.rowNumber >= payload.row) {
                        header.rowNumber += 1
                    }
                }
            }
        },

        /**
         * 调整删除行头（移除匹配行号的头）
         * @param {ContextAdjustDelRowHeadersPayload} payload - row
         */
        contextAdjustDelRowHeaders(payload: ContextAdjustDelRowHeadersPayload) {
            if (this.context && this.context.rowHeaders) {
                const idx = this.context.rowHeaders.findIndex((h) => h.rowNumber === payload.row)
                if (idx > -1) {
                    this.context.rowHeaders.splice(idx, 1)
                }
            }
        },

        // ============ Datasource 操作 ============

        /**
         * 设置全部数据源
         * @param {ReportDatasource[]} datasources - 数据源数组
         */
        contextSetDatasources(datasources: ReportDatasource[]) {
            if (this.context && this.context.reportDef) {
                this.context.reportDef.datasources = datasources
            }
        },

        /**
         * 添加数据源
         * @param {ReportDatasource} datasource - 数据源定义对象
         */
        contextAddDatasource(datasource: ReportDatasource) {
            if (this.context && this.context.reportDef && this.context.reportDef.datasources) {
                // 提前确保 datasets 存在，避免后续 push 时类型为 undefined
                if (!datasource.datasets) {
                    datasource.datasets = []
                }
                this.context.reportDef.datasources.push(datasource)
            }
        },

        /**
         * 更新数据源（按 name 匹配替换）
         * @param {ContextUpdateDatasourcePayload} payload - name/datasource
         */
        contextUpdateDatasource(payload: ContextUpdateDatasourcePayload) {
            if (this.context && this.context.reportDef && this.context.reportDef.datasources) {
                const index = this.context.reportDef.datasources.findIndex(
                    (ds) => ds.name === payload.name
                )
                if (index > -1) {
                    this.context.reportDef.datasources.splice(index, 1, payload.datasource)
                }
            }
        },

        /**
         * 删除数据源（按 name 匹配）
         * @param {string} name - 目标数据源名称
         */
        contextRemoveDatasource(name: string) {
            if (this.context && this.context.reportDef && this.context.reportDef.datasources) {
                const index = this.context.reportDef.datasources.findIndex((ds) => ds.name === name)
                if (index > -1) {
                    this.context.reportDef.datasources.splice(index, 1)
                }
            }
        },

        // ============ Dataset 操作 ============

        /**
         * 添加数据集到指定数据源
         * @param {ContextAddDatasetPayload} payload - datasourceName/dataset
         */
        contextAddDataset(payload: ContextAddDatasetPayload) {
            if (this.context && this.context.reportDef && this.context.reportDef.datasources) {
                const ds = this.context.reportDef.datasources.find(
                    (d) => d.name === payload.datasourceName
                )
                if (ds) {
                    // Pinia reactive 下直接赋值即可追踪，无需 Vue.set
                    if (!ds.datasets) {
                        ds.datasets = []
                    }
                    ds.datasets.push(payload.dataset)
                }
            }
        },

        /**
         * 更新数据集
         * @param {ContextUpdateDatasetPayload} payload - datasourceName/datasetName/dataset
         */
        contextUpdateDataset(payload: ContextUpdateDatasetPayload) {
            if (this.context && this.context.reportDef && this.context.reportDef.datasources) {
                const ds = this.context.reportDef.datasources.find(
                    (d) => d.name === payload.datasourceName
                )
                if (ds && ds.datasets) {
                    const index = ds.datasets.findIndex((dt) => dt.name === payload.datasetName)
                    if (index > -1) {
                        ds.datasets.splice(index, 1, payload.dataset)
                    }
                }
            }
        },

        /**
         * 删除数据集
         * @param {ContextRemoveDatasetPayload} payload - datasourceName/datasetName
         */
        contextRemoveDataset(payload: ContextRemoveDatasetPayload) {
            if (this.context && this.context.reportDef && this.context.reportDef.datasources) {
                const ds = this.context.reportDef.datasources.find(
                    (d) => d.name === payload.datasourceName
                )
                if (ds && ds.datasets) {
                    const index = ds.datasets.findIndex((dt) => dt.name === payload.datasetName)
                    if (index > -1) {
                        ds.datasets.splice(index, 1)
                    }
                }
            }
        },

        // ============ SearchForm 操作 ============

        /**
         * 设置表单设计数据（整体替换）
         * @param {ReportContext['reportDef']['searchForm']} searchForm - 表单设计对象
         */
        contextSetSearchForm(searchForm: ReportContext['reportDef']['searchForm']) {
            if (this.context && this.context.reportDef) {
                this.context.reportDef.searchForm = searchForm || undefined
            }
        },

        // ============ Paper / Header / Footer 操作 ============

        /**
         * 更新页面配置（合并更新）
         * @param {ReportPaperLike} paper - 要合并的页面配置属性
         */
        contextUpdatePaper(paper: ReportPaperLike) {
            if (this.context && this.context.reportDef && this.context.reportDef.paper) {
                Object.assign(this.context.reportDef.paper, paper)
            }
        },

        /**
         * 更新页眉配置（合并更新）
         * @param {ReportPaperLike} header - 要合并的页眉配置属性
         */
        contextUpdateHeader(header: ReportPaperLike) {
            if (this.context && this.context.reportDef && this.context.reportDef.header) {
                Object.assign(this.context.reportDef.header, header)
            }
        },

        /**
         * 更新页脚配置（合并更新）
         * @param {ReportPaperLike} footer - 要合并的页脚配置属性
         */
        contextUpdateFooter(footer: ReportPaperLike) {
            if (this.context && this.context.reportDef && this.context.reportDef.footer) {
                Object.assign(this.context.reportDef.footer, footer)
            }
        },

        // ============ Row / Column 操作 ============

        /**
         * 设置全部行数据
         * @param {ReportRowDef[]} rows - 行定义数组
         */
        contextSetRows(rows: ReportRowDef[]) {
            if (this.context && this.context.reportDef) {
                this.context.reportDef.rows = rows
            }
        },

        /**
         * 设置全部列数据
         * @param {ReportColumnDef[]} columns - 列定义数组
         */
        contextSetColumns(columns: ReportColumnDef[]) {
            if (this.context && this.context.reportDef) {
                this.context.reportDef.columns = columns
            }
        },

        // ============ UI 状态操作 ============

        /**
         * 设置文件名（自动去除 .ureport.xml 后缀并解码）
         * @param {string} fileName - 原始文件名
         */
        setFileName(fileName: string) {
            const suffix = '.ureport.xml'
            const pos = fileName.indexOf(suffix)
            if (pos > -1) {
                fileName = fileName.substring(0, pos)
            }
            this.fileName = decodeURI(fileName)
        },

        /**
         * 设置保存按钮禁用状态
         * @param {boolean} disable - 是否禁用
         */
        setDisableSaveBtn(disable: boolean) {
            this.disableSaveBtn = disable
        },

        /**
         * 设置报表保存状态
         * @param {boolean} isSaved - 是否已保存
         */
        setIsSaved(isSaved: boolean) {
            this.isSaved = isSaved
        },

        /**
         * 设置打印线刷新标记
         * @param {boolean} shouldRefresh - 是否需要刷新
         */
        setIsPrintLineRefresh(shouldRefresh: boolean) {
            this.isPrintLineRefresh = shouldRefresh
        },

        /**
         * 设置打印线显示状态
         * @param {boolean} showPrintLine - 是否显示
         */
        setShowPrintLine(showPrintLine: boolean) {
            this.showPrintLine = showPrintLine
        },

        /**
         * 设置单元格更新标记
         * @param {boolean} isCellUpdate - 是否需要更新
         */
        setCellUpdate(isCellUpdate: boolean) {
            this.isCellUpdate = isCellUpdate
        },

        /** 触发单元格更新（置 true，编辑器监听后会自行重置为 false） */
        triggerCellUpdate() {
            this.isCellUpdate = true
        },

        /**
         * 设置数据源面板更新标记
         * @param {boolean} isDatasourcePanelUpdate - 是否需要更新
         */
        setDatasourcePanelUpdate(isDatasourcePanelUpdate: boolean) {
            this.isDatasourcePanelUpdate = isDatasourcePanelUpdate
        },

        /** 触发数据源面板更新（置 true，面板监听后会自行重置为 false） */
        triggerDatasourcePanelUpdate() {
            this.isDatasourcePanelUpdate = true
        },

        /**
         * 批量执行 context 操作
         * - 在一个同步操作里对 context 内部 cellsMap / rowHeaders / datasources 等做任意修改
         * - 由于 Pinia 的 state 是 reactive，无需 commit/事务，直接调用回调即可
         * @param {(context: ReportContext) => void} operationFn - 操作函数，接收当前 context
         */
        contextBatchExecute(operationFn: (context: ReportContext) => void) {
            if (this.context) {
                operationFn(this.context)
            }
        }
    }
})
