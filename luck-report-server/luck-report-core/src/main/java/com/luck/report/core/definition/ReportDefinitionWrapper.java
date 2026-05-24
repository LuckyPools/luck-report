
package com.luck.report.core.definition;

import java.io.Serializable;

/**
 * 报表定义包装类，用于缓存时标识报表定义是否已构建父子引用关系。
 *
 * @author luckyPools
 * @since 2026年05月23日
 */
public class ReportDefinitionWrapper implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 是否已构建父子引用关系
     * 注意：此字段没有 getter/setter，JSON 序列化时会被忽略
     */
    private boolean built;

    /**
     * 报表定义对象
     */
    private ReportDefinition reportDefinition;

    /**
     * 默认构造函数
     */
    public ReportDefinitionWrapper() {
    }

    /**
     * 构造函数
     *
     * @param reportDefinition 报表定义对象，不能为空
     */
    public ReportDefinitionWrapper(ReportDefinition reportDefinition) {
        this.reportDefinition = reportDefinition;
    }

    /**
     * 获取报表定义对象
     *
     * @return 报表定义对象
     */
    public ReportDefinition getReportDefinition() {
        return reportDefinition;
    }

    /**
     * 设置报表定义对象
     *
     * @param reportDefinition 报表定义对象，不能为空
     */
    public void setReportDefinition(ReportDefinition reportDefinition) {
        this.reportDefinition = reportDefinition;
    }

    /**
     * 标记为已构建
     */
    public void markBuilt() {
        this.built = true;
    }

    /**
     * 检查是否已构建
     *
     * @return true 表示已构建，false 表示未构建
     */
    public boolean checkNotBuilt() {
        return !built;
    }
}
