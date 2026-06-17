package com.luck.product.boot.config;

import com.luck.report.core.definition.datasource.BuildinDatasource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

import javax.annotation.Resource;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * 内置数据源配置
 * @author 24731
 */
@Configuration
public class DatasourceConfig implements BuildinDatasource {
    @Resource
    DataSource dataSource;
    private final Logger log = LoggerFactory.getLogger(getClass());

    @Override
    public String name() {
        return "myUReportDatasource";
    }

    @Override
    public Connection getConnection() {
        try {
            return dataSource.getConnection();
        } catch (SQLException e) {
            log.error("数据源获取连接失败！");
        }
        return null;
    }

}




