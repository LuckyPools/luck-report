package com.luck.agent.domain.dto;

import lombok.Data;

/**
 * 单个数据源配置项
 * 对应 application.yml 中一个数据源的完整连接信息
 *
 * @author luck
 */
@Data
public class DataSourceItem {

    /** JDBC 连接地址 */
    private String url;

    /** 数据库用户名 */
    private String username;

    /** 数据库密码 */
    private String password;

    /** JDBC 驱动类名 */
    private String driverClassName;

    /** 连接池最大连接数 */
    private int maximumPoolSize = 10;
}
