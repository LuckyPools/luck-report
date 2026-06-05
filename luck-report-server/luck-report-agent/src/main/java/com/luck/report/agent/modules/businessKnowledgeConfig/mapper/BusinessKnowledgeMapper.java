package com.luck.report.agent.modules.businessKnowledgeConfig.mapper;

import com.luck.report.agent.modules.businessKnowledgeConfig.domain.entity.BusinessKnowledge;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 业务知识Mapper
 * 操作MySQL的business_knowledge表
 *
 * @author luck
 */
@Mapper
public interface BusinessKnowledgeMapper {

    /**
     * 插入业务知识
     *
     * @param knowledge 业务知识实体
     * @return 影响行数
     */
    @Insert("INSERT INTO business_knowledge (business_term, description, synonyms, enabled, model_id, " +
            "embedding_status, error_msg, is_deleted, created_time, updated_time) " +
            "VALUES (#{businessTerm}, #{description}, #{synonyms}, #{enabled}, #{modelId}, " +
            "#{embeddingStatus}, #{errorMsg}, #{isDeleted}, #{createdTime}, #{updatedTime})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(BusinessKnowledge knowledge);

    /**
     * 根据ID更新业务知识
     *
     * @param knowledge 业务知识实体
     * @return 影响行数
     */
    @Update("UPDATE business_knowledge SET business_term = #{businessTerm}, description = #{description}, " +
            "synonyms = #{synonyms}, enabled = #{enabled}, model_id = #{modelId}, embedding_status = #{embeddingStatus}, " +
            "error_msg = #{errorMsg}, updated_time = #{updatedTime} WHERE id = #{id}")
    int updateById(BusinessKnowledge knowledge);

    /**
     * 根据ID查询业务知识
     *
     * @param id 业务知识ID
     * @return 业务知识实体
     */
    @Select("SELECT id, business_term, description, synonyms, enabled, model_id, embedding_status, " +
            "error_msg, is_deleted, created_time, updated_time FROM business_knowledge WHERE id = #{id} " +
            "AND is_deleted = 0")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "business_term", property = "businessTerm"),
            @Result(column = "description", property = "description"),
            @Result(column = "synonyms", property = "synonyms"),
            @Result(column = "enabled", property = "enabled"),
            @Result(column = "model_id", property = "modelId"),
            @Result(column = "embedding_status", property = "embeddingStatus"),
            @Result(column = "error_msg", property = "errorMsg"),
            @Result(column = "is_deleted", property = "isDeleted"),
            @Result(column = "created_time", property = "createdTime"),
            @Result(column = "updated_time", property = "updatedTime")
    })
    BusinessKnowledge selectById(@Param("id") Long id);

    /**
     * 搜索业务知识
     *
     * @param keyword 搜索关键词
     * @return 业务知识列表
     */
    @Select("SELECT id, business_term, description, synonyms, enabled, model_id, embedding_status, " +
            "error_msg, is_deleted, created_time, updated_time FROM business_knowledge " +
            "WHERE is_deleted = 0 " +
            "AND (business_term LIKE CONCAT('%', #{keyword}, '%') " +
            "OR description LIKE CONCAT('%', #{keyword}, '%') " +
            "OR synonyms LIKE CONCAT('%', #{keyword}, '%')) " +
            "ORDER BY created_time DESC")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "business_term", property = "businessTerm"),
            @Result(column = "description", property = "description"),
            @Result(column = "synonyms", property = "synonyms"),
            @Result(column = "enabled", property = "enabled"),
            @Result(column = "model_id", property = "modelId"),
            @Result(column = "embedding_status", property = "embeddingStatus"),
            @Result(column = "error_msg", property = "errorMsg"),
            @Result(column = "is_deleted", property = "isDeleted"),
            @Result(column = "created_time", property = "createdTime"),
            @Result(column = "updated_time", property = "updatedTime")
    })
    List<BusinessKnowledge> search(@Param("keyword") String keyword);

    /**
     * 查询所有业务知识列表
     *
     * @return 业务知识列表
     */
    @Select("SELECT id, business_term, description, synonyms, enabled, model_id, embedding_status, " +
            "error_msg, is_deleted, created_time, updated_time FROM business_knowledge " +
            "WHERE is_deleted = 0 ORDER BY created_time DESC")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "business_term", property = "businessTerm"),
            @Result(column = "description", property = "description"),
            @Result(column = "synonyms", property = "synonyms"),
            @Result(column = "enabled", property = "enabled"),
            @Result(column = "model_id", property = "modelId"),
            @Result(column = "embedding_status", property = "embeddingStatus"),
            @Result(column = "error_msg", property = "errorMsg"),
            @Result(column = "is_deleted", property = "isDeleted"),
            @Result(column = "created_time", property = "createdTime"),
            @Result(column = "updated_time", property = "updatedTime")
    })
    List<BusinessKnowledge> selectAll();

    /**
     * 逻辑删除业务知识
     *
     * @param id 业务知识ID
     * @param isDeleted 是否删除标记
     * @return 影响行数
     */
    @Update("UPDATE business_knowledge SET is_deleted = #{isDeleted}, updated_time = NOW() WHERE id = #{id}")
    int logicalDelete(@Param("id") Long id, @Param("isDeleted") Integer isDeleted);

    /**
     * 根据ID列表批量查询业务知识
     * 用于向量检索结果回填原文内容
     *
     * @param ids 业务知识ID列表
     * @return 业务知识列表
     */
    @Select("<script>" +
            "SELECT id, business_term, description, synonyms, enabled, model_id, embedding_status, " +
            "error_msg, is_deleted, created_time, updated_time FROM business_knowledge " +
            "WHERE is_deleted = 0 AND id IN " +
            "<foreach collection='ids' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            "</script>")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "business_term", property = "businessTerm"),
            @Result(column = "description", property = "description"),
            @Result(column = "synonyms", property = "synonyms"),
            @Result(column = "enabled", property = "enabled"),
            @Result(column = "model_id", property = "modelId"),
            @Result(column = "embedding_status", property = "embeddingStatus"),
            @Result(column = "error_msg", property = "errorMsg"),
            @Result(column = "is_deleted", property = "isDeleted"),
            @Result(column = "created_time", property = "createdTime"),
            @Result(column = "updated_time", property = "updatedTime")
    })
    List<BusinessKnowledge> selectByIds(@Param("ids") List<Long> ids);
}
