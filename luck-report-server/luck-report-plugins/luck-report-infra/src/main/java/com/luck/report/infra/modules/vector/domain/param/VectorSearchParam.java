package com.luck.report.infra.modules.vector.domain.param;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

/**
 * 向量检索参数
 * 封装所有检索条件，替代原来多参数的 search 方法，便于扩展和维护
 *
 * 字段说明：
 * - queryVector：必填，由 AgentVectorStore 向量化后填充；直接调用 VectorStore 时必须已生成
 * - vectorType：可选，为 null 表示全库检索
 * - metadataEquals：可选，metadata 等值过滤（支持多字段），为 null 或空表示不过滤
 * - idMetaKey + validIds：可选，业务ID动态过滤
 *
 * idMetaKey + validIds 组合语义：
 * - idMetaKey 为 null：忽略 validIds，不按业务ID过滤
 * - idMetaKey 非空 且 validIds 非空：按 metadata 中 idMetaKey 字段做 IN 过滤
 * - idMetaKey 非空 且 validIds 为空：直接返回空列表（无生效知识，不检索）
 *
 * @author luck
 */
@Getter
@Builder(toBuilder = true)
public class VectorSearchParam {

    /** 查询向量，必填，调用 VectorStore 前必须已生成 */
    private final float[] queryVector;

    /** 返回条数，必填 */
    private final int topK;

    /** 相似度阈值（0~1），必填，低于此阈值的结果被过滤 */
    private final double threshold;

    /** 知识类型（如 COMPONENT/TABLE/COLUMN/businessTerm），可选，为 null 表示全库检索 */
    private final String vectorType;

    /** metadata 等值过滤条件，可选，为 null 或空表示不过滤 */
    private final Map<String, Object> metadataEquals;

    /** metadata 中业务ID字段名（如 "businessTermId"），可选，为 null 表示不按ID过滤 */
    private final String idMetaKey;

    /** 生效的业务ID列表，可选，idMetaKey 非空时为空则返回空列表 */
    private final List<String> validIds;
}
