package com.luck.report.web.modules.datasource.service.impl;

import com.luck.report.web.modules.datasource.domain.entity.Datasource;
import com.luck.report.web.modules.datasource.domain.enums.DatasourceTypeEnum;
import com.luck.report.web.modules.datasource.handler.DatasourceTypeHandler;
import com.luck.report.web.modules.datasource.handler.DatasourceTypeHandlerRegistry;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.PreDestroy;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 动态数据源管理器
 * 为每个用户数据源维护独立的HikariCP连接池，支持动态创建、获取、删除和连接测试
 * 与现有的DynamicDataSourceConfig分离，不集成到AbstractRoutingDataSource中
 *
 * @author luck
 */
@Slf4j
@Service("bean.dynamicDatasourceManager")
public class DynamicDatasourceManager {

    /** 数据源ID -> HikariDataSource 映射 */
    private final Map<String, HikariDataSource> datasourcePoolMap = new ConcurrentHashMap<>();

    private final DatasourceTypeHandlerRegistry handlerRegistry;

    public DynamicDatasourceManager(DatasourceTypeHandlerRegistry handlerRegistry) {
        this.handlerRegistry = handlerRegistry;
    }

    /**
     * 创建数据源连接池
     * 根据Datasource配置创建HikariDataSource并缓存
     * 注意：调用方应先调用removeDatasourcePool清理旧连接池
     *
     * @param datasource 数据源实体
     * @return 创建的HikariDataSource
     */
    public HikariDataSource createDatasourcePool(Datasource datasource) {
        DatasourceTypeHandler handler = handlerRegistry.getRequired(datasource.getType());
        String jdbcUrl = handler.resolveConnectionUrl(datasource);
        String driverClassName = DatasourceTypeEnum.getDriverByTypeName(datasource.getType());

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(datasource.getUsername());
        config.setPassword(datasource.getPassword());
        config.setDriverClassName(driverClassName);
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setPoolName("datasource-" + datasource.getId() + "-pool");
        // 连接超时设置
        config.setConnectionTimeout(10000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);

        HikariDataSource ds = new HikariDataSource(config);
        datasourcePoolMap.put(datasource.getId(), ds);
        log.info("创建数据源连接池: id={}, name={}, poolName={}", datasource.getId(), datasource.getName(), config.getPoolName());
        return ds;
    }

    /**
     * 获取数据源连接池
     * 如果缓存中没有，则自动创建
     * 注意：不能使用computeIfAbsent，因为createDatasourcePool内部会调用remove修改同一个map，
     * ConcurrentHashMap不允许在computeIfAbsent的lambda中修改当前map，会抛RecursiveUpdate异常
     *
     * @param datasource 数据源实体
     * @return HikariDataSource
     */
    public HikariDataSource getOrCreateDatasourcePool(Datasource datasource) {
        HikariDataSource existing = datasourcePoolMap.get(datasource.getId());
        if (existing != null && !existing.isClosed()) {
            return existing;
        }
        // 先移除已关闭的旧连接池，再创建新的
        removeDatasourcePool(datasource.getId());
        HikariDataSource ds = createDatasourcePool(datasource);
        datasourcePoolMap.put(datasource.getId(), ds);
        return ds;
    }

    /**
     * 获取已有数据源连接池（不自动创建）
     *
     * @param datasourceId 数据源ID
     * @return HikariDataSource，不存在返回null
     */
    public HikariDataSource getDatasourcePool(String datasourceId) {
        return datasourcePoolMap.get(datasourceId);
    }

    /**
     * 删除数据源连接池
     * 关闭连接池并从缓存中移除
     *
     * @param datasourceId 数据源ID
     */
    public void removeDatasourcePool(String datasourceId) {
        HikariDataSource ds = datasourcePoolMap.remove(datasourceId);
        if (ds != null && !ds.isClosed()) {
            ds.close();
            log.info("关闭数据源连接池: id={}", datasourceId);
        }
    }

    /**
     * 测试数据源连接
     * 尝试获取连接，成功返回true，失败返回false
     *
     * @param datasource 数据源实体
     * @return 连接是否成功
     */
    public boolean testConnection(Datasource datasource) {
        // 先移除旧连接池，确保使用最新配置测试
        removeDatasourcePool(datasource.getId());

        try {
            HikariDataSource ds = createDatasourcePool(datasource);
            try (Connection conn = ds.getConnection()) {
                // 执行简单查询验证连接可用
                conn.isValid(5);
                return true;
            }
        } catch (Exception e) {
            log.warn("数据源连接测试失败: id={}, name={}, error={}", datasource.getId(), datasource.getName(), e.getMessage());
            // 测试失败后移除连接池
            removeDatasourcePool(datasource.getId());
            return false;
        }
    }

    /**
     * 获取数据源的表列表
     * 通过JDBC DatabaseMetaData获取
     *
     * @param datasource 数据源实体
     * @return 表名列表
     * @throws SQLException 数据库访问异常
     */
    public List<String> getDatasourceTables(Datasource datasource) throws SQLException {
        HikariDataSource ds = getOrCreateDatasourcePool(datasource);
        List<String> tableNames = new ArrayList<>();

        try (Connection conn = ds.getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            DatasourceTypeHandler handler = handlerRegistry.getRequired(datasource.getType());
            String schema = handler.extractSchemaName(datasource);

            // 获取表列表，只取TABLE类型
            try (ResultSet rs = metaData.getTables(datasource.getDatabaseName(), schema, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    String tableName = rs.getString("TABLE_NAME");
                    if (tableName != null && !tableName.trim().isEmpty()) {
                        tableNames.add(tableName);
                    }
                }
            }
        }

        tableNames.sort(String::compareTo);
        return tableNames;
    }

    /**
     * 获取表的字段列表
     * 通过JDBC DatabaseMetaData获取
     *
     * @param datasource 数据源实体
     * @param tableName  表名
     * @return 字段名列表
     * @throws SQLException 数据库访问异常
     */
    public List<String> getTableColumns(Datasource datasource, String tableName) throws SQLException {
        HikariDataSource ds = getOrCreateDatasourcePool(datasource);
        List<String> columnNames = new ArrayList<>();

        try (Connection conn = ds.getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            DatasourceTypeHandler handler = handlerRegistry.getRequired(datasource.getType());
            String schema = handler.extractSchemaName(datasource);

            try (ResultSet rs = metaData.getColumns(datasource.getDatabaseName(), schema, tableName, "%")) {
                while (rs.next()) {
                    String columnName = rs.getString("COLUMN_NAME");
                    if (columnName != null && !columnName.trim().isEmpty()) {
                        columnNames.add(columnName);
                    }
                }
            }
        }

        return columnNames;
    }

    /**
     * 获取表的字段详细信息（含类型和注释）
     * 用于构建Schema文档存入向量数据库
     *
     * @param datasource 数据源实体
     * @param tableName  表名
     * @return 字段信息列表，每行格式: "字段名 | 类型 | 注释"
     * @throws SQLException 数据库访问异常
     */
    public List<String> getTableColumnsDetail(Datasource datasource, String tableName) throws SQLException {
        HikariDataSource ds = getOrCreateDatasourcePool(datasource);
        List<String> columnDetails = new ArrayList<>();

        try (Connection conn = ds.getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            DatasourceTypeHandler handler = handlerRegistry.getRequired(datasource.getType());
            String schema = handler.extractSchemaName(datasource);

            try (ResultSet rs = metaData.getColumns(datasource.getDatabaseName(), schema, tableName, "%")) {
                while (rs.next()) {
                    String columnName = rs.getString("COLUMN_NAME");
                    String columnType = rs.getString("TYPE_NAME");
                    String remark = rs.getString("REMARKS");
                    columnDetails.add(String.format("%s | %s | %s",
                            columnName,
                            columnType != null ? columnType : "",
                            remark != null ? remark : ""));
                }
            }
        }

        return columnDetails;
    }

    /**
     * 获取表注释
     *
     * @param datasource 数据源实体
     * @param tableName  表名
     * @return 表注释，无注释返回空字符串
     * @throws SQLException 数据库访问异常
     */
    public String getTableComment(Datasource datasource, String tableName) throws SQLException {
        HikariDataSource ds = getOrCreateDatasourcePool(datasource);

        try (Connection conn = ds.getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            DatasourceTypeHandler handler = handlerRegistry.getRequired(datasource.getType());
            String schema = handler.extractSchemaName(datasource);

            try (ResultSet rs = metaData.getTables(datasource.getDatabaseName(), schema, tableName, new String[]{"TABLE"})) {
                if (rs.next()) {
                    String comment = rs.getString("REMARKS");
                    return comment != null ? comment : "";
                }
            }
        }

        return "";
    }

    /**
     * 获取表的主键列表
     * 通过JDBC DatabaseMetaData.getPrimaryKeys获取
     *
     * @param datasource 数据源实体
     * @param tableName  表名
     * @return 主键字段名列表
     * @throws SQLException 数据库访问异常
     */
    public List<String> getTablePrimaryKeys(Datasource datasource, String tableName) throws SQLException {
        HikariDataSource ds = getOrCreateDatasourcePool(datasource);
        List<String> primaryKeys = new ArrayList<>();

        try (Connection conn = ds.getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            DatasourceTypeHandler handler = handlerRegistry.getRequired(datasource.getType());
            String schema = handler.extractSchemaName(datasource);

            try (ResultSet rs = metaData.getPrimaryKeys(datasource.getDatabaseName(), schema, tableName)) {
                while (rs.next()) {
                    String pkColumn = rs.getString("COLUMN_NAME");
                    if (pkColumn != null && !pkColumn.trim().isEmpty()) {
                        primaryKeys.add(pkColumn);
                    }
                }
            }
        }

        return primaryKeys;
    }

    /**
     * 获取表的物理外键列表
     * 通过JDBC DatabaseMetaData.getImportedKeys获取
     *
     * @param datasource 数据源实体
     * @return 外键列表，每条格式: "sourceTable.sourceCol=targetTable.targetCol"
     * @throws SQLException 数据库访问异常
     */
    public List<String> getForeignKeys(Datasource datasource) throws SQLException {
        HikariDataSource ds = getOrCreateDatasourcePool(datasource);
        List<String> foreignKeys = new ArrayList<>();

        try (Connection conn = ds.getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            DatasourceTypeHandler handler = handlerRegistry.getRequired(datasource.getType());
            String schema = handler.extractSchemaName(datasource);

            // 获取所有表
            List<String> tableNames = new ArrayList<>();
            try (ResultSet rs = metaData.getTables(datasource.getDatabaseName(), schema, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    String tableName = rs.getString("TABLE_NAME");
                    if (tableName != null && !tableName.trim().isEmpty()) {
                        tableNames.add(tableName);
                    }
                }
            }

            // 对每张表查询其导入的外键关系
            Set<String> seen = new HashSet<>();
            for (String tableName : tableNames) {
                try (ResultSet rs = metaData.getImportedKeys(datasource.getDatabaseName(), schema, tableName)) {
                    while (rs.next()) {
                        String pkTable = rs.getString("PKTABLE_NAME");
                        String pkColumn = rs.getString("PKCOLUMN_NAME");
                        String fkTable = rs.getString("FKTABLE_NAME");
                        String fkColumn = rs.getString("FKCOLUMN_NAME");
                        if (pkTable != null && fkTable != null) {
                            String fkStr = fkTable + "." + fkColumn + "=" + pkTable + "." + pkColumn;
                            // 去重
                            if (seen.add(fkStr)) {
                                foreignKeys.add(fkStr);
                            }
                        }
                    }
                }
            }
        }

        return foreignKeys;
    }

    /**
     * 获取表的示例数据
     * 执行SELECT * FROM tableName LIMIT sampleSize获取每列的示例值
     *
     * @param datasource 数据源实体
     * @param tableName  表名
     * @param sampleSize 采样行数
     * @return Map<列名, 示例值列表>
     * @throws SQLException 数据库访问异常
     */
    public Map<String, List<String>> getTableSampleData(Datasource datasource, String tableName, int sampleSize) throws SQLException {
        HikariDataSource ds = getOrCreateDatasourcePool(datasource);
        Map<String, List<String>> sampleData = new HashMap<>();

        try (Connection conn = ds.getConnection()) {
            // 获取列名列表
            DatabaseMetaData metaData = conn.getMetaData();
            DatasourceTypeHandler handler = handlerRegistry.getRequired(datasource.getType());
            String schema = handler.extractSchemaName(datasource);

            List<String> columnNames = new ArrayList<>();
            try (ResultSet rs = metaData.getColumns(datasource.getDatabaseName(), schema, tableName, "%")) {
                while (rs.next()) {
                    String colName = rs.getString("COLUMN_NAME");
                    if (colName != null) {
                        columnNames.add(colName);
                    }
                }
            }

            if (columnNames.isEmpty()) {
                return sampleData;
            }

            // 执行查询获取示例数据
            String quotedTableName = tableName;
            // 不同数据库的引用符不同
            if ("mysql".equalsIgnoreCase(datasource.getType()) || "h2".equalsIgnoreCase(datasource.getType())) {
                quotedTableName = "`" + tableName + "`";
            } else {
                quotedTableName = "\"" + tableName + "\"";
            }

            String sql = "SELECT * FROM " + quotedTableName + " LIMIT " + sampleSize;
            try (java.sql.Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(sql)) {
                while (rs.next()) {
                    for (String colName : columnNames) {
                        try {
                            String value = rs.getString(colName);
                            if (value != null) {
                                sampleData.computeIfAbsent(colName, k -> new ArrayList<>()).add(value);
                            }
                        } catch (Exception e) {
                            // 某些类型可能无法转为String，跳过
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("获取表示例数据失败: table={}, error={}", tableName, e.getMessage());
        }

        return sampleData;
    }

    /**
     * 销毁时关闭所有连接池
     */
    @PreDestroy
    public void closeAll() {
        datasourcePoolMap.forEach((id, ds) -> {
            if (!ds.isClosed()) {
                ds.close();
                log.info("关闭数据源连接池: id={}", id);
            }
        });
        datasourcePoolMap.clear();
    }
}
