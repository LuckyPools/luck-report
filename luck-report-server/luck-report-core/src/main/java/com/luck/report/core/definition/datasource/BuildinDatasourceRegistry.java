package com.luck.report.core.definition.datasource;

import java.util.Collection;
import java.util.Map;

/**
 * 内置数据源注册接口
 * 用于提供内置数据源的获取能力，实现类可从数据库或其他来源动态加载数据源配置
 * Utils 类通过此接口获取内置数据源，实现 core 模块与 agent 模块的解耦
 *
 * @author luck
 */
public interface BuildinDatasourceRegistry {

    /**
     * 获取所有内置数据源
     *
     * @return 内置数据源集合
     */
    Collection<BuildinDatasource> getBuildinDatasources();

    /**
     * 根据名称获取内置数据源
     *
     * @param name 数据源名称
     * @return 内置数据源，不存在返回 null
     */
    BuildinDatasource getBuildinDatasource(String name);

    /**
     * 根据名称获取内置数据源的 ID
     *
     * @param name 数据源名称
     * @return 数据源 ID，不存在返回 null
     */
    String getBuildinDatasourceId(String name);

    /**
     * 获取所有内置数据源的名称和 ID 映射
     *
     * @return Map<名称, ID>
     */
    Map<String, String> getBuildinDatasourceIdMap();
}