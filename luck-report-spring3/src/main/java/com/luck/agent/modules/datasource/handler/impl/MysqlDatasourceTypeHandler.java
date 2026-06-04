package com.luck.agent.modules.datasource.handler.impl;

import com.luck.agent.modules.datasource.domain.entity.Datasource;
import com.luck.agent.modules.datasource.domain.enums.DatasourceTypeEnum;
import com.luck.agent.modules.datasource.handler.DatasourceTypeHandler;
import org.springframework.stereotype.Component;

/**
 * MySQL数据源类型处理器
 * 负责MySQL类型的JDBC URL生成和Schema提取
 *
 * @author luck
 */
@Component
public class MysqlDatasourceTypeHandler implements DatasourceTypeHandler {

    @Override
    public String typeName() {
        return DatasourceTypeEnum.MYSQL.getTypeName();
    }

    @Override
    public String buildConnectionUrl(Datasource datasource) {
        if (!hasRequiredConnectionFields(datasource)) {
            return datasource.getConnectionUrl();
        }
        return String.format(
                "jdbc:mysql://%s:%d/%s?useUnicode=true&characterEncoding=utf-8" +
                        "&zeroDateTimeBehavior=convertToNull&transformedBitIsBoolean=true" +
                        "&allowMultiQueries=true&allowPublicKeyRetrieval=true&useSSL=false" +
                        "&serverTimezone=Asia/Shanghai",
                datasource.getHost(), datasource.getPort(), datasource.getDatabaseName());
    }
}
