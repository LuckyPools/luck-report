package com.luck.report.chroma.vector.service.impl;

import com.luck.report.infra.modules.vector.domain.entity.VectorDocument;
import com.luck.report.infra.modules.vector.domain.dto.VectorStoreSearchResult;
import com.luck.report.infra.modules.vector.domain.param.VectorSearchParam;
import com.luck.report.infra.modules.vector.service.VectorStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import tech.amikos.chromadb.Client;
import tech.amikos.chromadb.handler.ApiException;
import tech.amikos.chromadb.handler.DefaultApi;
import tech.amikos.chromadb.model.AddEmbedding;
import tech.amikos.chromadb.model.CreateCollection;
import tech.amikos.chromadb.model.DeleteEmbedding;
import tech.amikos.chromadb.model.QueryEmbedding;

import java.util.*;

/**
 * 基于 Chroma 向量数据库的向量存储实现（纯向量操作）
 *
 * 使用 Chroma 底层 DefaultApi（非高层 Collection API），原因：
 * - 高层 Collection.query() 只接受 queryTexts（文本），内部自动用 EmbeddingFunction 转向量
 * - 我们的 VectorStore 接口设计是调用方提供向量，不需要 Chroma 内嵌的 EmbeddingFunction
 * - 底层 DefaultApi.getNearestNeighbors() 支持直接传 queryEmbeddings，符合接口设计
 *
 * 设计原则：
 * 1. 只负责向量数据的存储、检索、删除
 * 2. 不负责文本转向量（这是 EmbeddingService 的职责）
 * 3. 调用 add() 前，VectorDocument.vector 必须已填充
 * 4. 调用 search() 前，queryVector 必须已生成
 *
 * Bean 注册：
 * - 由 ChromaVectorStoreAutoConfiguration.chromaVectorStore() 方法创建
 *
 * Collection 结构
 * {
 *   "id": "文档唯一ID",
 *   "embedding": [向量数组],
 *   "metadata": { vectorType, businessTermId, ... },
 *   "document": "文本内容"
 * }
 *
 * @author luck
 */
public class ChromaVectorStoreImpl implements VectorStore {

    private static final Logger log = LoggerFactory.getLogger(ChromaVectorStoreImpl.class);

    private final Client chromaClient;
    private final DefaultApi api;
    private final String defaultCollectionName;

    /**
     * 构造函数：由 ChromaVectorStoreAutoConfiguration 注入 Client、DefaultApi 和 collectionName
     *
     * @param chromaClient Chroma HTTP 客户端（用于 Collection 管理）
     * @param api Chroma 底层 API（用于直接传向量的增删查操作）
     * @param collectionName 默认 Collection 名称
     */
    public ChromaVectorStoreImpl(Client chromaClient, DefaultApi api, String collectionName) {
        this.chromaClient = chromaClient;
        this.api = api;
        this.defaultCollectionName = collectionName;
        log.info("[ChromaVectorStore] 初始化，默认 Collection: {}", defaultCollectionName);
    }

    // ==================== 第一层：基础接口（必选实现） ====================

    @Override
    public void add(List<VectorDocument> documents) {
        if (documents == null || documents.isEmpty()) {
            log.warn("文档列表为空，跳过添加");
            return;
        }

        for (VectorDocument doc : documents) {
            if (doc.getVector() == null || doc.getVector().length == 0) {
                throw new IllegalArgumentException(
                    String.format("VectorDocument 的 vector 必须非空（docId=%s）。" +
                                  "请先调用 EmbeddingService 生成向量，再调用 VectorStore.add()。",
                                  doc.getId())
                );
            }
        }

        try {
            // 从第一个文档的 metadata 中提取 vectorType，动态选择 Collection
            String vectorType = extractVectorType(documents.get(0));
            String collectionName = vectorType != null
                ? getCollectionNameByVectorType(vectorType)
                : defaultCollectionName;

            // 获取 Collection 的 ID（Chroma 内部用 collectionId 做 API 路径）
            String collectionId = getOrCreateCollectionId(collectionName);
            DefaultApi api = this.api;

            // 构造 AddEmbedding 请求
            List<Object> embeddings = new ArrayList<>();
            List<Map<String, Object>> metadatas = new ArrayList<>();
            List<String> documentsList = new ArrayList<>();
            List<String> ids = new ArrayList<>();

            for (VectorDocument doc : documents) {
                // float[] → List<Float>（Chroma API 需要）
                List<Float> embeddingList = new ArrayList<>(doc.getVector().length);
                for (float v : doc.getVector()) {
                    embeddingList.add(v);
                }
                embeddings.add(embeddingList);

                // metadata: Map<String, Object> → Map<String, Object>（底层 API 支持 Object 值）
                Map<String, Object> metadata = new HashMap<>(doc.getMetadata());
                metadatas.add(metadata);

                documentsList.add(doc.getContent() != null ? doc.getContent() : "");
                ids.add(doc.getId());
            }

            AddEmbedding addRequest = new AddEmbedding();
            addRequest.setIds(ids);
            addRequest.setEmbeddings(embeddings);
            addRequest.setMetadatas(metadatas);
            addRequest.setDocuments(documentsList);

            api.add(addRequest, collectionId);

            log.info("成功添加 {} 条文档到 Chroma 向量存储（Collection: {}, vectorType: {}）",
                     documents.size(), collectionName, vectorType);
        } catch (Exception e) {
            log.error("添加文档到 Chroma 失败: 文档数量={}, error={}", documents.size(), e.getMessage());
            throw new RuntimeException("添加文档到 Chroma 失败", e);
        }
    }

    @Override
    public boolean delete(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            log.warn("ID 列表为空，跳过删除");
            return true;
        }

        try {
            String collectionId = getCollectionId(defaultCollectionName);
            DefaultApi api = this.api;

            DeleteEmbedding deleteRequest = new DeleteEmbedding();
            deleteRequest.setIds(ids);

            api.delete(deleteRequest, collectionId);

            log.info("从 Chroma 删除 {} 条文档（Collection: {}）", ids.size(), defaultCollectionName);
            return true;
        } catch (Exception e) {
            log.error("从 Chroma 删除文档失败: ID数量={}, error={}", ids.size(), e.getMessage());
            return false;
        }
    }

    /**
     * 统一向量检索入口
     * 根据 VectorSearchParam 的字段组合过滤条件，所有检索场景都通过此方法完成
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

        // idMetaKey 非空但 validIds 为空：无生效知识，直接返回空列表
        if (param.getIdMetaKey() != null && (param.getValidIds() == null || param.getValidIds().isEmpty())) {
            log.info("无生效知识，跳过检索: vectorType={}, idMetaKey={}", param.getVectorType(), param.getIdMetaKey());
            return new ArrayList<>();
        }

        try {
            // vectorType 为空时用默认 Collection，非空时按类型分 Collection
            String collectionName = (param.getVectorType() != null && !param.getVectorType().isEmpty())
                ? getCollectionNameByVectorType(param.getVectorType())
                : defaultCollectionName;
            String collectionId = getOrCreateCollectionId(collectionName);
            DefaultApi api = this.api;

            // 统一构建 where 条件（metadataEquals + idMetaKey IN）
            Map<String, Object> where = buildWhere(param.getMetadataEquals(), param.getIdMetaKey(), param.getValidIds());

            QueryEmbedding queryRequest = buildQueryRequest(param.getQueryVector(), param.getTopK(), where);

            Object response = api.getNearestNeighbors(queryRequest, collectionId);

            List<VectorStoreSearchResult> results = convertQueryResponse(response, param.getThreshold());

            log.info("Chroma 向量检索: vectorType={}, metadata={}, topK={}, threshold={}, 找到 {} 条结果",
                     param.getVectorType(), param.getMetadataEquals(), param.getTopK(), param.getThreshold(), results.size());
            return results;
        } catch (Exception e) {
            log.error("Chroma 向量检索失败: vectorType={}, error={}", param.getVectorType(), e.getMessage());
            return new ArrayList<>();
        }
    }

    // ==================== 第二层：常用接口（推荐实现） ====================

    @Override
    public boolean deleteByVectorType(String vectorType) {
        if (vectorType == null || vectorType.isEmpty()) {
            log.warn("向量类型为空，跳过删除");
            return false;
        }

        try {
            // 按 vectorType 分 Collection，删除整个 Collection
            String collectionName = getCollectionNameByVectorType(vectorType);
            chromaClient.deleteCollection(collectionName);
            log.info("删除整个 Collection: {}", collectionName);
            return true;
        } catch (Exception e) {
            log.error("从 Chroma 删除向量类型失败: vectorType={}, error={}", vectorType, e.getMessage());
            return false;
        }
    }

    // ==================== 第三层：高级接口（可选实现） ====================

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
            String collectionName = getCollectionNameByVectorType(vectorType);
            String collectionId = getOrCreateCollectionId(collectionName);
            DefaultApi api = this.api;

            // 构造 where 过滤条件
            Map<String, Object> where = new HashMap<>();
            where.put(metaKey, metaValue);

            DeleteEmbedding deleteRequest = new DeleteEmbedding();
            deleteRequest.setWhere(where);

            api.delete(deleteRequest, collectionId);

            log.info("Chroma 组合删除: Collection={}, where={}={}", collectionName, metaKey, metaValue);
            return true;
        } catch (Exception e) {
            log.error("Chroma 组合删除失败: vectorType={}, metaKey={}, metaValue={}, error={}",
                      vectorType, metaKey, metaValue, e.getMessage());
            return false;
        }
    }

    // ==================== 辅助方法 ====================

    /**
     * 从文档 metadata 中提取 vectorType
     *
     * @param doc 向量文档
     * @return vectorType 值，若不存在则返回 null
     */
    private String extractVectorType(VectorDocument doc) {
        if (doc == null || doc.getMetadata() == null) {
            return null;
        }
        Object vectorTypeObj = doc.getMetadata().get("vectorType");
        return vectorTypeObj != null ? vectorTypeObj.toString() : null;
    }

    /**
     * 根据 vectorType 获取 Collection 名称
     */
    private String getCollectionNameByVectorType(String vectorType) {
        return "luck_vector_" + vectorType.toLowerCase();
    }

    /**
     * 通过 DefaultApi 获取或创建 Collection，返回 Collection 的 UUID
     *
     * 使用 DefaultApi 而非 Client 的原因：
     * - Client.getOrCreateCollection(String) 不存在
     * - Client.createCollection / getCollection 需要 EmbeddingFunction 参数
     * - DefaultApi.createCollection 支持 getOrCreate 标志，且不需要 EmbeddingFunction
     *
     * @param collectionName Collection 名称
     * @return Collection 的 UUID
     */
    @SuppressWarnings("unchecked")
    private String getOrCreateCollectionId(String collectionName) {
        try {
            CreateCollection createRequest = new CreateCollection();
            createRequest.setName(collectionName);
            createRequest.setGetOrCreate(true);

            Object result = api.createCollection(createRequest);

            // 增强日志：打印返回值类型和内容，便于调试
            log.debug("createCollection 返回值类型: {}, 内容: {}",
                     result != null ? result.getClass().getName() : "null", result);

            if (result instanceof Map) {
                Map<String, Object> map = (Map<String, Object>) result;
                Object idObj = map.get("id");
                if (idObj == null) {
                    log.error("createCollection 返回的 Map 中缺少 'id' 字段, Map keys: {}", map.keySet());
                    throw new RuntimeException("Collection created but 'id' field missing in response: " + collectionName);
                }
                return (String) idObj;
            }

            // 返回值类型异常，打印详细信息
            log.error("createCollection 返回值类型异常: 期望 Map, 实际: {}",
                     result != null ? result.getClass().getName() : "null");
            throw new RuntimeException("Failed to get/create collection: " + collectionName +
                                      " (response type: " + (result != null ? result.getClass().getName() : "null") + ")");
        } catch (ApiException e) {
            log.error("createCollection API 调用失败: collectionName={}, code={}, message={}",
                     collectionName, e.getCode(), e.getMessage(), e);
            throw new RuntimeException("Failed to get/create collection: " + collectionName, e);
        }
    }

    /**
     * 通过 DefaultApi 获取已有 Collection 的 UUID
     *
     * @param collectionName Collection 名称
     * @return Collection 的 UUID
     */
    @SuppressWarnings("unchecked")
    private String getCollectionId(String collectionName) {
        try {
            Object result = api.getCollection(collectionName);
            if (result instanceof Map) {
                Map<String, Object> map = (Map<String, Object>) result;
                return (String) map.get("id");
            }
            throw new RuntimeException("Failed to get collection: " + collectionName);
        } catch (ApiException e) {
            throw new RuntimeException("Failed to get collection: " + collectionName, e);
        }
    }

    /**
     * 构建业务ID的 IN 过滤条件
     * Chroma where 语法：{idMetaKey: {"$in": [v1, v2, ...]}}
     *
     * @param idMetaKey metadata 中业务ID字段名，为 null 时返回 null
     * @param validIds 生效的业务ID列表
     * @return Chroma where 条件 Map，或 null 表示不过滤
     */
    private Map<String, Object> buildIdFilter(String idMetaKey, List<String> validIds) {
        if (idMetaKey == null || validIds == null || validIds.isEmpty()) {
            return null;
        }
        Map<String, Object> inClause = new HashMap<>();
        inClause.put("$in", validIds);
        Map<String, Object> where = new HashMap<>();
        where.put(idMetaKey, inClause);
        return where;
    }

    /**
     * 统一构建 Chroma where 条件
     * 组合 metadataEquals（等值过滤）和 idMetaKey IN（业务ID过滤）两种条件
     * - 两者都为空：返回 null（不过滤）
     * - 只有 metadataEquals：返回 {key1: val1, key2: val2, ...}
     * - 只有 idMetaKey IN：返回 {idMetaKey: {"$in": [...]}}
     * - 两者都有：返回 {"$and": [metadataEquals, {idMetaKey: {"$in": [...]}}]}
     *
     * @param metadataEquals metadata 等值过滤 Map，为 null 或空表示不过滤
     * @param idMetaKey 业务ID字段名，为 null 表示不按ID过滤
     * @param validIds 生效的业务ID列表
     * @return Chroma where 条件 Map，或 null 表示不过滤
     */
    private Map<String, Object> buildWhere(Map<String, Object> metadataEquals, String idMetaKey, List<String> validIds) {
        Map<String, Object> metaWhere = null;
        if (metadataEquals != null && !metadataEquals.isEmpty()) {
            metaWhere = new HashMap<>(metadataEquals);
        }

        Map<String, Object> idWhere = buildIdFilter(idMetaKey, validIds);

        // 两者都为空，返回 null
        if (metaWhere == null && idWhere == null) {
            return null;
        }
        // 只有 metadataEquals
        if (metaWhere != null && idWhere == null) {
            return metaWhere;
        }
        // 只有 idMetaKey IN
        if (metaWhere == null) {
            return idWhere;
        }

        // 两者都有，用 $and 组合
        List<Map<String, Object>> andConditions = new ArrayList<>();
        andConditions.add(metaWhere);
        andConditions.add(idWhere);

        Map<String, Object> combinedWhere = new HashMap<>();
        combinedWhere.put("$and", andConditions);
        return combinedWhere;
    }

    /**
     * 构造 QueryEmbedding 请求
     *
     * @param queryVector 查询向量
     * @param topK 返回条数
     * @param where 过滤条件（可为 null）
     * @return QueryEmbedding 请求对象
     */
    private QueryEmbedding buildQueryRequest(float[] queryVector, int topK, Map<String, Object> where) {
        // float[] → List<Float>
        List<Float> embeddingList = new ArrayList<>(queryVector.length);
        for (float v : queryVector) {
            embeddingList.add(v);
        }

        QueryEmbedding queryRequest = new QueryEmbedding();
        queryRequest.setQueryEmbeddings(Collections.singletonList(embeddingList));
        queryRequest.setNResults(topK);
        if (where != null) {
            queryRequest.setWhere(where);
        }

        // 指定返回结果包含的字段
        List<QueryEmbedding.IncludeEnum> include = Arrays.asList(
            QueryEmbedding.IncludeEnum.DOCUMENTS,
            QueryEmbedding.IncludeEnum.DISTANCES,
            QueryEmbedding.IncludeEnum.METADATAS
        );
        queryRequest.setInclude(include);

        return queryRequest;
    }

    /**
     * 转换 Chroma 查询响应为 VectorStoreSearchResult
     *
     * 底层 DefaultApi.getNearestNeighbors() 返回 Object，
     * 实际是 LinkedHashMap，结构如下：
     * {
     *   "ids": [["id1", "id2", ...]],
     *   "distances": [[0.1, 0.2, ...]],
     *   "documents": [["text1", "text2", ...]],
     *   "metadatas": [[{...}, {...}, ...]]
     * }
     *
     * @param response Chroma 查询响应
     * @param threshold 相似度阈值
     * @return 转换后的结果列表
     */
    @SuppressWarnings("unchecked")
    private List<VectorStoreSearchResult> convertQueryResponse(Object response, double threshold) {
        List<VectorStoreSearchResult> results = new ArrayList<>();

        if (!(response instanceof Map)) {
            log.warn("Chroma 响应格式异常，期望 Map，实际: {}", response != null ? response.getClass() : "null");
            return results;
        }

        Map<String, Object> responseMap = (Map<String, Object>) response;

        List<List<String>> idsList = (List<List<String>>) responseMap.get("ids");
        if (idsList == null || idsList.isEmpty()) {
            return results;
        }

        List<String> ids = idsList.get(0);
        List<List<Number>> distancesList = (List<List<Number>>) responseMap.get("distances");
        List<Number> distances = distancesList != null && !distancesList.isEmpty() ? distancesList.get(0) : null;

        List<List<String>> documentsList = (List<List<String>>) responseMap.get("documents");
        List<String> documents = documentsList != null && !documentsList.isEmpty() ? documentsList.get(0) : null;

        List<List<Map<String, Object>>> metadatasList = (List<List<Map<String, Object>>>) responseMap.get("metadatas");
        List<Map<String, Object>> metadatas = metadatasList != null && !metadatasList.isEmpty() ? metadatasList.get(0) : null;

        for (int i = 0; i < ids.size(); i++) {
            // Chroma 返回 distance（L2 距离），转换为相似度
            double distance = distances != null ? distances.get(i).doubleValue() : 0.0;
            double similarity = 1.0 / (1.0 + distance);  // L2 距离转相似度：距离越小相似度越高

            if (similarity < threshold) {
                continue;
            }

            String id = ids.get(i);
            String content = documents != null ? documents.get(i) : "";
            Map<String, Object> metadata = metadatas != null ? metadatas.get(i) : new HashMap<>();

            VectorDocument doc = new VectorDocument(id, content, metadata);

            VectorStoreSearchResult result = new VectorStoreSearchResult(doc, similarity);

            results.add(result);
        }

        return results;
    }
}
