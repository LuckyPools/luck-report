package com.luck.report.agent.modules.datasource.config;

import com.luck.report.core.definition.datasource.BuildinDatasource;
import com.luck.report.agent.modules.datasource.domain.entity.Datasource;
import com.luck.report.agent.modules.datasource.service.impl.DynamicDatasourceManager;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;

import java.sql.Connection;
import java.sql.SQLException;

/**
 * 动态内置数据源实现
 * 从Agent数据库配置动态生成的BuildinDatasource实现类
 * 在项目启动时根据数据库中的数据源配置动态创建，注册到Spring容器
 * 
 * @author luck
 */
@Slf4j
public class DynamicBuildinDatasource implements BuildinDatasource {
    
    /** 数据源实体（包含完整配置信息） */
    private final Datasource datasource;
    
    /** 动态数据源管理器（用于获取连接池） */
    private final DynamicDatasourceManager dynamicDatasourceManager;
    
    /**
     * 构造函数
     * 
     * @param datasource 数据源实体，包含ID、名称、连接配置等信息
     * @param dynamicDatasourceManager 动态数据源管理器，用于管理连接池
     */
    public DynamicBuildinDatasource(Datasource datasource, DynamicDatasourceManager dynamicDatasourceManager) {
        this.datasource = datasource;
        this.dynamicDatasourceManager = dynamicDatasourceManager;
    }
    
    /**
     * 返回数据源名称
     * 用于设计器端通过名称匹配数据源
     * 
     * @return 数据源名称
     */
    @Override
    public String name() {
        return datasource.getName();
    }
    
    /**
     * 返回数据源连接
     * 通过动态数据源管理器获取连接池，然后从连接池获取连接
     * 
     * @return 数据库连接，获取失败返回null
     */
    @Override
    public Connection getConnection() {
        try {
            // 通过动态数据源管理器获取或创建连接池
            HikariDataSource dataSourcePool = dynamicDatasourceManager.getOrCreateDatasourcePool(datasource);
            // 从连接池获取连接
            return dataSourcePool.getConnection();
        } catch (SQLException e) {
            log.error("数据源[{}]获取连接失败: {}", datasource.getName(), e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * 返回数据源ID
     * 用于Agent调用schema-prompt接口时传递数据源唯一标识
     * 
     * @return 数据源ID（Integer类型）
     */
    @Override
    public Integer getId() {
        return datasource.getId();
    }
}