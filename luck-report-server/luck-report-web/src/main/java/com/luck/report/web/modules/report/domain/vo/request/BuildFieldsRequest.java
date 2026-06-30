package com.luck.report.web.modules.report.domain.vo.request;

/**
 * 构建数据集字段请求 VO。
 * <p>
 * 继承自 {@link JdbcConnectionRequest}，用于 {@code /datasource/buildFields} 接口。
 *
 * @author luck-report
 * @since 1.0.0
 */
public class BuildFieldsRequest extends JdbcConnectionRequest {

    /**
     * 待解析的 SQL 语句或存储过程调用语句。
     */
    private String sql;

    /**
     * SQL 参数 JSON 字符串，格式由前端定义（List&lt;Map&lt;name,type,defaultValue&gt;&gt;）。
     */
    private String parameters;

    public BuildFieldsRequest() {
    }

    public BuildFieldsRequest(String sql, String parameters) {
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
