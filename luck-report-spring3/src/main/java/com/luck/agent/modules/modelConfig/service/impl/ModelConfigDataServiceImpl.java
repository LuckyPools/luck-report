package com.luck.agent.modules.modelConfig.service.impl;

import com.luck.agent.modules.modelConfig.domain.dto.ModelConfigDTO;
import com.luck.agent.modules.modelConfig.domain.entity.ModelConfig;
import com.luck.agent.modules.modelConfig.domain.enums.ModelType;
import com.luck.agent.modules.modelConfig.converter.ModelConfigConverter;
import com.luck.agent.modules.modelConfig.mapper.ModelConfigMapper;
import com.luck.agent.modules.modelConfig.service.ModelConfigDataService;
import com.luck.agent.util.CacheUtils;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 模型配置数据服务实现类
 * 提供模型配置的基础CRUD操作实现
 *
 * @author luck
 */
@Slf4j
@Service
@AllArgsConstructor
public class ModelConfigDataServiceImpl implements ModelConfigDataService {

    private final ModelConfigMapper modelConfigMapper;

    /**
     * 根据ID查询模型配置
     *
     * @param id 配置ID
     * @return ModelConfig实体对象,不存在则返回null
     */
    @Override
    public ModelConfig findById(Integer id) {
        return modelConfigMapper.findById(id);
    }

    /**
     * 启用模型配置
     * 将指定ID的配置设置为启用状态，不禁用同类型的其他配置
     *
     * @param id 要启用的配置ID
     */
    @Transactional(rollbackFor = Exception.class)
    @Override
    public void activateConfig(Integer id) {
        ModelConfig entity = modelConfigMapper.findById(id);
        if (entity == null) {
            throw new RuntimeException("配置不存在");
        }

        // 启用当前配置
        entity.setIsActive(true);
        entity.setUpdatedTime(LocalDateTime.now());
        modelConfigMapper.updateById(entity);

        // 清空模型配置缓存
        CacheUtils.clearModelConfigCache();
        log.info("已启用模型配置: id={}, modelName={}", id, entity.getModelName());
    }

    /**
     * 禁用模型配置
     * 将指定ID的配置设置为禁用状态
     * 如果该类型只有一个启用的模型，则不允许禁用，至少保留一个可用模型
     *
     * @param id 要禁用的配置ID
     * @throws RuntimeException 当该类型只有一个启用的模型时抛出
     */
    @Transactional(rollbackFor = Exception.class)
    @Override
    public void deactivateConfig(Integer id) {
        ModelConfig entity = modelConfigMapper.findById(id);
        if (entity == null) {
            throw new RuntimeException("配置不存在");
        }

        // 检查是否是该类型唯一激活的模型
        int activeCount = modelConfigMapper.countActiveByType(entity.getModelType().getCode());
        if (activeCount <= 1 && Boolean.TRUE.equals(entity.getIsActive())) {
            throw new RuntimeException("该类型只有一个启用的模型，至少需要保留一个可用模型，无法禁用");
        }

        // 禁用当前配置
        entity.setIsActive(false);
        entity.setUpdatedTime(LocalDateTime.now());
        modelConfigMapper.updateById(entity);

        // 清空模型配置缓存
        CacheUtils.clearModelConfigCache();
        log.info("已禁用模型配置: id={}, modelName={}", id, entity.getModelName());
    }

    /**
     * 根据模型类型获取所有激活的配置列表
     *
     * @param modelType 模型类型
     * @return ModelConfigDTO列表
     */
    @Override
    public List<ModelConfigDTO> listActiveConfigsByType(ModelType modelType) {
        String cacheKey = modelType == ModelType.CHAT
                ? CacheUtils.ACTIVE_CHAT_MODELS_KEY
                : CacheUtils.ACTIVE_EMBEDDING_MODELS_KEY;

        // 先从缓存读取
        List<ModelConfigDTO> cachedList = CacheUtils.get(cacheKey);
        if (cachedList != null) {
            log.debug("从缓存获取激活模型列表: modelType={}", modelType);
            return cachedList;
        }

        // 从数据库查询
        List<ModelConfig> entities = modelConfigMapper.selectActiveListByType(modelType.getCode());
        List<ModelConfigDTO> dtoList = entities.stream()
                .map(ModelConfigConverter::toDTO)
                .collect(Collectors.toList());

        // 存入缓存
        CacheUtils.put(cacheKey, dtoList);
        log.info("从数据库加载激活模型列表并缓存: modelType={}, count={}", modelType, dtoList.size());

        return dtoList;
    }

    /**
     * 根据模型类型统计激活的配置数量
     *
     * @param modelType 模型类型
     * @return 激活的配置数量
     */
    @Override
    public int countActiveConfigsByType(ModelType modelType) {
        return modelConfigMapper.countActiveByType(modelType.getCode());
    }

    /**
     * 获取所有模型配置列表
     *
     * @return ModelConfigDTO列表
     */
    @Override
    public List<ModelConfigDTO> listConfigs() {
        return modelConfigMapper.findAll().stream()
                .map(ModelConfigConverter::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * 新增模型配置
     *
     * @param dto ModelConfigDTO对象
     */
    @Override
    public void addConfig(ModelConfigDTO dto) {
        clean(dto);
        // 只存库,不切换
        modelConfigMapper.insert(ModelConfigConverter.toEntity(dto));
        // 清空模型配置缓存
        CacheUtils.clearModelConfigCache();
        log.info("新增模型配置: modelName={}", dto.getModelName());
    }

    /**
     * 清理DTO中的字符串字段
     * 去除字符串两端的空格
     *
     * @param dto ModelConfigDTO对象
     */
    private void clean(ModelConfigDTO dto) {
        dto.setModelName(dto.getModelName().trim());
        dto.setBaseUrl(dto.getBaseUrl().trim());
        if (dto.getApiKey() != null) {
            dto.setApiKey(dto.getApiKey().trim());
        }
        if (dto.getCompletionsPath() != null) {
            dto.setCompletionsPath(dto.getCompletionsPath().trim());
        }
        if (dto.getEmbeddingsPath() != null) {
            dto.setEmbeddingsPath(dto.getEmbeddingsPath().trim());
        }
    }

    /**
     * 更新模型配置到数据库(不处理热切换)
     *
     * @param dto ModelConfigDTO对象
     * @return 更新后的ModelConfig实体
     */
    @Transactional(rollbackFor = Exception.class)
    @Override
    public ModelConfig updateConfigInDb(ModelConfigDTO dto) {
        clean(dto);
        // 1. 查旧数据
        ModelConfig entity = modelConfigMapper.findById(dto.getId());
        if (entity == null) {
            throw new RuntimeException("配置不存在");
        }

        // 不准更改模型类型
        if (!entity.getModelType().getCode().equals(dto.getModelType())) {
            throw new RuntimeException("模型类型不允许修改");
        }

        // 2. 合并字段
        mergeDtoToEntity(dto, entity);
        entity.setUpdatedTime(LocalDateTime.now());

        // 3. 更新数据库
        modelConfigMapper.updateById(entity);

        // 清空模型配置缓存
        CacheUtils.clearModelConfigCache();
        log.info("更新模型配置: id={}, modelName={}", dto.getId(), dto.getModelName());

        return entity;
    }

    /**
     * 将DTO字段合并到Entity
     *
     * @param dto ModelConfigDTO对象
     * @param oldEntity 已存在的ModelConfig实体
     */
    private static void mergeDtoToEntity(ModelConfigDTO dto, ModelConfig oldEntity) {
        oldEntity.setProvider(dto.getProvider());
        oldEntity.setBaseUrl(dto.getBaseUrl());
        oldEntity.setModelName(dto.getModelName());
        oldEntity.setConfigName(dto.getConfigName());
        oldEntity.setSort(dto.getSort());
        oldEntity.setTemperature(dto.getTemperature());
        oldEntity.setMaxTokens(dto.getMaxTokens());
        oldEntity.setCompletionsPath(dto.getCompletionsPath());
        oldEntity.setEmbeddingsPath(dto.getEmbeddingsPath());
        oldEntity.setUpdatedTime(LocalDateTime.now());
        oldEntity.setProxyEnabled(dto.getProxyEnabled());
        oldEntity.setProxyHost(dto.getProxyHost());
        oldEntity.setProxyPort(dto.getProxyPort());
        oldEntity.setProxyUsername(dto.getProxyUsername());
        oldEntity.setProxyPassword(dto.getProxyPassword());

        // 只有当前端传来的Key不包含"****"时,才说明用户真的改了Key,否则保持原样
        if (dto.getApiKey() != null && !dto.getApiKey().contains("****")) {
            oldEntity.setApiKey(dto.getApiKey());
        }
    }

    /**
     * 删除模型配置
     *
     * @param id 配置ID
     */
    @Override
    public void deleteConfig(Integer id) {
        // 1. 先查询是否存在
        ModelConfig entity = modelConfigMapper.findById(id);
        if (entity == null) {
            throw new RuntimeException("配置不存在");
        }

        // 2. 如果是激活状态,检查是否是该类型唯一激活的模型
        if (Boolean.TRUE.equals(entity.getIsActive())) {
            int activeCount = modelConfigMapper.countActiveByType(entity.getModelType().getCode());
            if (activeCount <= 1) {
                throw new RuntimeException("该类型只有一个启用的模型，至少需要保留一个可用模型，无法删除");
            }
        }

        // 3. 执行删除逻辑
        entity.setIsDeleted(1);
        entity.setUpdatedTime(LocalDateTime.now());
        int updated = modelConfigMapper.updateById(entity);
        if (updated == 0) {
            throw new RuntimeException("删除失败");
        }

        // 清空模型配置缓存
        CacheUtils.clearModelConfigCache();
        log.info("删除模型配置: id={}, modelName={}", id, entity.getModelName());
    }

    /**
     * 根据模型类型获取激活的配置
     * 从激活的模型列表中获取第一个作为默认配置
     *
     * @param modelType 模型类型
     * @return ModelConfigDTO对象,不存在则返回null
     */
    @Override
    public ModelConfigDTO getActiveConfigByType(ModelType modelType) {
        List<ModelConfigDTO> activeConfigs = listActiveConfigsByType(modelType);
        if (activeConfigs == null || activeConfigs.isEmpty()) {
            log.warn("未找到类型[{}]的激活模型配置", modelType);
            return null;
        }
        // 返回第一个激活的配置作为默认配置
        return activeConfigs.get(0);
    }

    /**
     * 根据模型ID获取对话模型配置（带缓存）
     * 如果未传modelId，则使用默认激活的第一个对话模型
     * 优先从缓存读取，缓存不存在时从数据库查询并写入缓存
     *
     * @param modelId 模型配置ID，可为null
     * @return ModelConfig 对话模型配置
     * @throws RuntimeException 当找不到可用的对话模型时抛出
     */
    @Override
    public ModelConfig getChatConfig(Integer modelId) {
        if (modelId != null) {
            // 根据ID获取指定模型配置，优先从缓存读取
            String cacheKey = CacheUtils.MODEL_BY_ID_PREFIX + modelId;
            ModelConfig cachedConfig = CacheUtils.get(cacheKey, ModelConfig.class);
            if (cachedConfig != null) {
                log.debug("从缓存获取模型配置: id={}", modelId);
                return cachedConfig;
            }

            // 缓存不存在，从数据库查询
            ModelConfig config = modelConfigMapper.findById(modelId);
            if (config == null) {
                throw new RuntimeException("未找到模型配置: ID=" + modelId);
            }

            // 写入缓存
            CacheUtils.put(cacheKey, config);
            log.debug("从数据库加载模型配置并缓存: id={}, modelName={}", modelId, config.getModelName());

            if (!Boolean.TRUE.equals(config.getIsActive())) {
                log.warn("模型配置未启用: ID={}, modelName={}", modelId, config.getModelName());
            }
            return config;
        }

        // 未传modelId，获取默认激活的第一个对话模型
        ModelConfigDTO dto = getActiveConfigByType(ModelType.CHAT);
        if (dto == null) {
            throw new RuntimeException("无可用的对话模型配置，请先在模型配置页面启用对话模型");
        }

        log.info("使用默认对话模型: id={}, modelName={}", dto.getId(), dto.getModelName());
        return ModelConfigConverter.toEntity(dto);
    }
}
