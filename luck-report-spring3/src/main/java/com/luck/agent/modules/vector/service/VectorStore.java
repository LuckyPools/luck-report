package com.luck.agent.modules.vector.service;

import com.luck.agent.modules.vector.domain.entity.VectorDocument;
import com.luck.agent.modules.vector.domain.dto.VectorStoreSearchResult;

import java.util.List;
import java.util.Map;

/**
 * 向量存储接口
 * 参照 Spring AI 的 VectorStore 接口，适配 JDK 8 简化实现
 * 定义向量文档的增删查核心操作，底层实现可切换（PostgreSQL/Milvus/内存）
 *
 * @author luck
 */
public interface VectorStore {

    /**
     * 添加文档到向量存储
     * 文档的 vector 字段如果为空，由实现类负责调用 EmbeddingService 生成
     *
     * @param documents 待添加的文档列表
     */
    void add(List<VectorDocument> documents);

    /**
     * 按文档ID删除
     *
     * @param ids 文档ID列表
     * @return 是否删除成功
     */
    boolean delete(List<String> ids);

    /**
     * 按元数据条件删除
     * 满足所有 metadata 条件的文档将被删除
     *
     * @param metadataFilter 元数据过滤条件，key=字段名, value=期望值
     * @return 是否删除成功
     */
    boolean deleteByMetadata(Map<String, Object> metadataFilter);

    /**
     * 向量相似度检索
     * 先按 metadataFilter 过滤候选集，再计算余弦相似度，返回 topK 结果
     *
     * @param queryVector 查询向量
     * @param topK 返回条数
     * @param threshold 相似度阈值（0~1），低于此阈值的结果被过滤
     * @param metadataFilter 元数据过滤条件，可为 null 表示不过滤
     * @return 检索结果列表，按相似度降序排列
     */
    List<VectorStoreSearchResult> search(float[] queryVector, int topK, double threshold,
                                         Map<String, Object> metadataFilter);
}
