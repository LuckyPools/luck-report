package com.luck.report.web.modules.vector.service.impl;

import com.luck.report.web.modules.vector.service.VectorStore;
import com.luck.report.web.modules.vector.domain.entity.VectorDocument;
import com.luck.report.web.modules.vector.domain.dto.VectorStoreSearchResult;
import com.luck.report.web.modules.chat.service.impl.EmbeddingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import java.util.*;

/**
 * 报表 Agent 向量存储服务
 * 提供纯向量操作能力，不包含业务回填逻辑
 * 业务回填由调用方（Controller）协调完成
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
     * 将业务数据封装为 VectorDocument，设置必要的元数据后存储
     *
     * @param documents 待添加的文档列表
     */
    public void addDocuments(List<VectorDocument> documents) {
        addDocuments(documents, null);
    }

    /**
     * 添加文档到向量存储（指定嵌入模型）
     * 将业务数据封装为 VectorDocument，设置必要的元数据后存储
     *
     * @param documents 待添加的文档列表
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

        vectorStore.add(documents, modelId);
        log.info("成功添加 {} 条文档到报表向量存储", documents.size());
    }

    /**
     * 添加单条组件文档
     * 将组件信息封装为 VectorDocument，自动构建 content 和 metadata
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
        vectorStore.add(Collections.singletonList(doc), null);
        log.info("添加组件文档: name={}, componentType={}", name, componentType);
    }

    /**
     * 按知识类型删除文档
     *
     * @param vectorType 知识类型
     * @return 是否删除成功
     */
    public boolean deleteByVectorType(String vectorType) {
        Assert.hasText(vectorType, "知识类型不能为空");
        Map<String, Object> filter = new HashMap<>();
        filter.put("vectorType", vectorType);
        return vectorStore.deleteByMetadata(filter);
    }

    /**
     * 按元数据条件删除文档
     * 满足所有 metadata 条件的文档将被删除
     *
     * @param metadataFilter 元数据过滤条件，key=字段名, value=期望值
     * @return 是否删除成功
     */
    public boolean deleteByMetadata(Map<String, Object> metadataFilter) {
        Assert.notNull(metadataFilter, "元数据过滤条件不能为空");
        Assert.isTrue(!metadataFilter.isEmpty(), "元数据过滤条件不能为空");
        return vectorStore.deleteByMetadata(metadataFilter);
    }

    /**
     * 按知识类型检索文档
     * 返回原始向量检索结果，content可能为空（向量库不存储原文）
     * 调用方需根据 vectorType 和 metadata 中的ID自行回填原文
     *
     * @param query      查询文本
     * @param vectorType 知识类型
     * @return 检索结果列表
     */
    public List<VectorStoreSearchResult> search(String query, String vectorType) {
        return search(query, vectorType, DEFAULT_TOP_K, DEFAULT_THRESHOLD, null);
    }

    /**
     * 按知识类型检索文档（自定义 topK 和阈值）
     * 返回原始向量检索结果，content可能为空（向量库不存储原文）
     * 调用方需根据 vectorType 和 metadata 中的ID自行回填原文
     *
     * @param query        查询文本
     * @param vectorType   知识类型
     * @param topK         返回条数
     * @param threshold    相似度阈值
     * @param extraFilters 额外元数据过滤条件，可为 null
     * @return 检索结果列表
     */
    public List<VectorStoreSearchResult> search(String query, String vectorType, int topK,
                                                 double threshold, Map<String, Object> extraFilters) {
        Assert.hasText(query, "查询文本不能为空");
        Assert.hasText(vectorType, "知识类型不能为空");

        // 将查询文本转为向量
        float[] queryVector = embeddingService.embed(query);

        // 构建元数据过滤条件
        Map<String, Object> metadataFilter = new HashMap<>();
        metadataFilter.put("vectorType", vectorType);
        if (extraFilters != null) {
            metadataFilter.putAll(extraFilters);
        }

        List<VectorStoreSearchResult> results = vectorStore.search(queryVector, topK, threshold, metadataFilter);
        log.debug("向量检索完成: vectorType={}, 查询=\"{}\", 找到 {} 条结果", vectorType, query, results.size());
        return results;
    }
}
