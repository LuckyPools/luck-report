package com.luck.report.infra.modules.vector.service;

import com.luck.report.infra.modules.vector.domain.entity.VectorDocument;
import com.luck.report.infra.modules.vector.domain.dto.VectorStoreSearchResult;
import com.luck.report.infra.modules.vector.domain.param.VectorSearchParam;

import java.util.List;

/**
 * 向量存储接口（纯向量操作，不负责向量化）
 * 参照 Spring AI 的 VectorStore 接口，适配 JDK 8 简化实现
 * 定义向量文档的增删查核心操作，底层实现可切换（PostgreSQL/Milvus/Chroma）
 *
 * 设计原则：
 * 1. VectorStore 只关心向量数据的存储、检索、删除
 * 2. 不负责文本转向量的工作（这是 EmbeddingService 的职责）
 * 3. 调用 add() 方法前，VectorDocument.vector 必须已经填充（非空）
 * 4. 调用 search() 方法前，VectorSearchParam.queryVector 必须已经生成（非空）
 *
 * @author luck
 */
public interface VectorStore {

    /**
     * 添加向量到存储
     * 要求：documents 中的 vector 必须非空，否则抛出 IllegalArgumentException
     * 注意：不再负责向量化，调用方需确保 VectorDocument.vector 已填充
     *
     * @param documents 向量文档列表，vector 必须已生成
     * @throws IllegalArgumentException 如果 documents 中的 vector 为空
     */
    void add(List<VectorDocument> documents);

    /**
     * 按文档ID删除（所有向量库必须支持）
     * 这是最基础的删除操作，所有向量库都能实现
     *
     * @param ids 文档ID列表
     * @return 是否删除成功
     */
    boolean delete(List<String> ids);

    /**
     * 按向量类型删除（大部分向量库支持）
     * 语义明确：删除某个 Collection/Table 的所有数据
     *
     * 实现难度：
     * - PostgreSQL: DELETE FROM table WHERE vector_type = ?
     * - Chroma: collection.delete(where={"vectorType": type})
     * - Milvus: collection.delete(expr='vectorType == "COMPONENT"')
     * - Pinecone: index.delete(filter={"vectorType": {"$eq": type}})
     *
     * @param vectorType 知识类型（COMPONENT/TEMPLATE/DATASOURCE/BUSINESS）
     * @return 是否删除成功
     * @throws UnsupportedOperationException 如果向量库不支持此操作
     */
    boolean deleteByVectorType(String vectorType);

    /**
     * 按向量类型 + metadata 组合删除（部分向量库支持）
     * 语义明确：删除某个类型中，metadata 字段等于指定值的数据
     *
     * 实现难度：
     * - PostgreSQL: DELETE FROM table WHERE vector_type = ? AND metadata->>'key' = 'value'
     * - Chroma: collection.delete(where={"vectorType": type, "key": value})
     * - Milvus: collection.delete(expr='vectorType == "COMPONENT" && metadata["key"] == "value"')
     * - Pinecone: index.delete(filter={"vectorType": {"$eq": type}, "key": {"$eq": value}})
     *
     * @param vectorType 知识类型
     * @param metaKey metadata 字段名（如 "datasourceId", "componentType", "db_business_term_id"）
     * @param metaValue 字段值
     * @return 是否删除成功
     * @throws UnsupportedOperationException 如果向量库不支持此操作
     */
    boolean deleteByVectorTypeAndMetadata(String vectorType, String metaKey, Object metaValue);

    /**
     * 统一向量检索入口
     * 根据 VectorSearchParam 的字段组合过滤条件，所有检索场景都通过此方法完成
     *
     * 过滤条件组合（由调用方填充 param 字段决定）：
     * - vectorType 为 null：全库检索（基础检索）
     * - vectorType 非空：按类型检索
     * - metadataEquals 非空：追加 metadata 等值过滤
     * - idMetaKey 非空 + validIds 非空：追加业务ID IN 过滤
     * - idMetaKey 非空 + validIds 为空：直接返回空列表（无生效知识，不检索向量库）
     *
     * @param param 检索参数，queryVector 必须已生成（非空）
     * @return 检索结果列表，按相似度降序排列
     * @throws IllegalArgumentException 如果 queryVector 为空
     */
    List<VectorStoreSearchResult> search(VectorSearchParam param);
}
