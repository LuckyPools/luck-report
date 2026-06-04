package com.luck.agent.moudules.businessKnowledgeConfig.converter;

import com.luck.agent.moudules.businessKnowledgeConfig.dto.CreateBusinessKnowledgeDTO;
import com.luck.agent.moudules.businessKnowledgeConfig.dto.UpdateBusinessKnowledgeDTO;
import com.luck.agent.moudules.businessKnowledgeConfig.entity.BusinessKnowledge;
import com.luck.agent.moudules.businessKnowledgeConfig.enums.EmbeddingStatus;
import com.luck.agent.moudules.businessKnowledgeConfig.vo.BusinessKnowledgeVO;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 业务知识转换器
 * 用于Entity、DTO、VO之间的相互转换
 *
 * @author luck
 */
@Component
public class BusinessKnowledgeConverter {

    /**
     * 将Entity转换为VO
     *
     * @param entity 业务知识实体
     * @return 业务知识VO
     */
    public BusinessKnowledgeVO toVo(BusinessKnowledge entity) {
        if (entity == null) {
            return null;
        }
        return BusinessKnowledgeVO.builder()
                .id(entity.getId())
                .businessTerm(entity.getBusinessTerm())
                .description(entity.getDescription())
                .synonyms(entity.getSynonyms())
                .isRecall(entity.getIsRecall() != null && entity.getIsRecall() == 1)
                .modelId(entity.getModelId())
                .createdTime(entity.getCreatedTime())
                .updatedTime(entity.getUpdatedTime())
                .embeddingStatus(entity.getEmbeddingStatus() != null ? entity.getEmbeddingStatus().getValue() : null)
                .errorMsg(entity.getErrorMsg())
                .build();
    }

    /**
     * 将CreateDTO转换为Entity
     *
     * @param dto 创建业务知识DTO
     * @return 业务知识实体
     */
    public BusinessKnowledge toEntityForCreate(CreateBusinessKnowledgeDTO dto) {
        if (dto == null) {
            return null;
        }
        LocalDateTime now = LocalDateTime.now();
        return BusinessKnowledge.builder()
                .businessTerm(dto.getBusinessTerm())
                .description(dto.getDescription())
                .synonyms(dto.getSynonyms())
                .isRecall(dto.getIsRecall() != null && dto.getIsRecall() ? 1 : 0)
                .modelId(dto.getModelId())
                .embeddingStatus(EmbeddingStatus.PENDING)
                .isDeleted(0)
                .createdTime(now)
                .updatedTime(now)
                .build();
    }

    /**
     * 将UpdateDTO应用到Entity
     *
     * @param entity 业务知识实体
     * @param dto 更新业务知识DTO
     * @return 更新后的业务知识实体
     */
    public BusinessKnowledge applyUpdateToEntity(BusinessKnowledge entity, UpdateBusinessKnowledgeDTO dto) {
        if (entity == null || dto == null) {
            return entity;
        }
        entity.setBusinessTerm(dto.getBusinessTerm());
        entity.setDescription(dto.getDescription());
        entity.setSynonyms(dto.getSynonyms());
        entity.setModelId(dto.getModelId());
        entity.setUpdatedTime(LocalDateTime.now());
        return entity;
    }
}