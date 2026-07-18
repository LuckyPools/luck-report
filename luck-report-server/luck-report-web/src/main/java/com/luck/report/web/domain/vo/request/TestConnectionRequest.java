package com.luck.report.web.domain.vo.request;

/**
 * 测试数据库连接请求
 */
public class TestConnectionRequest {

    /** JDBC用户名 */
    private String username;
    /** JDBC密码 */
    private String password;
    /** JDBC驱动类名 */
    private String driver;
    /** JDBC连接URL */
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
