package com.luck.report.web.modules.businessKnowledgeConfig.utils;

import com.luck.report.web.modules.businessKnowledgeConfig.constant.DocumentMetadataConstant;
import com.luck.report.web.modules.businessKnowledgeConfig.domain.entity.BusinessKnowledge;
import com.luck.report.infra.modules.vector.domain.entity.VectorDocument;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * 文档转换工具类
 * 用于将业务对象转换为向量文档对象
 *
 * @author luck
 */
public final class DocumentConverterUtil {

    /**
     * 将业务知识转换为向量文档
     * 用于向量存储操作
     *
     * @param businessKnowledge 业务知识实体
     * @return 向量文档对象
     */
    public static VectorDocument convertBusinessKnowledgeToDocument(BusinessKnowledge businessKnowledge) {
        // 构建文档内容，包含业务名词、说明和同义词
        String businessTerm = businessKnowledge.getBusinessTerm();
        String description = Optional.ofNullable(businessKnowledge.getDescription()).orElse("无");
        String synonyms = Optional.ofNullable(businessKnowledge.getSynonyms()).orElse("无");

        String content = String.format("业务名词: %s, 说明: %s, 同义词: %s", businessTerm, description, synonyms);

        // 构建元数据
        Map<String, Object> metadata = new HashMap<>();
        metadata.put(DocumentMetadataConstant.VECTOR_TYPE, DocumentMetadataConstant.BUSINESS_TERM);
        metadata.put(DocumentMetadataConstant.DB_BUSINESS_TERM_ID, businessKnowledge.getId());

        return new VectorDocument(content, metadata);
    }

    /**
     * 私有构造方法，防止实例化
     */
    private DocumentConverterUtil() {
        throw new AssertionError("Cannot instantiate utility class");
    }
}
