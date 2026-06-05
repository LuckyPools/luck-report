package com.luck.report.agent.modules.datasource.handler.impl;

import com.luck.report.agent.modules.datasource.domain.entity.Datasource;
import com.luck.report.agent.modules.datasource.domain.enums.DatasourceTypeEnum;
import com.luck.report.agent.modules.datasource.handler.DatasourceTypeHandler;
import org.springframework.stereotype.Component;

/**
 * Hive数据源类型处理器
 *
 * @author luck
 */
@Component
public class HiveDatasourceTypeHandler implements DatasourceTypeHandler {

    @Override
    public String typeName() {
        return DatasourceTypeEnum.HIVE.getTypeName();
    }

    @Override
    public String buildConnectionUrl(Datasource datasource) {
        if (!hasRequiredConnectionFields(datasource)) {
            return datasource.getConnectionUrl();
        }
        return String.format("jdbc:hive2://%s:%d/%s",
                datasource.getHost(), datasource.getPort(), datasource.getDatabaseName());
    }
}
