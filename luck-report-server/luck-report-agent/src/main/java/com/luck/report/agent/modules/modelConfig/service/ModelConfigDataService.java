package com.luck.report.agent.modules.modelConfig.service;

import com.luck.report.common.domain.vo.PageResultVO;
import com.luck.report.agent.modules.modelConfig.domain.dto.ModelConfigDTO;
import com.luck.report.agent.modules.modelConfig.domain.dto.ModelConfigQueryDTO;
import com.luck.report.agent.modules.modelConfig.domain.entity.ModelConfig;
import com.luck.report.agent.modules.modelConfig.domain.enums.ModelType;

import java.util.List;

/**
 * 模型配置数据服务接口
 * 提供模型配置的基础CRUD操作
 *
 * @author luck
 */
public interface ModelConfigDataService {

    /**
     * 根据ID查询模型配置
     *
     * @param id 配置ID
     * @return ModelConfig实体对象,不存在则返回null
     */
    ModelConfig findById(Integer id);

    /**
     * 启用模型配置
     * 将指定ID的配置设置为启用状态，不禁用同类型的其他配置
     *
     * @param id 要启用的配置ID
     */
    void activateConfig(Integer id);

    /**
     * 禁用模型配置
     * 将指定ID的配置设置为禁用状态
     * 如果该类型只有一个启用的模型，则不允许禁用，至少保留一个可用模型
     *
     * @param id 要禁用的配置ID
     * @throws RuntimeException 当该类型只有一个启用的模型时抛出
     */
    void deactivateConfig(Integer id);

    /**
     * 根据模型类型获取所有激活的配置列表
     *
     * @param modelType 模型类型
     * @return ModelConfigDTO列表
     */
    List<ModelConfigDTO> listActiveConfigsByType(ModelType modelType);

    /**
     * 根据模型类型统计激活的配置数量
     *
     * @param modelType 模型类型
     * @return 激活的配置数量
     */
    int countActiveConfigsByType(ModelType modelType);

    /**
     * 获取所有模型配置列表
     *
     * @return ModelConfigDTO列表
     */
    List<ModelConfigDTO> listConfigs();

    /**
     * 新增模型配置
     *
     * @param dto ModelConfigDTO对象
     */
    void addConfig(ModelConfigDTO dto);

    /**
     * 更新模型配置到数据库(不处理热切换)
     *
     * @param dto ModelConfigDTO对象
     * @return 更新后的ModelConfig实体
     */
    ModelConfig updateConfigInDb(ModelConfigDTO dto);

    /**
     * 删除模型配置
     *
     * @param id 配置ID
     */
    void deleteConfig(Integer id);

    /**
     * 根据模型类型获取激活的配置
     *
     * @param modelType 模型类型
     * @return ModelConfigDTO对象,不存在则返回null
     */
    ModelConfigDTO getActiveConfigByType(ModelType modelType);

    /**
     * 根据模型ID获取对话模型配置（带缓存）
     * 如果未传modelId，则使用默认激活的第一个对话模型
     * 优先从缓存读取，缓存不存在时从数据库查询并写入缓存
     *
     * @param modelId 模型配置ID，可为null
     * @return Index 对话模型配置
     * @throws RuntimeException 当找不到可用的对话模型时抛出
     */
    ModelConfig getChatConfig(Integer modelId);

    /**
     * 分页条件查询模型配置
     *
     * @param queryDTO 查询条件
     * @return 分页结果
     */
    PageResultVO<ModelConfigDTO> queryByPage(ModelConfigQueryDTO queryDTO);
}
