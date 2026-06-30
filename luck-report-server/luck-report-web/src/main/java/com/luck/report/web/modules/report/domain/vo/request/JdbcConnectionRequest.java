package com.luck.report.web.modules.report.domain.vo.request;

/**
 * JDBC 数据库连接参数请求 VO。
 * <p>
 * 用于数据源相关接口（{@code buildDatabaseTables}、{@code buildFields}、{@code previewData}），
 * 包含连接数据库所需的基本信息（type + 连接信息）。
 *
 * @author luck-report
 * @since 1.0.0
 */
public class JdbcConnectionRequest {

    /**
     * 数据源类型：
     * <ul>
     *     <li>{@code jdbc}：JDBC 直连，需要 username/password/driver/url</li>
     *     <li>其他：内置数据源名称，通过 {@link #name} 指定</li>
     * </ul>
     */
    private String type;

    /**
     * JDBC 连接用户名（type=jdbc 时使用）。
     */
    private String username;

    /**
     * JDBC 连接密码（type=jdbc 时使用）。
     */
    private String password;

    /**
     * JDBC 驱动类名（type=jdbc 时使用）。
     */
    private String driver;

    /**
     * JDBC 连接 URL（type=jdbc 时使用）。
     */
    private String url;

    /**
     * 内置数据源名称（type≠jdbc 时使用）。
     */
    private String name;

    public JdbcConnectionRequest() {
    }

    public JdbcConnectionRequest(String type, String username, String password, String driver, String url, String name) {
        this.type = type;
        this.username = username;
        this.password = password;
        this.driver = driver;
        this.url = url;
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getDriver() {
        return driver;
    }

    public void setDriver(String driver) {
        this.driver = driver;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
