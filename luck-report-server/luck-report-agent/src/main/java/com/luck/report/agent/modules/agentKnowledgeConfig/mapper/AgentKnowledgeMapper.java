package com.luck.report.agent.modules.agentKnowledgeConfig.mapper;

import com.luck.report.agent.modules.agentKnowledgeConfig.domain.dto.AgentKnowledgeQueryDTO;
import com.luck.report.agent.modules.agentKnowledgeConfig.domain.entity.AgentKnowledge;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 智能体知识Mapper
 * 操作MySQL的agent_knowledge表
 *
 * @author luck
 */
@Mapper
public interface AgentKnowledgeMapper {

    /**
     * 插入智能体知识
     *
     * @param knowledge 智能体知识实体
     * @return 影响行数
     */
    @Insert("INSERT INTO agent_knowledge (title, type, question, content, enabled, " +
            "embedding_status, error_msg, source_filename, file_path, file_size, file_type, " +
            "splitter_type, model_id, is_deleted, is_resource_cleaned, created_time, updated_time) " +
            "VALUES (#{title}, #{type}, #{question}, #{content}, #{enabled}, " +
            "#{embeddingStatus}, #{errorMsg}, #{sourceFilename}, #{filePath}, #{fileSize}, #{fileType}, " +
            "#{splitterType}, #{modelId}, #{isDeleted}, #{isResourceCleaned}, #{createdTime}, #{updatedTime})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(AgentKnowledge knowledge);

    /**
     * 根据ID更新智能体知识（动态更新非空字段）
     *
     * @param knowledge 智能体知识实体
     * @return 影响行数
     */
    @Update("<script>" +
            "UPDATE agent_knowledge " +
            "<set>" +
            "<if test='title != null'>title = #{title},</if>" +
            "<if test='content != null'>content = #{content},</if>" +
            "<if test='type != null'>type = #{type},</if>" +
            "<if test='question != null'>question = #{question},</if>" +
            "<if test='enabled != null'>enabled = #{enabled},</if>" +
            "<if test='embeddingStatus != null'>embedding_status = #{embeddingStatus},</if>" +
            "<if test='errorMsg != null'>error_msg = #{errorMsg},</if>" +
            "<if test='sourceFilename != null'>source_filename = #{sourceFilename},</if>" +
            "<if test='filePath != null'>file_path = #{filePath},</if>" +
            "<if test='fileSize != null'>file_size = #{fileSize},</if>" +
            "<if test='fileType != null'>file_type = #{fileType},</if>" +
            "<if test='splitterType != null'>splitter_type = #{splitterType},</if>" +
            "<if test='modelId != null'>model_id = #{modelId},</if>" +
            "<if test='isDeleted != null'>is_deleted = #{isDeleted},</if>" +
            "<if test='isResourceCleaned != null'>is_resource_cleaned = #{isResourceCleaned},</if>" +
            "updated_time = NOW()" +
            "</set>" +
            "WHERE id = #{id}" +
            "</script>")
    int update(AgentKnowledge knowledge);

    /**
     * 根据ID查询智能体知识（排除已删除）
     *
     * @param id 智能体知识ID
     * @return 智能体知识实体
     */
    @Select("SELECT id, title, type, question, content, enabled, embedding_status, " +
            "error_msg, source_filename, file_path, file_size, file_type, splitter_type, model_id, " +
            "is_deleted, is_resource_cleaned, created_time, updated_time " +
            "FROM agent_knowledge WHERE id = #{id} AND is_deleted = 0")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "title", property = "title"),
            @Result(column = "type", property = "type"),
            @Result(column = "question", property = "question"),
            @Result(column = "content", property = "content"),
            @Result(column = "enabled", property = "enabled"),
            @Result(column = "embedding_status", property = "embeddingStatus"),
            @Result(column = "error_msg", property = "errorMsg"),
            @Result(column = "source_filename", property = "sourceFilename"),
            @Result(column = "file_path", property = "filePath"),
            @Result(column = "file_size", property = "fileSize"),
            @Result(column = "file_type", property = "fileType"),
            @Result(column = "splitter_type", property = "splitterType"),
            @Result(column = "model_id", property = "modelId"),
            @Result(column = "is_deleted", property = "isDeleted"),
            @Result(column = "is_resource_cleaned", property = "isResourceCleaned"),
            @Result(column = "created_time", property = "createdTime"),
            @Result(column = "updated_time", property = "updatedTime")
    })
    AgentKnowledge selectById(@Param("id") Long id);

    /**
     * 分页条件查询智能体知识
     *
     * @param queryDTO 查询条件
     * @param offset 偏移量
     * @return 智能体知识列表
     */
    @Select("<script>" +
            "SELECT id, title, type, question, content, enabled, embedding_status, " +
            "error_msg, source_filename, file_path, file_size, file_type, splitter_type, model_id, " +
            "is_deleted, is_resource_cleaned, created_time, updated_time " +
            "FROM agent_knowledge " +
            "WHERE is_deleted = 0 " +
            "<if test='queryDTO.title != null and queryDTO.title != \"\"'>" +
            "AND title LIKE CONCAT('%', #{queryDTO.title}, '%') " +
            "</if>" +
            "<if test='queryDTO.type != null and queryDTO.type != \"\"'>" +
            "AND type = #{queryDTO.type} " +
            "</if>" +
            "<if test='queryDTO.embeddingStatus != null and queryDTO.embeddingStatus != \"\"'>" +
            "AND embedding_status = #{queryDTO.embeddingStatus} " +
            "</if>" +
            "ORDER BY created_time DESC " +
            "LIMIT #{offset}, #{queryDTO.pageSize}" +
            "</script>")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "title", property = "title"),
            @Result(column = "type", property = "type"),
            @Result(column = "question", property = "question"),
            @Result(column = "content", property = "content"),
            @Result(column = "enabled", property = "enabled"),
            @Result(column = "embedding_status", property = "embeddingStatus"),
            @Result(column = "error_msg", property = "errorMsg"),
            @Result(column = "source_filename", property = "sourceFilename"),
            @Result(column = "file_path", property = "filePath"),
            @Result(column = "file_size", property = "fileSize"),
            @Result(column = "file_type", property = "fileType"),
            @Result(column = "splitter_type", property = "splitterType"),
            @Result(column = "model_id", property = "modelId"),
            @Result(column = "is_deleted", property = "isDeleted"),
            @Result(column = "is_resource_cleaned", property = "isResourceCleaned"),
            @Result(column = "created_time", property = "createdTime"),
            @Result(column = "updated_time", property = "updatedTime")
    })
    List<AgentKnowledge> selectByConditionsWithPage(@Param("queryDTO") AgentKnowledgeQueryDTO queryDTO,
                                                     @Param("offset") Integer offset);

    /**
     * 统计符合条件的智能体知识数量
     *
     * @param queryDTO 查询条件
     * @return 符合条件的记录数
     */
    @Select("<script>" +
            "SELECT COUNT(*) FROM agent_knowledge " +
            "WHERE is_deleted = 0 " +
            "<if test='queryDTO.title != null and queryDTO.title != \"\"'>" +
            "AND title LIKE CONCAT('%', #{queryDTO.title}, '%') " +
            "</if>" +
            "<if test='queryDTO.type != null and queryDTO.type != \"\"'>" +
            "AND type = #{queryDTO.type} " +
            "</if>" +
            "<if test='queryDTO.embeddingStatus != null and queryDTO.embeddingStatus != \"\"'>" +
            "AND embedding_status = #{queryDTO.embeddingStatus} " +
            "</if>" +
            "</script>")
    Long countByConditions(@Param("queryDTO") AgentKnowledgeQueryDTO queryDTO);

    /**
     * 查询所有生效的智能体知识ID列表
     *
     * @return 生效的智能体知识ID列表
     */
    @Select("SELECT id FROM agent_knowledge WHERE enabled = 1 AND is_deleted = 0")
    List<Long> selectEnabledKnowledgeIds();

    /**
     * 根据ID列表批量查询智能体知识
     * 用于向量检索结果回填原文内容
     *
     * @param ids 智能体知识ID列表
     * @return 智能体知识实体列表
     */
    @Select("<script>" +
            "SELECT id, title, type, question, content, enabled, embedding_status, " +
            "error_msg, source_filename, file_path, file_size, file_type, splitter_type, model_id, " +
            "is_deleted, is_resource_cleaned, created_time, updated_time " +
            "FROM agent_knowledge " +
            "WHERE id IN " +
            "<foreach collection='ids' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            "AND is_deleted = 0" +
            "</script>")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "title", property = "title"),
            @Result(column = "type", property = "type"),
            @Result(column = "question", property = "question"),
            @Result(column = "content", property = "content"),
            @Result(column = "enabled", property = "enabled"),
            @Result(column = "embedding_status", property = "embeddingStatus"),
            @Result(column = "error_msg", property = "errorMsg"),
            @Result(column = "source_filename", property = "sourceFilename"),
            @Result(column = "file_path", property = "filePath"),
            @Result(column = "file_size", property = "fileSize"),
            @Result(column = "file_type", property = "fileType"),
            @Result(column = "splitter_type", property = "splitterType"),
            @Result(column = "model_id", property = "modelId"),
            @Result(column = "is_deleted", property = "isDeleted"),
            @Result(column = "is_resource_cleaned", property = "isResourceCleaned"),
            @Result(column = "created_time", property = "createdTime"),
            @Result(column = "updated_time", property = "updatedTime")
    })
    List<AgentKnowledge> selectByIds(@Param("ids") List<Long> ids);
}
