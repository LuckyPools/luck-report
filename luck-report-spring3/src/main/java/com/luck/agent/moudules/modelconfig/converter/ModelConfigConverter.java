package com.luck.agent.moudules.modelconfig.converter;

import com.luck.agent.domain.dto.ModelConfigDTO;
import com.luck.agent.domain.entity.ModelConfig;
import com.luck.agent.domain.enums.ModelType;
import org.springframework.util.Assert;

import java.time.LocalDateTime;

/**
 * 模型配置转换器
 * 用于Entity和DTO之间的相互转换
 *
 * @author luck
 */
public class ModelConfigConverter {

    /**
     * Entity转换为DTO
     * 用于把数据库数据转给前端展示
     *
     * @param entity ModelConfig实体对象
     * @return ModelConfigDTO对象,如果entity为null则返回null
     */
    public static ModelConfigDTO toDTO(ModelConfig entity) {
        if (entity == null) {
            return null;
        }
        return ModelConfigDTO.builder()
                .id(entity.getId())
                .provider(entity.getProvider())
                .baseUrl(entity.getBaseUrl())
                .modelName(entity.getModelName())
                .configName(entity.getConfigName())
                .sort(entity.getSort())
                .temperature(entity.getTemperature())
                .maxTokens(entity.getMaxTokens())
                .isActive(entity.getIsActive())
                .apiKey(entity.getApiKey())
                .modelType(entity.getModelType().getCode())
                .completionsPath(entity.getCompletionsPath())
                .embeddingsPath(entity.getEmbeddingsPath())
                .proxyEnabled(entity.getProxyEnabled())
                .proxyHost(entity.getProxyHost())
                .proxyPort(entity.getProxyPort())
                .proxyUsername(entity.getProxyUsername())
                .proxyPassword(entity.getProxyPassword())
                .build();
    }

    /**
     * DTO转换为Entity
     * 用于新增配置时将前端数据转换为数据库实体
     *
     * @param dto ModelConfigDTO对象
     * @return ModelConfig实体对象
     * @throws IllegalArgumentException dto为null时抛出
     */
    public static ModelConfig toEntity(ModelConfigDTO dto) {
        Assert.notNull(dto, "ModelConfigDTO不能为空");
        ModelConfig entity = new ModelConfig();
        // 新增时ID由数据库生成,所以这里通常不设置ID,或者仅当dto.id有值时设置
        entity.setId(dto.getId());
        entity.setProvider(dto.getProvider());
        entity.setBaseUrl(dto.getBaseUrl());
        // 新增时,DTO里的Key肯定是明文,直接存
        entity.setApiKey(dto.getApiKey());
        entity.setModelName(dto.getModelName());
        entity.setConfigName(dto.getConfigName());
        entity.setSort(dto.getSort() != null ? dto.getSort() : 0);
        entity.setTemperature(dto.getTemperature());
        entity.setMaxTokens(dto.getMaxTokens());
        entity.setModelType(ModelType.fromCode(dto.getModelType()));
        entity.setCompletionsPath(dto.getCompletionsPath());
        entity.setEmbeddingsPath(dto.getEmbeddingsPath());
        entity.setProxyEnabled(dto.getProxyEnabled());
        entity.setProxyHost(dto.getProxyHost());
        entity.setProxyPort(dto.getProxyPort());
        entity.setProxyUsername(dto.getProxyUsername());
        entity.setProxyPassword(dto.getProxyPassword());
        // 默认值处理
        entity.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : false);
        entity.setCreatedTime(LocalDateTime.now());
        entity.setUpdatedTime(LocalDateTime.now());

        return entity;
    }
}