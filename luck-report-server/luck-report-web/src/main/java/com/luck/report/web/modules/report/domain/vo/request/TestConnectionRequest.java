package com.luck.report.web.modules.report.domain.vo.request;

/**
 * 数据库连接测试请求 VO。
 * <p>
 * 用于 {@code /datasource/testConnection} 接口，包含 JDBC 直连所需的全部参数。
 *
 * @author luck-report
 * @since 1.0.0
 */
public class TestConnectionRequest {

    /**
     * JDBC 连接用户名。
     */
    private String username;

    /**
     * JDBC 连接密码。
     */
    private String password;

    /**
     * JDBC 驱动类名。
     */
    private String driver;

    /**
     * JDBC 连接 URL。
     */
    private String url;

    public TestConnectionRequest() {
    }

    public TestConnectionRequest(String username, String password, String driver, String url) {
        this.username = username;
        this.password = password;
        this.driver = driver;
        this.url = url;
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
}
