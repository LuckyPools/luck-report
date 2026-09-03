package com.luck.report.web.domain.vo.request;

import java.util.List;

/**
 * 查询表单选项加载请求：按报表文件 + 数据集引用列表批量执行数据集生成选项
 *
 * @author luckyPools
 * @since 2026年08月31日
 */
public class SearchFormOptionsRequest {

    /** 报表文件路径 */
    private String reportPath;

    /** 运行模式，可为空；为 preview 时从设计器预览缓存加载报表定义 */
    private String mode;

    /** 数据集引用列表 */
    private List<DatasetRef> datasets;

    /**
     * 默认无参构造器
     */
    public SearchFormOptionsRequest() {}

    /**
     * 数据集选项绑定：单个选项数据集的引用与字段映射
     *
     * @author luckyPools
     * @since 2026年08月31日
     */

    public String getReportPath() {
        return reportPath;
    }

    public void setReportPath(String reportPath) {
        this.reportPath = reportPath;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public List<DatasetRef> getDatasets() {
        return datasets;
    }

    public void setDatasets(List<DatasetRef> datasets) {
        this.datasets = datasets;
    }
}
