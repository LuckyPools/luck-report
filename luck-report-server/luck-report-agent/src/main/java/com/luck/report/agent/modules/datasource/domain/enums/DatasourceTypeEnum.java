package com.luck.report.agent.modules.datasource.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 数据源类型枚举
 * 定义支持的数据源类型及其JDBC驱动和方言信息
 *
 * @author luck
 */
@Getter
@AllArgsConstructor
public enum DatasourceTypeEnum {

    MYSQL(1, "mysql", "MySQL", "com.mysql.cj.jdbc.Driver"),
    POSTGRESQL(2, "postgresql", "PostgreSQL", "org.postgresql.Driver"),
    DAMENG(5, "dameng", "达梦", "dm.jdbc.driver.DmDriver"),
    SQL_SERVER(6, "sqlserver", "SQL Server", "com.microsoft.sqlserver.jdbc.SQLServerDriver"),
    ORACLE(7, "oracle", "Oracle", "oracle.jdbc.OracleDriver"),
    HIVE(8, "hive", "Hive", "org.apache.hive.jdbc.HiveDriver");

    /** 类型编码 */
    private final Integer code;

    /** 类型标识名（用于前后端交互） */
    private final String typeName;

    /** 显示名称 */
    private final String displayName;

    /** JDBC驱动类名 */
    private final String driverClassName;

    /**
     * 根据typeName获取枚举
     *
     * @param typeName 类型标识名
     * @return 对应的枚举，未找到返回null
     */
    public static DatasourceTypeEnum fromTypeName(String typeName) {
        for (DatasourceTypeEnum type : values()) {
            if (type.getTypeName().equalsIgnoreCase(typeName)) {
                return type;
            }
        }
        return null;
    }

    /**
     * 根据typeName获取驱动类名
     *
     * @param typeName 类型标识名
     * @return 驱动类名，未找到返回null
     */
    public static String getDriverByTypeName(String typeName) {
        DatasourceTypeEnum typeEnum = fromTypeName(typeName);
        return typeEnum != null ? typeEnum.getDriverClassName() : null;
    }
}
