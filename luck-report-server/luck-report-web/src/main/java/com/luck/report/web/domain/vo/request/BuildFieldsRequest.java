package com.luck.report.web.domain.vo.request;

/**
 * 构建字段请求，继承JDBC连接参数，额外含SQL和参数信息
 */
public class BuildFieldsRequest extends JdbcConnectionRequest {

    /** SQL语句 */
    private String sql;
    /** 参数JSON字符串 */
    private String parameters;

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
