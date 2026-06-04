package com.luck.agent.modules.datasource.handler;

import com.luck.agent.modules.datasource.domain.entity.Datasource;
import org.springframework.util.StringUtils;

/**
 * 数据源类型处理器接口
 * 统一处理不同数据库类型的连接URL生成、Schema提取等逻辑
 *
 * @author luck
 */
public interface DatasourceTypeHandler {

    /**
     * 获取处理器对应的数据源类型标识
     *
     * @return 类型标识名，如 "mysql"、"postgresql"
     */
    String typeName();

    /**
     * 判断是否支持指定类型
     *
     * @param type 数据源类型
     * @return 是否支持
     */
    default boolean supports(String type) {
        return typeName().equalsIgnoreCase(type);
    }

    /**
     * 检查必要连接字段是否存在
     *
     * @param datasource 数据源实体
     * @return 是否具备必要字段
     */
    default boolean hasRequiredConnectionFields(Datasource datasource) {
        return datasource.getHost() != null && datasource.getPort() != null
                && datasource.getDatabaseName() != null;
    }

    /**
     * 构建JDBC连接URL
     * 子类需根据数据库类型实现具体的URL拼接逻辑
     *
     * @param datasource 数据源实体
     * @return JDBC连接URL
     */
    String buildConnectionUrl(Datasource datasource);

    /**
     * 解析连接URL
     * 如果已有connectionUrl则直接返回，否则调用buildConnectionUrl生成
     *
     * @param datasource 数据源实体
     * @return JDBC连接URL
     */
    default String resolveConnectionUrl(Datasource datasource) {
        String existing = datasource.getConnectionUrl();
        if (StringUtils.hasText(existing)) {
            return existing;
        }
        return buildConnectionUrl(datasource);
    }

    /**
     * 提取Schema名称
     * 默认返回databaseName，PostgreSQL/Oracle等需重写
     *
     * @param datasource 数据源实体
     * @return Schema名称
     */
    default String extractSchemaName(Datasource datasource) {
        return datasource.getDatabaseName();
    }
}
