package com.luck.report.postgresql.vector.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.luck.report.infra.modules.vector.domain.entity.VectorDocumentRow;
import com.luck.report.infra.modules.vector.domain.param.VectorSearchParam;
import com.luck.report.postgresql.vector.mapper.PgSqlVectorDocumentDao;
import com.luck.report.infra.modules.vector.service.VectorStore;
import com.luck.report.infra.modules.vector.domain.entity.VectorDocument;
import com.luck.report.infra.modules.vector.domain.dto.VectorStoreSearchResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 基于 PostgreSQL + vector 的向量存储实现（纯向量操作）
 * 使用 vector 扩展进行向量存储和相似度检索，支持元数据过滤
 * SQL 操作委托给 PgSqlVectorDocumentDao，由 plugin 自治的 vectorJdbcTemplate 直接绑定 vector 数据源
 *
 * 设计原则：
 * 1. 只负责向量数据的存储、检索、删除
 * 2. 不负责文本转向量（这是 AgentVectorStore 的职责）
 * 3. 调用 add() 前，VectorDocument.vector 必须已填充
 * 4. 调用 search() 前，queryVector 必须已生成
 *
 * 前置条件：
 * 1. PostgreSQL 安装 vector 扩展：CREATE EXTENSION IF NOT EXISTS vector;
 * 2. 创建向量文档表（见 vector_document.sql）
 *
 * 检索策略：
 * - 先通过 SQL WHERE 过滤 metadata（缩小候选集）
 * - 再使用 vector 的 <=> 操作符进行余弦距离排序
 * - 最后按相似度阈值过滤
 *
 * @author luck
 */
@Repository
@ConditionalOnProperty(name = "luck-report.vector.type", havingValue = "postgresql", matchIfMissing = true)
public class PgSqlVectorStoreImpl implements VectorStore {

    private static final Logger log = LoggerFactory.getLogger(PgSqlVectorStoreImpl.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private PgSqlVectorDocumentDao vectorDocumentDao;


    /**
     * 添加向量到 PostgreSQL
     * 要求：documents 中的 vector 必须非空，否则抛出 IllegalArgumentException
     *
     * @param documents 向量文档列表，vector 必须已生成
     * @throws IllegalArgumentException 如果 documents 中的 vector 为空
     */
    @Override
    public void add(List<VectorDocument> documents) {
        if (documents == null || documents.isEmpty()) {
            return;
        }

        // 验证向量必须非空（职责分离：不再自动生成向量）
        for (VectorDocument doc : documents) {
            if (doc.getVector() == null || doc.getVector().length == 0) {
                throw new IllegalArgumentException(
                    String.format("VectorDocument 的 vector 必须非空（docId=%s）。" +
                                  "请先调用 EmbeddingService 生成向量，再调用 VectorStore.add()。",
                                  doc.getId())
                );
            }
        }

        // 逐条插入 PostgreSQL（通过 Mapper）
        for (VectorDocument doc : documents) {
            VectorDocumentRow row = toRow(doc);
            vectorDocumentDao.insertOrUpdate(row);
        }

        log.info("成功添加 {} 条向量到 PostgreSQL 向量存储", documents.size());
    }

    /**
     * 按文档ID删除（第一层：基础接口）
     * 所有向量库都支持此操作
     *
     * @param ids 文档ID列表
     * @return 是否删除成功
     */
    @Override
    public boolean delete(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return true;
        }
        vectorDocumentDao.deleteByIds(ids);
        log.info("删除 {} 条文档", ids.size());
        return true;
    }

    /**
     * 按向量类型删除（第二层：常用接口）
     * PostgreSQL 实现：DELETE FROM luck_vector_document WHERE vector_type = ?
     *
     * @param vectorType 知识类型（COMPONENT/TEMPLATE/DATASOURCE/BUSINESS）
     * @return 是否删除成功
     */
    @Override
    public boolean deleteByVectorType(String vectorType) {
        if (vectorType == null || vectorType.isEmpty()) {
            log.warn("向量类型为空，跳过删除");
            return false;
        }
        vectorDocumentDao.deleteByVectorType(vectorType);
        log.info("按向量类型删除文档: vectorType={}", vectorType);
        return true;
    }

    /**
     * 按向量类型 + metadata 组合删除（第三层：高级接口）
     * PostgreSQL 实现：DELETE FROM luck_vector_document WHERE vector_type = ? AND metadata @> jsonb
     *
     * @param vectorType 知识类型
     * @param metaKey metadata 字段名
     * @param metaValue 字段值
     * @return 是否删除成功
     */
    @Override
    public boolean deleteByVectorTypeAndMetadata(String vectorType, String metaKey, Object metaValue) {
        if (vectorType == null || vectorType.isEmpty()) {
            log.warn("向量类型为空，跳过删除");
            return false;
        }
        if (metaKey == null || metaKey.isEmpty()) {
            log.warn("metadata 字段名为空，跳过删除");
            return false;
        }

        try {
            // 构建 metadata JSON：单个字段
            Map<String, Object> metadataFilter = new HashMap<>();
            metadataFilter.put(metaKey, metaValue);
            String metadataJson = objectMapper.writeValueAsString(metadataFilter);

            vectorDocumentDao.deleteByVectorTypeAndMetadata(vectorType, metadataJson);
            log.info("按向量类型 + metadata 删除文档: vectorType={}, metadata={}", vectorType, metadataFilter);
            return true;
        } catch (Exception e) {
            log.error("序列化元数据失败: vectorType={}, metaKey={}, metaValue={}, error={}",
                      vectorType, metaKey, metaValue, e.getMessage());
            return false;
        }
    }

    /**
     * 统一向量检索入口
     * 根据 VectorSearchParam 的字段组合过滤条件，委托 DAO 动态拼接 SQL
     *
     * @param param 检索参数，queryVector 必须已生成
     * @return 检索结果列表，按相似度降序排列
     */
    @Override
    public List<VectorStoreSearchResult> search(VectorSearchParam param) {
        if (param.getQueryVector() == null || param.getQueryVector().length == 0) {
            throw new IllegalArgumentException(
                "查询向量 queryVector 必须非空。" +
                "请先调用 EmbeddingService.embed(query) 生成向量，再调用 VectorStore.search()。"
            );
        }

        // idMetaKey 非空但 validIds 为空：无生效知识，直接返回空列表，不检索向量库
        if (param.getIdMetaKey() != null && (param.getValidIds() == null || param.getValidIds().isEmpty())) {
            log.info("无生效知识，跳过检索: vectorType={}, idMetaKey={}", param.getVectorType(), param.getIdMetaKey());
            return new ArrayList<>();
        }

        String queryVectorStr = vectorToString(param.getQueryVector());

        // 序列化 metadataEquals 为 JSON（支持多字段等值过滤）
        String metadataJson = serializeMetadataEquals(param.getMetadataEquals());

        List<VectorDocumentRow> rows = vectorDocumentDao.search(
            queryVectorStr, param.getVectorType(), metadataJson,
            param.getThreshold(), param.getTopK(),
            param.getIdMetaKey(), param.getValidIds()
        );

        List<VectorStoreSearchResult> results = rows.stream()
                .map(this::toSearchResult)
                .collect(Collectors.toList());

        log.info("向量检索: vectorType={}, metadata={}, topK={}, threshold={}, 找到 {} 条结果",
                 param.getVectorType(), param.getMetadataEquals(), param.getTopK(), param.getThreshold(), results.size());
        return results;
    }

    /**
     * 序列化 metadata 等值过滤条件为 JSON 字符串
     *
     * @param metadataEquals metadata 等值过滤 Map，为 null 或空时返回 null
     * @return JSON 字符串，或 null
     */
    private String serializeMetadataEquals(Map<String, Object> metadataEquals) {
        if (metadataEquals == null || metadataEquals.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(metadataEquals);
        } catch (Exception e) {
            log.error("序列化 metadata 过滤条件失败: {}, error: {}", metadataEquals, e.getMessage());
            return null;
        }
    }

    /**
     * 将 VectorDocument 转换为 VectorDocumentRow
     * 用于 Mapper 的插入操作
     * 注意：已去掉content字段，全量内容存储在MySQL中
     *
     * @param doc 向量文档
     * @return 数据库行对象
     */
    private VectorDocumentRow toRow(VectorDocument doc) {
        VectorDocumentRow row = new VectorDocumentRow();
        row.setId(doc.getId());
        row.setVector(vectorToString(doc.getVector()));
        try {
            row.setMetadata(objectMapper.writeValueAsString(doc.getMetadata()));
        } catch (Exception e) {
            log.error("序列化元数据失败: docId={}, error={}", doc.getId(), e.getMessage());
            row.setMetadata("{}");
        }
        row.setVectorType((String) doc.getMetadata().getOrDefault("vectorType", "UNKNOWN"));
        return row;
    }

    /**
     * 将 VectorDocumentRow 转换为 VectorStoreSearchResult
     * 解析 vector 字符串和 metadata JSON
     * 注意：已去掉content字段，返回的Document中content为空字符串
     *
     * @param row 数据库行对象
     * @return 检索结果
     */
    @SuppressWarnings("unchecked")
    private VectorStoreSearchResult toSearchResult(VectorDocumentRow row) {
        float[] vector = parseVectorString(row.getVector());

        Map<String, Object> metadata;
        try {
            metadata = objectMapper.readValue(row.getMetadata(), Map.class);
            if (metadata == null) {
                metadata = new HashMap<>();
            }
        } catch (Exception e) {
            log.error("反序列化元数据失败: rowId={}, error={}", row.getId(), e.getMessage());
            metadata = new HashMap<>();
        }

        // content字段已从向量表中移除，设置为空字符串
        // 实际内容需要从MySQL中根据metadata中的ID查询
        VectorDocument doc = new VectorDocument(row.getId(), "", metadata);
        doc.setVector(vector);
        return new VectorStoreSearchResult(doc, row.getSimilarity() != null ? row.getSimilarity() : 0.0);
    }

    /**
     * 解析向量字符串 "[0.1,0.2,0.3]"
     *
     * @param vectorStr 向量字符串
     * @return float[] 向量数组
     */
    private float[] parseVectorString(String vectorStr) {
        if (vectorStr == null || vectorStr.isEmpty()) {
            return new float[0];
        }
        String cleaned = vectorStr.replace("[", "").replace("]", "").trim();
        if (cleaned.isEmpty()) {
            return new float[0];
        }
        String[] parts = cleaned.split(",");
        float[] result = new float[parts.length];
        for (int i = 0; i < parts.length; i++) {
            result[i] = Float.parseFloat(parts[i].trim());
        }
        return result;
    }

    /**
     * 将 float[] 向量转为 vector 格式字符串 "[0.1,0.2,0.3]"
     *
     * @param vector 向量数组
     * @return vector 格式字符串
     */
    private String vectorToString(float[] vector) {
        if (vector == null || vector.length == 0) {
            return "[]";
        }
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) {
                sb.append(",");
            }
            sb.append(vector[i]);
        }
        sb.append("]");
        return sb.toString();
    }
}
