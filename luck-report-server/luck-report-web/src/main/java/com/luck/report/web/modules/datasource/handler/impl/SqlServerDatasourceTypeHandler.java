package com.luck.report.web.modules.datasource.handler.impl;

import com.luck.report.web.modules.datasource.domain.entity.Datasource;
import com.luck.report.web.modules.datasource.domain.enums.DatasourceTypeEnum;
import com.luck.report.web.modules.datasource.handler.DatasourceTypeHandler;
import org.springframework.stereotype.Component;

/**
 * SQL Server数据源类型处理器
 *
 * @author luck
 */
@Component("bean.sqlServerDatasourceTypeHandler")
public class SqlServerDatasourceTypeHandler implements DatasourceTypeHandler {

    @Override
    public String typeName() {
        return DatasourceTypeEnum.SQL_SERVER.getTypeName();
    }

    @Override
    public String buildConnectionUrl(Datasource datasource) {
        if (!hasRequiredConnectionFields(datasource)) {
            return datasource.getConnectionUrl();
        }
        return String.format("jdbc:sqlserver://%s:%d;databaseName=%s;encrypt=false",
                datasource.getHost(), datasource.getPort(), datasource.getDatabaseName());
    }
}
