package com.luck.report.agent.modules.modelConfig.mapper;

import com.luck.report.agent.modules.modelConfig.domain.dto.ModelConfigQueryDTO;
import com.luck.report.agent.modules.modelConfig.domain.entity.ModelConfig;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 模型配置Mapper接口
 * 提供模型配置数据的CRUD操作
 * SQL 定义在 resources/mapper/{databaseId}/ModelConfigMapper.xml 中，支持多数据库方言
 *
 * @author luck
 */
@Mapper
public interface ModelConfigMapper {

    /**
     * 查询所有未删除的模型配置
     *
     * @return 模型配置列表,按排序字段升序排列
     */
    List<ModelConfig> findAll();

    /**
     * 根据ID查询模型配置
     *
     * @param id 配置ID
     * @return ModelConfig对象,不存在则返回null
     */
    ModelConfig findById(String id);

    /**
     * 根据模型类型查询所有激活的配置列表
     *
     * @param modelType 模型类型(CHAT/EMBEDDING)
     * @return 激活的模型配置列表,按排序字段升序排列
     */
    List<ModelConfig> selectActiveListByType(@Param("modelType") String modelType);

    /**
     * 根据模型类型统计激活的配置数量
     *
     * @param modelType 模型类型(CHAT/EMBEDDING)
     * @return 激活的配置数量
     */
    int countActiveByType(@Param("modelType") String modelType);

    /**
     * 插入新的模型配置
     * createdTime/updatedTime 由 Java 侧赋值，不依赖数据库函数
     *
     * @param modelConfig 模型配置实体
     * @return 影响的行数
     */
    int insert(ModelConfig modelConfig);

    /**
     * 更新模型配置
     * 动态SQL只更新非null的字段，updatedTime 由 Java 侧赋值
     *
     * @param modelConfig 模型配置实体
     * @return 影响的行数
     */
    int updateById(ModelConfig modelConfig);

    /**
     * 删除模型配置(逻辑删除)
     *
     * @param id 配置ID
     * @return 影响的行数
     */
    int deleteById(String id);

    /**
     * 分页条件查询模型配置
     * 分页由拦截器自动改写，SQL 中无需手写 LIMIT
     *
     * @param queryDTO 查询条件
     * @param offset   偏移量
     * @return 模型配置列表
     */
    List<ModelConfig> selectByConditionsWithPage(@Param("queryDTO") ModelConfigQueryDTO queryDTO,
                                                     @Param("offset") Integer offset,
                                                     @Param("pageSize") Integer pageSize);

    /**
     * 统计符合条件的模型配置数量
     *
     * @param queryDTO 查询条件
     * @return 符合条件的记录数
     */
    Long countByConditions(@Param("queryDTO") ModelConfigQueryDTO queryDTO);
}
