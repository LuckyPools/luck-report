package com.luck.report.web.modules.agentKnowledgeConfig.converter;

import com.luck.report.web.modules.agentKnowledgeConfig.domain.dto.CreateAgentKnowledgeDTO;
import com.luck.report.web.modules.agentKnowledgeConfig.domain.dto.UpdateAgentKnowledgeDTO;
import com.luck.report.web.modules.agentKnowledgeConfig.domain.entity.AgentKnowledge;
import com.luck.report.web.modules.agentKnowledgeConfig.domain.enums.EmbeddingStatus;
import com.luck.report.web.modules.agentKnowledgeConfig.domain.enums.KnowledgeType;
import com.luck.report.web.modules.agentKnowledgeConfig.domain.vo.AgentKnowledgeVO;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 智能体知识转换器
 * 用于Entity、DTO、VO之间的相互转换
 *
 * @author luck
 */
@Component("bean.agentKnowledgeConverter")
public class AgentKnowledgeConverter {

    /**
     * 将Entity转换为VO
     *
     * @param entity 智能体知识实体
     * @return 智能体知识VO
     */
    public AgentKnowledgeVO toVo(AgentKnowledge entity) {
        if (entity == null) {
            return null;
        }
        return AgentKnowledgeVO.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .type(entity.getType() != null ? entity.getType().getValue() : null)
                .question(entity.getQuestion())
                .content(entity.getContent())
                .enabled(entity.getEnabled() != null && entity.getEnabled() == 1)
                .embeddingStatus(entity.getEmbeddingStatus() != null ? entity.getEmbeddingStatus().getValue() : null)
                .errorMsg(entity.getErrorMsg())
                .splitterType(entity.getSplitterType())
                .modelId(entity.getModelId())
                .createdTime(entity.getCreatedTime())
                .updatedTime(entity.getUpdatedTime())
                .build();
    }

    /**
     * 将CreateDTO转换为Entity
     *
     * @param dto 创建智能体知识DTO
     * @return 智能体知识实体
     */
    public AgentKnowledge toEntityForCreate(CreateAgentKnowledgeDTO dto) {
        if (dto == null) {
            return null;
        }
        LocalDateTime now = LocalDateTime.now();

        // 设置分块策略，默认为token
        String splitterType = dto.getSplitterType();
        if (StringUtils.isBlank(splitterType)) {
            splitterType = "token";
        }

        AgentKnowledge knowledge = AgentKnowledge.builder()
                .title(dto.getTitle())
                .type(KnowledgeType.fromValue(dto.getType()))
                .question(dto.getQuestion())
                .content(dto.getContent())
                .enabled(1)
                .embeddingStatus(EmbeddingStatus.PENDING)
                .splitterType(splitterType)
                .modelId(dto.getModelId())
                .isDeleted(0)
                .isResourceCleaned(0)
                .createdTime(now)
                .updatedTime(now)
                .build();

        // 文档类型时设置文件信息
        if (dto.getFile() != null && !dto.getFile().isEmpty()) {
            knowledge.setSourceFilename(dto.getFile().getOriginalFilename());
            knowledge.setFileSize(dto.getFile().getSize());
            knowledge.setFileType(dto.getFile().getContentType());
        }

        return knowledge;
    }

    /**
     * 将UpdateDTO应用到Entity
     *
     * @param entity 智能体知识实体
     * @param dto 更新智能体知识DTO
     * @return 更新后的智能体知识实体
     */
    public AgentKnowledge applyUpdateToEntity(AgentKnowledge entity, UpdateAgentKnowledgeDTO dto) {
        if (entity == null || dto == null) {
            return entity;
        }
        if (dto.getTitle() != null) {
            entity.setTitle(dto.getTitle());
        }
        if (dto.getContent() != null) {
            entity.setContent(dto.getContent());
        }
        if (dto.getModelId() != null) {
            entity.setModelId(dto.getModelId());
        }
        entity.setUpdatedTime(LocalDateTime.now());
        return entity;
    }
}
