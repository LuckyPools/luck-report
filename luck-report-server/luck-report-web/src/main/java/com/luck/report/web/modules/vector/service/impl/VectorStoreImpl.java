package com.luck.report.web.modules.vector.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.luck.report.web.modules.vector.domain.entity.VectorDocumentRow;
import com.luck.report.web.modules.chat.service.impl.EmbeddingService;
import com.luck.report.web.modules.vector.mapper.VectorDocumentMapper;
import com.luck.report.web.modules.vector.service.VectorStore;
import com.luck.report.web.modules.vector.domain.entity.VectorDocument;
import com.luck.report.web.modules.vector.domain.dto.VectorStoreSearchResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 基于 PostgreSQL + vector 的向量存储实现
 * 使用 vector 扩展进行向量存储和相似度检索，支持元数据过滤
 * SQL 操作委托给 VectorDocumentMapper，由 Mapper 层通过 @DataSource("vector") 切换数据源
 *
 * 前置条件：
 * 1. PostgreSQL 安装 vector 扩展：CREATE EXTENSION IF NOT EXISTS vector;
 * 2. 创建向量文档表（见 init-schema.sql）
 *
 * 检索策略：
 * - 先通过 SQL WHERE 过滤 metadata（缩小候选集）
 * - 再使用 vector 的 <=> 操作符进行余弦距离排序
 * - 最后按相似度阈值过滤
 *
 * @author luck
 */
@Repository
@ConditionalOnProperty(name = "luck-report.vector.enabled", havingValue = "true", matchIfMissing = true)
public class VectorStoreImpl implements VectorStore {

    private static final Logger log = LoggerFactory.getLogger(VectorStoreImpl.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private VectorDocumentMapper vectorDocumentMapper;

    @Autowired
    private EmbeddingService embeddingService;

    /**
     * 添加文档到 PostgreSQL（使用默认嵌入模型）
     * 如果文档的 vector 为空，自动调用 EmbeddingService 生成向量
     *
     * @param documents 待添加的文档列表
     */
    @Override
    public void add(List<VectorDocument> documents) {
        add(documents, null);
    }

    /**
     * 添加文档到 PostgreSQL（指定嵌入模型）
     * 如果文档的 vector 为空，自动调用 EmbeddingService 生成向量
     *
     * @param documents 待添加的文档列表
     * @param modelId   嵌入模型配置ID，为null时使用默认嵌入模型
     */
    @Override
    public void add(List<VectorDocument> documents, String modelId) {
        if (documents == null || documents.isEmpty()) {
            return;
        }

        // 收集需要生成向量的文档
        List<VectorDocument> needEmbed = documents.stream()
                .filter(doc -> doc.getVector() == null || doc.getVector().length == 0)
                .collect(Collectors.toList());

        // 批量生成向量
        if (!needEmbed.isEmpty()) {
            List<String> texts = needEmbed.stream()
                    .map(VectorDocument::getContent)
                    .collect(Collectors.toList());
            List<float[]> vectors = embeddingService.embedBatch(texts, modelId);
            for (int i = 0; i < needEmbed.size(); i++) {
                needEmbed.get(i).setVector(vectors.get(i));
            }
        }

        // 逐条插入 PostgreSQL（通过 Mapper）
        for (VectorDocument doc : documents) {
            VectorDocumentRow row = toRow(doc);
            vectorDocumentMapper.insertOrUpdate(row);
        }

        log.info("成功添加 {} 条文档到向量存储", documents.size());
    }

    /**
     * 按文档ID删除
     *
     * @param ids 文档ID列表
     * @return 是否删除成功
     */
    @Override
    public boolean delete(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return true;
        }
        vectorDocumentMapper.deleteByIds(ids);
        log.info("删除 {} 条文档", ids.size());
        return true;
    }

    /**
     * 按元数据条件删除
     * 使用 PostgreSQL 的 jsonb 操作符进行元数据匹配
     * 根据 metadataFilter 中是否包含 vectorType 选择不同的 Mapper 方法
     *
     * @param metadataFilter 元数据过滤条件
     * @return 是否删除成功
     */
    @Override
    public boolean deleteByMetadata(Map<String, Object> metadataFilter) {
        if (metadataFilter == null || metadataFilter.isEmpty()) {
            log.warn("元数据过滤条件为空，跳过删除");
            return false;
        }

        String vectorType = (String) metadataFilter.get("vectorType");
        Map<String, Object> otherFilters = new HashMap<>(metadataFilter);
        otherFilters.remove("vectorType");

        try {
            if (vectorType != null && !otherFilters.isEmpty()) {
                // 同时按 vectorType 和 metadata 过滤
                String metadataJson = objectMapper.writeValueAsString(otherFilters);
                vectorDocumentMapper.deleteByVectorTypeAndMetadata(vectorType, metadataJson);
            } else if (vectorType != null) {
                // 仅按 vectorType 过滤
                vectorDocumentMapper.deleteByVectorType(vectorType);
            } else if (!otherFilters.isEmpty()) {
                // 仅按 metadata 过滤
                String metadataJson = objectMapper.writeValueAsString(otherFilters);
                vectorDocumentMapper.deleteByMetadata(metadataJson);
            }
        } catch (Exception e) {
            log.error("序列化元数据失败: metadataFilter={}, error={}", metadataFilter, e.getMessage());
            return false;
        }

        log.info("按元数据删除文档, 过滤条件: {}", metadataFilter);
        return true;
    }

    /**
     * 向量相似度检索
     * 使用 vector 的余弦距离操作符 <=> 进行 ANN 检索
     * 根据 metadataFilter 的内容选择对应的 Mapper 方法
     *
     * @param queryVector   查询向量
     * @param topK          返回条数
     * @param threshold     相似度阈值
     * @param metadataFilter 元数据过滤条件
     * @return 检索结果列表
     */
    @Override
    public List<VectorStoreSearchResult> search(float[] queryVector, int topK, double threshold,
                                                Map<String, Object> metadataFilter) {
        String queryVectorStr = vectorToString(queryVector);

        List<VectorDocumentRow> rows;

        if (metadataFilter == null || metadataFilter.isEmpty()) {
            // 无过滤条件
            rows = vectorDocumentMapper.searchWithoutFilter(queryVectorStr, threshold, topK);
        } else {
            String vectorType = (String) metadataFilter.get("vectorType");
            Map<String, Object> otherFilters = new HashMap<>(metadataFilter);
            otherFilters.remove("vectorType");

            try {
                if (vectorType != null && !otherFilters.isEmpty()) {
                    // 按 vectorType + metadata 过滤
                    String metadataJson = objectMapper.writeValueAsString(otherFilters);
                    rows = vectorDocumentMapper.searchByVectorTypeAndMetadata(queryVectorStr, vectorType, metadataJson, threshold, topK);
                } else if (vectorType != null) {
                    // 仅按 vectorType 过滤
                    rows = vectorDocumentMapper.searchByVectorType(queryVectorStr, vectorType, threshold, topK);
                } else if (!otherFilters.isEmpty()) {
                    // 仅按 metadata 过滤
                    String metadataJson = objectMapper.writeValueAsString(otherFilters);
                    rows = vectorDocumentMapper.searchByMetadata(queryVectorStr, metadataJson, threshold, topK);
                } else {
                    // metadataFilter 为空（只有 vectorType=null 被移除后）
                    rows = vectorDocumentMapper.searchWithoutFilter(queryVectorStr, threshold, topK);
                }
            } catch (Exception e) {
                log.error("序列化元数据失败: metadataFilter={}, error={}", metadataFilter, e.getMessage());
                return new ArrayList<>();
            }
        }

        // 将 VectorDocumentRow 转换为 VectorStoreSearchResult
        return rows.stream()
                .map(this::toSearchResult)
                .collect(Collectors.toList());
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
