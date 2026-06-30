package com.luck.report.web.modules.report.domain.vo.request;

/**
 * 数据预览请求 VO。
 * <p>
 * 继承自 {@link JdbcConnectionRequest}，用于 {@code /datasource/previewData} 接口。
 *
 * @author luck-report
 * @since 1.0.0
 */
public class PreviewDataRequest extends JdbcConnectionRequest {

    /**
     * 待执行的 SQL 语句或存储过程调用语句。
     */
    private String sql;

    /**
     * SQL 参数 JSON 字符串，格式由前端定义（List&lt;Map&lt;name,type,defaultValue&gt;&gt;）。
     */
    private String parameters;

    public PreviewDataRequest() {
    }

    public PreviewDataRequest(String sql, String parameters) {
        this.sql = sql;
        this.parameters = parameters;
    }

    public String getSql() {
        return sql;
    }

    public void setSql(String sql) {
        this.sql = sql;
    }

    public String getParameters() {
        return parameters;
    }

    public void setParameters(String parameters) {
        this.parameters = parameters;
    }
}
