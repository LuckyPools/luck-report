package com.luck.report.agent.modules.datasource.handler.impl;

import com.luck.report.agent.modules.datasource.domain.entity.Datasource;
import com.luck.report.agent.modules.datasource.domain.enums.DatasourceTypeEnum;
import com.luck.report.agent.modules.datasource.handler.DatasourceTypeHandler;
import org.springframework.stereotype.Component;

/**
 * 达梦数据源类型处理器
 *
 * @author luck
 */
@Component
public class DamengDatasourceTypeHandler implements DatasourceTypeHandler {

    @Override
    public String typeName() {
        return DatasourceTypeEnum.DAMENG.getTypeName();
    }

    @Override
    public String buildConnectionUrl(Datasource datasource) {
        if (!hasRequiredConnectionFields(datasource)) {
            return datasource.getConnectionUrl();
        }
        return String.format("jdbc:dm://%s:%d/%s",
                datasource.getHost(), datasource.getPort(), datasource.getDatabaseName());
    }
}
