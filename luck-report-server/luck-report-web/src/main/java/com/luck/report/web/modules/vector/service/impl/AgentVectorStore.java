package com.luck.report.infra.modules.vector.service.impl;

import com.luck.report.infra.modules.vector.service.VectorStore;
import com.luck.report.infra.modules.vector.domain.entity.VectorDocument;
import com.luck.report.infra.modules.vector.domain.dto.VectorStoreSearchResult;
import com.luck.report.infra.modules.vector.domain.param.VectorSearchParam;
import com.luck.report.web.modules.chat.service.impl.EmbeddingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 报表 Agent 向量存储服务（负责向量化 + 存储）
 * 职责：
 * 1. 协调 EmbeddingService 和 VectorStore
 * 2. 文本转向量：调用 EmbeddingService 生成向量
 * 3. 向量存储：调用 VectorStore 存储已向量化的数据
 * 4. 业务回填由调用方（Controller）协调完成
 *
 * 知识类型（vectorType）：
 * - COMPONENT: 组件文档（图表类型、单元格属性、样式属性等）
 * - TEMPLATE: 报表模板/示例
 * - DATASOURCE: 数据源 Schema（表名、字段名、字段类型）
 * - businessTerm: 业务知识/术语（GMV、同比环比等计算公式）
 *
 * @author luck
 */
@Service("bean.agentVectorStore")
public class AgentVectorStore {

    private static final Logger log = LoggerFactory.getLogger(AgentVectorStore.class);

    /** 默认检索条数 */
    private static final int DEFAULT_TOP_K = 5;
    /** 默认相似度阈值 */
    private static final double DEFAULT_THRESHOLD = 0.5;

    @Autowired
    private VectorStore vectorStore;

    @Autowired
    private EmbeddingService embeddingService;

    /**
     * 添加文档到向量存储（使用默认嵌入模型）
     * 职责：先向量化文本，再存储向量
     *
     * @param documents 待添加的文档列表，content 必须非空，vector 可为空（将自动生成）
     */
    public void addDocuments(List<VectorDocument> documents) {
        addDocuments(documents, null);
    }

    /**
     * 添加文档到向量存储（指定嵌入模型）
     * 职责：先向量化文本，再存储向量
     *
     * @param documents 待添加的文档列表，content 必须非空，vector 可为空（将自动生成）
     * @param modelId   嵌入模型配置ID，为null时使用默认嵌入模型
     */
    public void addDocuments(List<VectorDocument> documents, String modelId) {
        Assert.notEmpty(documents, "文档列表不能为空");

        for (VectorDocument doc : documents) {
            Assert.hasText(doc.getContent(), "文档内容不能为空");
            Assert.notNull(doc.getMetadata(), "文档元数据不能为空");
            Assert.isTrue(doc.getMetadata().containsKey("vectorType"),
                    "文档元数据必须包含 vectorType 字段");
        }

        // 职责分离：AgentVectorStore 负责向量化
        // 收集需要生成向量的文档（vector 为空的文档）
        List<VectorDocument> needEmbed = documents.stream()
                .filter(doc -> doc.getVector() == null || doc.getVector().length == 0)
                .collect(Collectors.toList());

        // 批量生成向量
        if (!needEmbed.isEmpty()) {
            List<String> texts = needEmbed.stream()
                    .map(VectorDocument::getContent)
                    .collect(Collectors.toList());
            List<float[]> vectors = embeddingService.embedBatch(texts, modelId);

            // 填充向量到 VectorDocument
            for (int i = 0; i < needEmbed.size(); i++) {
                needEmbed.get(i).setVector(vectors.get(i));
            }
            log.info("成功生成 {} 条文档的向量", needEmbed.size());
        }

        // 调用 VectorStore 存储（此时 vector 已非空）
        vectorStore.add(documents);
        log.info("成功添加 {} 条向量文档到报表向量存储", documents.size());
    }

    /**
     * 添加单条组件文档
     * 职责：先向量化文本，再存储向量
     *
     * @param name          组件名称，如 "柱状图"、"条件样式"
     * @param description   组件描述/用法说明
     * @param componentType 组件类型，如 "chart"、"cell"、"dataset"、"style"
     * @param extraMetadata 额外元数据，可为 null
     */
    public void addComponentDoc(String name, String description, String componentType,
                                 Map<String, Object> extraMetadata) {
        Assert.hasText(name, "组件名称不能为空");
        Assert.hasText(description, "组件描述不能为空");
        Assert.hasText(componentType, "组件类型不能为空");

        // 构建文档内容：名称 + 描述，用于语义检索
        String content = String.format("组件名称: %s, 说明: %s", name, description);

        // 构建元数据
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("vectorType", "COMPONENT");
        metadata.put("name", name);
        metadata.put("componentType", componentType);
        metadata.put("description", description);
        if (extraMetadata != null) {
            metadata.putAll(extraMetadata);
        }

        VectorDocument doc = new VectorDocument(content, metadata);

        // 职责分离：AgentVectorStore 负责向量化
        float[] vector = embeddingService.embed(content);
        doc.setVector(vector);

        // 调用 VectorStore 存储（此时 vector 已非空）
        vectorStore.add(Collections.singletonList(doc));
        log.info("添加组件文档: name={}, componentType={}", name, componentType);
    }

    /**
     * 按知识类型删除文档
     * 职责：调用 VectorStore.deleteByVectorType() 清空某个类型的所有数据
     *
     * @param vectorType 知识类型
     * @return 是否删除成功
     */
    public boolean deleteByVectorType(String vectorType) {
        Assert.hasText(vectorType, "知识类型不能为空");

        // 直接调用 VectorStore 的类型删除接口
        return vectorStore.deleteByVectorType(vectorType);
    }

    /**
     * 按向量类型 + metadata 字段删除文档
     * 职责：调用 VectorStore.deleteByVectorTypeAndMetadata() 删除具体数据
     *
     * @param vectorType 知识类型
     * @param metaKey metadata 字段名（如 "datasourceId", "db_business_term_id"）
     * @param metaValue 字段值
     * @return 是否删除成功
     */
    public boolean deleteByMetadata(String vectorType, String metaKey, Object metaValue) {
        Assert.hasText(vectorType, "知识类型不能为空");
        Assert.hasText(metaKey, "metadata 字段名不能为空");

        // 直接调用 VectorStore 的组合删除接口
        return vectorStore.deleteByVectorTypeAndMetadata(vectorType, metaKey, metaValue);
    }

    /**
     * 向量检索（核心方法）
     * 职责：向量化查询文本 + 调用 VectorStore.search(param)
     * 调用方通过 VectorSearchParam.builder() 构造过滤条件，支持 vectorType/metadataEquals/idMetaKey+validIds
     *
     * @param query 查询文本
     * @param param 检索参数（queryVector 字段会被本方法内部填充，调用方无需设置）
     * @return 检索结果列表
     */
    public List<VectorStoreSearchResult> search(String query, VectorSearchParam param) {
        Assert.hasText(query, "查询文本不能为空");
        Assert.notNull(param, "检索参数不能为空");

        // 第1步：向量化查询文本
        float[] queryVector = embeddingService.embed(query);

        // 第2步：用 toBuilder 补充 queryVector，其余字段保留调用方设置
        VectorSearchParam fullParam = param.toBuilder().queryVector(queryVector).build();

        // 第3步：调用 VectorStore.search() 检索
        List<VectorStoreSearchResult> results = vectorStore.search(fullParam);
        log.debug("向量检索完成: vectorType={}, 查询=\"{}\", 找到 {} 条结果",
                  param.getVectorType(), query, results.size());
        return results;
    }

    /**
     * 向量检索（无过滤条件便捷方法）
     * 职责：向量化查询文本 + 调用 VectorStore.search()
     *
     * @param query 查询文本
     * @param topK 返回条数
     * @param threshold 相似度阈值
     * @return 检索结果列表
     */
    public List<VectorStoreSearchResult> search(String query, int topK, double threshold) {
        Assert.hasText(query, "查询文本不能为空");

        VectorSearchParam param = VectorSearchParam.builder()
                .topK(topK)
                .threshold(threshold)
                .build();
        return search(query, param);
    }

    /**
     * 按知识类型检索（便捷方法，使用默认 topK 和 threshold）
     * 返回原始向量检索结果，content可能为空（向量库不存储原文）
     * 调用方需根据 vectorType 和 metadata 中的ID自行回填原文
     *
     * @param query      查询文本
     * @param vectorType 知识类型
     * @return 检索结果列表
     */
    public List<VectorStoreSearchResult> search(String query, String vectorType) {
        Assert.hasText(query, "查询文本不能为空");
        Assert.hasText(vectorType, "知识类型不能为空");

        VectorSearchParam param = VectorSearchParam.builder()
                .topK(DEFAULT_TOP_K)
                .threshold(DEFAULT_THRESHOLD)
                .vectorType(vectorType)
                .build();
        return search(query, param);
    }
}
