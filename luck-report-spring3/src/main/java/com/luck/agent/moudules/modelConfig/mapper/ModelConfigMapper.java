package com.luck.agent.moudules.modelConfig.mapper;

import com.luck.agent.domain.entity.ModelConfig;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 模型配置Mapper接口
 * 提供模型配置数据的CRUD操作
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
    @Select("SELECT id, provider, base_url, api_key, model_name, config_name, sort, temperature, is_active, max_tokens, " +
            "model_type, completions_path, embeddings_path, created_time, updated_time, is_deleted, " +
            "proxy_enabled, proxy_host, proxy_port, proxy_username, proxy_password " +
            "FROM model_config WHERE is_deleted = 0 ORDER BY sort ASC, created_time DESC")
    List<ModelConfig> findAll();

    /**
     * 根据ID查询模型配置
     *
     * @param id 配置ID
     * @return ModelConfig对象,不存在则返回null
     */
    @Select("SELECT id, provider, base_url, api_key, model_name, config_name, sort, temperature, is_active, max_tokens, " +
            "model_type, completions_path, embeddings_path, created_time, updated_time, is_deleted, " +
            "proxy_enabled, proxy_host, proxy_port, proxy_username, proxy_password " +
            "FROM model_config WHERE id = #{id} AND is_deleted = 0")
    ModelConfig findById(Integer id);

    /**
     * 根据模型类型查询所有激活的配置列表
     *
     * @param modelType 模型类型(CHAT/EMBEDDING)
     * @return 激活的模型配置列表,按排序字段升序排列
     */
    @Select("SELECT id, provider, base_url, api_key, model_name, config_name, sort, temperature, is_active, max_tokens, " +
            "model_type, completions_path, embeddings_path, created_time, updated_time, is_deleted, " +
            "proxy_enabled, proxy_host, proxy_port, proxy_username, proxy_password " +
            "FROM model_config WHERE model_type = #{modelType} AND is_active = 1 AND is_deleted = 0 ORDER BY sort ASC, created_time DESC")
    List<ModelConfig> selectActiveListByType(@Param("modelType") String modelType);

    /**
     * 根据模型类型统计激活的配置数量
     *
     * @param modelType 模型类型(CHAT/EMBEDDING)
     * @return 激活的配置数量
     */
    @Select("SELECT COUNT(*) FROM model_config WHERE model_type = #{modelType} AND is_active = 1 AND is_deleted = 0")
    int countActiveByType(@Param("modelType") String modelType);

    /**
     * 插入新的模型配置
     *
     * @param modelConfig 模型配置实体
     * @return 影响的行数
     */
    @Insert("INSERT INTO model_config (provider, base_url, api_key, model_name, config_name, sort, temperature, is_active, max_tokens, " +
            "model_type, completions_path, embeddings_path, created_time, updated_time, is_deleted, " +
            "proxy_enabled, proxy_host, proxy_port, proxy_username, proxy_password) " +
            "VALUES (#{provider}, #{baseUrl}, #{apiKey}, #{modelName}, #{configName}, #{sort}, #{temperature}, #{isActive}, #{maxTokens}, " +
            "#{modelType}, #{completionsPath}, #{embeddingsPath}, NOW(), NOW(), 0, " +
            "#{proxyEnabled}, #{proxyHost}, #{proxyPort}, #{proxyUsername}, #{proxyPassword})")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    int insert(ModelConfig modelConfig);

    /**
     * 更新模型配置
     * 使用动态SQL,只更新非null的字段
     *
     * @param modelConfig 模型配置实体
     * @return 影响的行数
     */
    @Update("<script>" +
            "UPDATE model_config " +
            "<trim prefix='SET' suffixOverrides=','>" +
            "<if test='provider != null'>provider = #{provider},</if>" +
            "<if test='baseUrl != null'>base_url = #{baseUrl},</if>" +
            "<if test='apiKey != null'>api_key = #{apiKey},</if>" +
            "<if test='modelName != null'>model_name = #{modelName},</if>" +
            "<if test='configName != null'>config_name = #{configName},</if>" +
            "<if test='sort != null'>sort = #{sort},</if>" +
            "<if test='temperature != null'>temperature = #{temperature},</if>" +
            "<if test='isActive != null'>is_active = #{isActive},</if>" +
            "<if test='maxTokens != null'>max_tokens = #{maxTokens},</if>" +
            "<if test='modelType != null'>model_type = #{modelType},</if>" +
            "<if test='completionsPath != null'>completions_path = #{completionsPath},</if>" +
            "<if test='embeddingsPath != null'>embeddings_path = #{embeddingsPath},</if>" +
            "<if test='isDeleted != null'>is_deleted = #{isDeleted},</if>" +
            "<if test='proxyEnabled != null'>proxy_enabled = #{proxyEnabled},</if>" +
            "<if test='proxyHost != null'>proxy_host = #{proxyHost},</if>" +
            "<if test='proxyPort != null'>proxy_port = #{proxyPort},</if>" +
            "<if test='proxyUsername != null'>proxy_username = #{proxyUsername},</if>" +
            "<if test='proxyPassword != null'>proxy_password = #{proxyPassword},</if>" +
            "updated_time = NOW()" +
            "</trim>" +
            "WHERE id = #{id}" +
            "</script>")
    int updateById(ModelConfig modelConfig);

    /**
     * 删除模型配置(逻辑删除)
     *
     * @param id 配置ID
     * @return 影响的行数
     */
    @Update("UPDATE model_config SET is_deleted = 1 WHERE id = #{id}")
    int deleteById(Integer id);
}
