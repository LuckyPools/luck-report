package com.luck.report.web.domain.vo.request;

/**
 * JDBC数据库连接参数基类
 * type=jdbc时使用username/password/driver/url，type!=jdbc时使用name指定内置数据源
 */
public class JdbcConnectionRequest {

    /** 连接类型：jdbc 或内置数据源标识 */
    private String type;
    /** JDBC用户名 */
    private String username;
    /** JDBC密码 */
    private String password;
    /** JDBC驱动类名 */
    private String driver;
    /** JDBC连接URL */
    private String url;
    /** 内置数据源名称 */
    private String name;

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
