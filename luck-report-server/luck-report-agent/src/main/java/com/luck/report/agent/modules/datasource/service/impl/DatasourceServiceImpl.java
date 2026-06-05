package com.luck.report.agent.modules.datasource.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.luck.report.agent.domain.vo.PageResultVO;
import com.luck.report.agent.modules.datasource.domain.dto.ColumnDTO;
import com.luck.report.agent.modules.datasource.domain.dto.DatasourceQueryDTO;
import com.luck.report.agent.modules.datasource.domain.dto.SchemaDTO;
import com.luck.report.agent.modules.datasource.domain.dto.TableDTO;
import com.luck.report.agent.modules.datasource.domain.entity.Datasource;
import com.luck.report.agent.modules.datasource.domain.entity.LogicalRelation;
import com.luck.report.agent.modules.datasource.domain.vo.DatasourceVO;
import com.luck.report.agent.modules.datasource.config.BuildinDatasourceLoader;
import com.luck.report.agent.modules.datasource.handler.DatasourcePromptHelper;
import com.luck.report.agent.modules.datasource.handler.DatasourceTypeHandler;
import com.luck.report.agent.modules.datasource.handler.DatasourceTypeHandlerRegistry;
import com.luck.report.agent.modules.datasource.mapper.DatasourceMapper;
import com.luck.report.agent.modules.datasource.mapper.LogicalRelationMapper;
import com.luck.report.agent.modules.datasource.service.DatasourceService;
import com.luck.report.agent.modules.vector.domain.dto.VectorStoreSearchResult;
import com.luck.report.agent.modules.vector.domain.entity.VectorDocument;
import com.luck.report.agent.modules.vector.service.impl.AgentVectorStore;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 数据源服务实现
 * 提供数据源CRUD、连接测试、表管理、Schema初始化和逻辑外键管理
 *
 * @author luck
 */
@Slf4j
@Service
@AllArgsConstructor
public class DatasourceServiceImpl implements DatasourceService {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final DatasourceMapper datasourceMapper;
    private final LogicalRelationMapper logicalRelationMapper;
    private final DynamicDatasourceManager dynamicDatasourceManager;
    private final DatasourceTypeHandlerRegistry handlerRegistry;
    private final AgentVectorStore agentVectorStore;
    /** 内置数据源加载器，用于同步更新数据源缓存 */
    private final BuildinDatasourceLoader buildinDatasourceLoader;

    @Override
    public List<DatasourceVO> getAllDatasource() {
        List<Datasource> list = datasourceMapper.selectAll();
        return list.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public List<DatasourceVO> getDatasourceByStatus(String status) {
        List<Datasource> list = datasourceMapper.selectByStatus(status);
        return list.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public List<DatasourceVO> getDatasourceByType(String type) {
        List<Datasource> list = datasourceMapper.selectByType(type);
        return list.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public DatasourceVO getDatasourceById(Integer id) {
        Datasource datasource = datasourceMapper.selectById(id);
        return datasource != null ? toVO(datasource) : null;
    }

    @Override
    public DatasourceVO createDatasource(Datasource datasource) {
        // 根据类型生成连接URL
        DatasourceTypeHandler handler = handlerRegistry.getRequired(datasource.getType());
        String connectionUrl = handler.resolveConnectionUrl(datasource);
        if (StringUtils.isNotBlank(connectionUrl)) {
            datasource.setConnectionUrl(connectionUrl);
        }

        // 设置默认值
        if (datasource.getStatus() == null) {
            datasource.setStatus("active");
        }
        if (datasource.getTestStatus() == null) {
            datasource.setTestStatus("unknown");
        }
        if (datasource.getPassword() == null) {
            datasource.setPassword("");
        }
        if (datasource.getUsername() == null) {
            datasource.setUsername("");
        }

        datasourceMapper.insert(datasource);
        // 同步更新内置数据源缓存
        buildinDatasourceLoader.addOrUpdateDatasource(datasource);
        log.info("创建数据源: id={}, name={}, type={}", datasource.getId(), datasource.getName(), datasource.getType());
        return toVO(datasource);
    }

    @Override
    public DatasourceVO updateDatasource(Integer id, Datasource datasource) {
        // 重新生成连接URL
        DatasourceTypeHandler handler = handlerRegistry.getRequired(datasource.getType());
        String connectionUrl = handler.resolveConnectionUrl(datasource);
        if (StringUtils.isNotBlank(connectionUrl)) {
            datasource.setConnectionUrl(connectionUrl);
        }
        datasource.setId(id);

        // 密码为空时保留原密码，避免前端未传密码导致密码被清空
        if (datasource.getPassword() == null || datasource.getPassword().isEmpty()) {
            Datasource existing = datasourceMapper.selectById(id);
            if (existing != null) {
                datasource.setPassword(existing.getPassword());
            }
        }
        if (datasource.getUsername() == null) {
            datasource.setUsername("");
        }

        datasourceMapper.updateById(datasource);
        // 更新后重建连接池
        dynamicDatasourceManager.removeDatasourcePool(id);
        // 同步更新内置数据源缓存
        Datasource updated = datasourceMapper.selectById(id);
        buildinDatasourceLoader.addOrUpdateDatasource(updated);
        log.info("更新数据源: id={}", id);
        return toVO(updated);
    }

    @Override
    @Transactional
    public void deleteDatasource(Integer id) {
        // 先获取数据源信息，用于删除缓存
        Datasource datasource = datasourceMapper.selectById(id);
        String datasourceName = datasource != null ? datasource.getName() : null;
        
        // 删除关联的逻辑外键
        logicalRelationMapper.deleteByDatasourceId(id);
        // 删除数据源
        datasourceMapper.deleteById(id);
        // 关闭连接池
        dynamicDatasourceManager.removeDatasourcePool(id);
        // 同步删除内置数据源缓存
        if (datasourceName != null) {
            buildinDatasourceLoader.removeDatasource(datasourceName);
        }
        // 删除向量库中该数据源的所有Schema文档（TABLE + COLUMN + 旧版DATASOURCE）
        for (String vectorType : Arrays.asList("TABLE", "COLUMN", "DATASOURCE")) {
            Map<String, Object> filter = new HashMap<>();
            filter.put("vectorType", vectorType);
            filter.put("datasourceId", id);
            agentVectorStore.deleteByMetadata(filter);
        }
        log.info("删除数据源: id={}", id);
    }

    @Override
    public boolean testConnection(Integer id) {
        Datasource datasource = datasourceMapper.selectById(id);
        if (datasource == null) {
            return false;
        }
        try {
            boolean success = dynamicDatasourceManager.testConnection(datasource);
            log.info("数据源连接测试: id={}, name={}, result={}", id, datasource.getName(), success);
            // 更新测试状态
            datasourceMapper.updateTestStatusById(id, success ? "success" : "failed");
            return success;
        } catch (Exception e) {
            datasourceMapper.updateTestStatusById(id, "failed");
            log.error("数据源连接测试异常: id={}, error={}", id, e.getMessage());
            return false;
        }
    }

    @Override
    public List<String> getDatasourceTables(Integer id) throws Exception {
        Datasource datasource = datasourceMapper.selectById(id);
        if (datasource == null) {
            throw new RuntimeException("数据源不存在，ID: " + id);
        }
        return dynamicDatasourceManager.getDatasourceTables(datasource);
    }

    @Override
    public List<String> getTableColumns(Integer id, String tableName) throws Exception {
        Datasource datasource = datasourceMapper.selectById(id);
        if (datasource == null) {
            throw new RuntimeException("数据源不存在，ID: " + id);
        }
        return dynamicDatasourceManager.getTableColumns(datasource, tableName);
    }

    @Override
    public void initTableSchema(Integer id, List<String> tables, Long modelId) throws Exception {
        Datasource datasource = datasourceMapper.selectById(id);
        if (datasource == null) {
            throw new RuntimeException("数据源不存在，ID: " + id);
        }

        // 先删除该数据源已有的Schema文档（TABLE + COLUMN + 旧版DATASOURCE）
        for (String vectorType : Arrays.asList("TABLE", "COLUMN", "DATASOURCE")) {
            Map<String, Object> deleteFilter = new HashMap<>();
            deleteFilter.put("vectorType", vectorType);
            deleteFilter.put("datasourceId", id);
            agentVectorStore.deleteByMetadata(deleteFilter);
        }

        // 查询物理外键
        Map<String, List<String>> foreignKeyMap = new HashMap<>();
        try {
            List<String> physicalForeignKeys = dynamicDatasourceManager.getForeignKeys(datasource);
            for (String fk : physicalForeignKeys) {
                // fk格式: sourceTable.sourceCol=targetTable.targetCol
                String[] parts = fk.split("=");
                if (parts.length == 2) {
                    String[] sourceParts = parts[0].trim().split("\\.");
                    if (sourceParts.length == 2) {
                        String sourceTable = sourceParts[0];
                        foreignKeyMap.computeIfAbsent(sourceTable, k -> new ArrayList<>()).add(fk);
                    }
                    String[] targetParts = parts[1].trim().split("\\.");
                    if (targetParts.length == 2) {
                        String targetTable = targetParts[0];
                        foreignKeyMap.computeIfAbsent(targetTable, k -> new ArrayList<>()).add(fk);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("查询物理外键失败: datasourceId={}, error={}", id, e.getMessage());
        }

        // 构建TABLE文档和COLUMN文档
        List<VectorDocument> tableDocuments = new ArrayList<>();
        List<VectorDocument> columnDocuments = new ArrayList<>();

        for (String tableName : tables) {
            try {
                // 获取表注释
                String tableComment = dynamicDatasourceManager.getTableComment(datasource, tableName);
                // 获取字段详情
                List<String> columnDetails = dynamicDatasourceManager.getTableColumnsDetail(datasource, tableName);
                // 获取主键
                List<String> primaryKeys = dynamicDatasourceManager.getTablePrimaryKeys(datasource, tableName);
                // 获取示例数据
                Map<String, List<String>> sampleData = dynamicDatasourceManager.getTableSampleData(datasource, tableName, 5);

                // 该表的物理外键
                List<String> tableForeignKeys = foreignKeyMap.getOrDefault(tableName, new ArrayList<>());

                // 构建TABLE文档：content用表注释或表名（用于语义检索），metadata存完整表信息
                String tableContent = StringUtils.isNotBlank(tableComment) ? tableComment : tableName;
                Map<String, Object> tableMeta = new HashMap<>();
                tableMeta.put("vectorType", "TABLE");
                tableMeta.put("datasourceId", id);
                tableMeta.put("name", tableName);
                tableMeta.put("description", tableComment != null ? tableComment : "");
                tableMeta.put("primaryKeys", String.join(",", primaryKeys));
                tableMeta.put("foreignKey", String.join("、", tableForeignKeys));
                tableMeta.put("datasourceName", datasource.getName());
                tableMeta.put("datasourceType", datasource.getType());
                tableDocuments.add(new VectorDocument(tableContent, tableMeta));

                // 构建COLUMN文档：每个字段一条文档，content用字段注释或字段名，metadata存完整字段信息
                for (String col : columnDetails) {
                    String[] parts = col.split("\\|");
                    String colName = parts.length > 0 ? parts[0].trim() : "";
                    String colType = parts.length > 1 ? parts[1].trim() : "";
                    String colComment = parts.length > 2 ? parts[2].trim() : "";
                    boolean isPrimary = primaryKeys.contains(colName);

                    String colContent = StringUtils.isNotBlank(colComment) ? colComment : colName;
                    List<String> samples = sampleData.getOrDefault(colName, new ArrayList<>());
                    // 过滤和限制示例数据：去重、最多3个、长度不超过100
                    List<String> filteredSamples = samples.stream()
                            .filter(Objects::nonNull)
                            .distinct()
                            .limit(3)
                            .filter(s -> s.length() <= 100)
                            .collect(Collectors.toList());

                    Map<String, Object> colMeta = new HashMap<>();
                    colMeta.put("vectorType", "COLUMN");
                    colMeta.put("datasourceId", id);
                    colMeta.put("tableName", tableName);
                    colMeta.put("name", colName);
                    colMeta.put("description", colComment);
                    colMeta.put("type", colType);
                    colMeta.put("primary", isPrimary);
                    try {
                        colMeta.put("samples", objectMapper.writeValueAsString(filteredSamples));
                    } catch (Exception e) {
                        log.warn("序列化字段示例数据失败: table={}, column={}, error={}", tableName, colName, e.getMessage());
                        colMeta.put("samples", "[]");
                    }
                    columnDocuments.add(new VectorDocument(colContent, colMeta));
                }
            } catch (Exception e) {
                log.error("获取表Schema失败: datasourceId={}, table={}, error={}", id, tableName, e.getMessage());
            }
        }

        // 分批提交到向量库（Embedding API限制batch size不超过10）
        int batchSize = 10;
        List<VectorDocument> allDocuments = new ArrayList<>();
        allDocuments.addAll(tableDocuments);
        allDocuments.addAll(columnDocuments);

        for (int i = 0; i < allDocuments.size(); i += batchSize) {
            int end = Math.min(i + batchSize, allDocuments.size());
            List<VectorDocument> batch = allDocuments.subList(i, end);
            agentVectorStore.addDocuments(new ArrayList<>(batch), modelId);
            log.info("向量化第 {}/{} 批, 本批 {} 条文档", (i / batchSize + 1),
                    (allDocuments.size() + batchSize - 1) / batchSize, batch.size());
        }
        log.info("初始化数据源Schema到向量库: datasourceId={}, tables={}, TABLE文档={}, COLUMN文档={}, 总文档数={}",
                id, tables.size(), tableDocuments.size(), columnDocuments.size(), allDocuments.size());

        // 保存已初始化的表名列表到数据源记录，用于前端回显
        try {
            String initializedTablesJson = objectMapper.writeValueAsString(tables);
            datasourceMapper.updateInitializedTables(id, initializedTablesJson);
            log.info("保存已初始化表列表: datasourceId={}, tables={}", id, tables);
        } catch (Exception e) {
            log.warn("保存已初始化表列表失败: datasourceId={}, error={}", id, e.getMessage());
        }
    }

    @Override
    public void updateStatus(Integer id, String status) {
        datasourceMapper.updateStatusById(id, status);
        // 同步更新内置数据源缓存
        Datasource datasource = datasourceMapper.selectById(id);
        if (datasource != null) {
            if ("active".equals(status)) {
                // 状态变为 active，添加到缓存
                buildinDatasourceLoader.addOrUpdateDatasource(datasource);
            } else {
                // 状态变为非 active，从缓存移除
                buildinDatasourceLoader.removeDatasource(datasource.getName());
            }
        }
        log.info("更新数据源状态: id={}, status={}", id, status);
    }

    @Override
    public List<LogicalRelation> getLogicalRelations(Integer datasourceId) {
        return logicalRelationMapper.selectByDatasourceId(datasourceId);
    }

    @Override
    public LogicalRelation addLogicalRelation(Integer datasourceId, LogicalRelation logicalRelation) {
        logicalRelation.setDatasourceId(datasourceId);

        // 检查是否已存在相同的外键关系
        int exists = logicalRelationMapper.checkExists(datasourceId,
                logicalRelation.getSourceTableName(), logicalRelation.getSourceColumnName(),
                logicalRelation.getTargetTableName(), logicalRelation.getTargetColumnName());
        if (exists > 0) {
            throw new RuntimeException("该逻辑外键关系已存在");
        }

        logicalRelationMapper.insert(logicalRelation);
        log.info("添加逻辑外键: datasourceId={}, id={}", datasourceId, logicalRelation.getId());
        return logicalRelation;
    }

    @Override
    public LogicalRelation updateLogicalRelation(Integer datasourceId, Integer relationId, LogicalRelation logicalRelation) {
        // 验证外键是否存在且属于该数据源
        LogicalRelation existing = logicalRelationMapper.selectById(relationId);
        if (existing == null) {
            throw new RuntimeException("逻辑外键不存在，ID: " + relationId);
        }
        if (!existing.getDatasourceId().equals(datasourceId)) {
            throw new RuntimeException("逻辑外键不属于指定的数据源");
        }

        logicalRelation.setId(relationId);
        logicalRelation.setDatasourceId(datasourceId);
        logicalRelationMapper.updateById(logicalRelation);
        log.info("更新逻辑外键: datasourceId={}, relationId={}", datasourceId, relationId);
        return logicalRelationMapper.selectById(relationId);
    }

    @Override
    public void deleteLogicalRelation(Integer datasourceId, Integer relationId) {
        LogicalRelation existing = logicalRelationMapper.selectById(relationId);
        if (existing == null) {
            throw new RuntimeException("逻辑外键不存在，ID: " + relationId);
        }
        if (!existing.getDatasourceId().equals(datasourceId)) {
            throw new RuntimeException("逻辑外键不属于指定的数据源");
        }

        logicalRelationMapper.deleteById(relationId);
        log.info("删除逻辑外键: datasourceId={}, relationId={}", datasourceId, relationId);
    }

    @Override
    @Transactional
    public List<LogicalRelation> saveLogicalRelations(Integer datasourceId, List<LogicalRelation> logicalRelations) {
        // 获取现有外键
        List<LogicalRelation> existingRelations = logicalRelationMapper.selectByDatasourceId(datasourceId);
        Map<Integer, LogicalRelation> existingMap = existingRelations.stream()
                .collect(Collectors.toMap(LogicalRelation::getId, r -> r));

        // 收集传入列表中已存在的ID
        Set<Integer> incomingIds = logicalRelations.stream()
                .map(LogicalRelation::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // 删除不在传入列表中的外键
        for (LogicalRelation existing : existingRelations) {
            if (!incomingIds.contains(existing.getId())) {
                logicalRelationMapper.deleteById(existing.getId());
            }
        }

        // 去重
        List<LogicalRelation> uniqueRelations = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (LogicalRelation relation : logicalRelations) {
            String key = relation.getSourceTableName() + "|" + relation.getSourceColumnName() + "|"
                    + relation.getTargetTableName() + "|" + relation.getTargetColumnName();
            if (!seen.contains(key)) {
                seen.add(key);
                uniqueRelations.add(relation);
            }
        }

        // 插入或更新
        for (LogicalRelation relation : uniqueRelations) {
            relation.setDatasourceId(datasourceId);
            if (relation.getId() != null && existingMap.containsKey(relation.getId())) {
                logicalRelationMapper.updateById(relation);
            } else {
                relation.setId(null);
                logicalRelationMapper.insert(relation);
            }
        }

        log.info("批量保存逻辑外键: datasourceId={}, count={}", datasourceId, uniqueRelations.size());
        return logicalRelationMapper.selectByDatasourceId(datasourceId);
    }

    /**
     * 实体转VO
     * 隐藏密码等敏感字段
     *
     * @param datasource 数据源实体
     * @return 数据源VO
     */
    private DatasourceVO toVO(Datasource datasource) {
        return DatasourceVO.builder()
                .id(datasource.getId())
                .name(datasource.getName())
                .type(datasource.getType())
                .host(datasource.getHost())
                .port(datasource.getPort())
                .databaseName(datasource.getDatabaseName())
                .username(datasource.getUsername())
                .connectionUrl(datasource.getConnectionUrl())
                .status(datasource.getStatus())
                .testStatus(datasource.getTestStatus())
                .description(datasource.getDescription())
                .initializedTables(datasource.getInitializedTables())
                .creatorId(datasource.getCreatorId())
                .createTime(datasource.getCreateTime())
                .updateTime(datasource.getUpdateTime())
                .build();
    }

    @Override
    public SchemaDTO buildSchemaDTO(Integer datasourceId, String query) {
        Datasource datasource = datasourceMapper.selectById(datasourceId);
        if (datasource == null) {
            throw new RuntimeException("数据源不存在，ID: " + datasourceId);
        }

        // 第一步：向量检索召回与查询相关的TABLE文档
        Map<String, Object> extraFilters = new HashMap<>();
        extraFilters.put("datasourceId", datasourceId);
        List<VectorStoreSearchResult> tableSearchResults = agentVectorStore.search(query, "TABLE", 10, 0.5, extraFilters);

        if (tableSearchResults.isEmpty()) {
            log.warn("向量检索未找到相关表Schema: datasourceId={}, query={}", datasourceId, query);
            return SchemaDTO.builder()
                    .name(datasource.getDatabaseName())
                    .tableCount(0)
                    .table(new ArrayList<>())
                    .foreignKeys(new ArrayList<>())
                    .build();
        }

        // 从TABLE文档提取召回的表名
        Set<String> recalledTableNames = new LinkedHashSet<>();
        Map<String, VectorDocument> tableDocMap = new LinkedHashMap<>();
        for (VectorStoreSearchResult result : tableSearchResults) {
            VectorDocument doc = result.getDocument();
            if (doc == null || doc.getMetadata() == null) {
                continue;
            }
            String tableName = (String) doc.getMetadata().get("name");
            if (tableName != null && !recalledTableNames.contains(tableName)) {
                recalledTableNames.add(tableName);
                tableDocMap.put(tableName, doc);
            }
        }

        // 第二步：向量检索召回与查询相关的COLUMN文档
        List<VectorStoreSearchResult> columnSearchResults = agentVectorStore.search(query, "COLUMN", 20, 0.4, extraFilters);

        // 按表名分组COLUMN文档
        Map<String, List<VectorDocument>> columnDocMap = new LinkedHashMap<>();
        for (VectorStoreSearchResult result : columnSearchResults) {
            VectorDocument doc = result.getDocument();
            if (doc == null || doc.getMetadata() == null) {
                continue;
            }
            String tableName = (String) doc.getMetadata().get("tableName");
            if (tableName != null && recalledTableNames.contains(tableName)) {
                columnDocMap.computeIfAbsent(tableName, k -> new ArrayList<>()).add(doc);
            }
        }

        // 第三步：构建TableDTO列表
        List<TableDTO> tableList = new ArrayList<>();
        for (String tableName : recalledTableNames) {
            VectorDocument tableDoc = tableDocMap.get(tableName);
            List<VectorDocument> columnDocs = columnDocMap.getOrDefault(tableName, new ArrayList<>());
            TableDTO tableDTO = buildTableDTOFromMetadata(tableDoc, columnDocs);
            tableList.add(tableDTO);
        }

        // 第四步：合并物理外键和逻辑外键
        Set<String> foreignKeySet = new LinkedHashSet<>();

        // 4.1 从TABLE文档metadata提取物理外键
        for (VectorDocument tableDoc : tableDocMap.values()) {
            String fkStr = (String) tableDoc.getMetadata().getOrDefault("foreignKey", "");
            if (StringUtils.isNotBlank(fkStr)) {
                for (String fk : fkStr.split("、")) {
                    if (StringUtils.isNotBlank(fk)) {
                        foreignKeySet.add(fk);
                    }
                }
            }
        }

        // 4.2 从逻辑外键表查询，只保留与召回表相关的外键
        List<LogicalRelation> allRelations = logicalRelationMapper.selectByDatasourceId(datasourceId);
        for (LogicalRelation relation : allRelations) {
            boolean sourceInRecalled = recalledTableNames.contains(relation.getSourceTableName());
            boolean targetInRecalled = recalledTableNames.contains(relation.getTargetTableName());
            if (sourceInRecalled || targetInRecalled) {
                String fkStr = relation.getSourceTableName() + "." + relation.getSourceColumnName()
                        + "=" + relation.getTargetTableName() + "." + relation.getTargetColumnName();
                foreignKeySet.add(fkStr);
            }
        }

        // 第五步：组装SchemaDTO
        return SchemaDTO.builder()
                .name(datasource.getDatabaseName())
                .description(datasource.getDescription())
                .tableCount(tableList.size())
                .table(tableList)
                .foreignKeys(new ArrayList<>(foreignKeySet))
                .build();
    }

    @Override
    public String getSchemaPrompt(Integer datasourceId, String query) {
        SchemaDTO schemaDTO = buildSchemaDTO(datasourceId, query);
        return DatasourcePromptHelper.buildSchemaPrompt(schemaDTO);
    }

    @Override
    public DatasourceVO getDatasourceByName(String name) {
        Datasource datasource = datasourceMapper.selectByName(name);
        return datasource != null ? toVO(datasource) : null;
    }

    /**
     * 从向量文档metadata构建TableDTO
     * 参照参考项目，向量库存储TABLE和COLUMN两种文档，字段信息存在metadata中
     *
     * @param tableDoc   TABLE类型的向量文档
     * @param columnDocs 该表对应的COLUMN类型向量文档列表
     * @return TableDTO
     */
    private TableDTO buildTableDTOFromMetadata(VectorDocument tableDoc, List<VectorDocument> columnDocs) {
        Map<String, Object> tableMeta = tableDoc.getMetadata();
        String tableName = (String) tableMeta.get("name");
        String tableDescription = (String) tableMeta.getOrDefault("description", "");
        String primaryKeysStr = (String) tableMeta.getOrDefault("primaryKeys", "");
        List<String> primaryKeys = StringUtils.isNotBlank(primaryKeysStr)
                ? Arrays.asList(primaryKeysStr.split(",")) : new ArrayList<>();

        List<ColumnDTO> columns = new ArrayList<>();
        for (VectorDocument colDoc : columnDocs) {
            Map<String, Object> colMeta = colDoc.getMetadata();
            ColumnDTO columnDTO = ColumnDTO.builder()
                    .name((String) colMeta.getOrDefault("name", ""))
                    .type((String) colMeta.getOrDefault("type", ""))
                    .description((String) colMeta.getOrDefault("description", ""))
                    .build();

            // 解析示例数据
            String samplesStr = (String) colMeta.getOrDefault("samples", "");
            if (StringUtils.isNotBlank(samplesStr)) {
                try {
                    List<String> samples = objectMapper.readValue(samplesStr, new TypeReference<List<String>>() {});
                    columnDTO.setData(samples);
                } catch (Exception e) {
                    log.warn("解析字段示例数据失败: column={}, samples={}", columnDTO.getName(), samplesStr);
                }
            }
            columns.add(columnDTO);
        }

        return TableDTO.builder()
                .name(tableName)
                .description(tableDescription)
                .column(columns)
                .primaryKeys(primaryKeys)
                .build();
    }

    /**
     * 分页条件查询数据源
     *
     * @param queryDTO 查询条件
     * @return 分页结果
     */
    @Override
    public PageResultVO<DatasourceVO> queryByPage(DatasourceQueryDTO queryDTO) {
        int offset = (queryDTO.getPageNum() - 1) * queryDTO.getPageSize();

        Long total = datasourceMapper.countByConditions(queryDTO);

        List<Datasource> dataList = datasourceMapper.selectByConditionsWithPage(queryDTO, offset);
        List<DatasourceVO> dataListVO = dataList.stream()
                .map(this::toVO)
                .collect(Collectors.toList());

        return PageResultVO.success(dataListVO, total, queryDTO.getPageNum(), queryDTO.getPageSize());
    }
}
