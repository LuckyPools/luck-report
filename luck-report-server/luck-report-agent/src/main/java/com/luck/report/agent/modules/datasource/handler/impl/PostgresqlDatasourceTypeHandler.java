package com.luck.report.agent.modules.datasource.handler.impl;

import com.luck.report.agent.modules.datasource.domain.entity.Datasource;
import com.luck.report.agent.modules.datasource.domain.enums.DatasourceTypeEnum;
import com.luck.report.agent.modules.datasource.handler.DatasourceTypeHandler;
import org.springframework.stereotype.Component;

/**
 * PostgreSQL数据源类型处理器
 * 负责PostgreSQL类型的JDBC URL生成和Schema提取
 * PostgreSQL的databaseName格式为 "数据库名|Schema名"
 *
 * @author luck
 */
@Component
public class PostgresqlDatasourceTypeHandler implements DatasourceTypeHandler {

    @Override
    public String typeName() {
        return DatasourceTypeEnum.POSTGRESQL.getTypeName();
    }

    @Override
    public String buildConnectionUrl(Datasource datasource) {
        if (!hasRequiredConnectionFields(datasource)) {
            return datasource.getConnectionUrl();
        }
        // databaseName格式: "数据库名|Schema名"，取前半部分作为JDBC URL中的数据库名
        String dbName = datasource.getDatabaseName();
        if (dbName != null && dbName.contains("|")) {
            dbName = dbName.split("\\|")[0];
        }
        return String.format("jdbc:postgresql://%s:%d/%s?currentSchema=%s",
                datasource.getHost(), datasource.getPort(), dbName, extractSchemaName(datasource));
    }

    @Override
    public String extractSchemaName(Datasource datasource) {
        String dbName = datasource.getDatabaseName();
        if (dbName != null && dbName.contains("|")) {
            return dbName.split("\\|")[1];
        }
        return "public";
    }
}
