package com.luck.report.agent.modules.datasource.mapper;

import com.luck.report.agent.modules.datasource.domain.entity.LogicalRelation;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 逻辑外键Mapper
 * 操作MySQL的luck_logical_relation表
 *
 * @author luck
 */
@Mapper
public interface LogicalRelationMapper {

    /**
     * 插入逻辑外键
     *
     * @param relation 逻辑外键实体
     * @return 影响行数
     */
    @Insert("INSERT INTO luck_logical_relation (datasource_id, source_table_name, source_column_name, " +
            "target_table_name, target_column_name, relation_type, description) " +
            "VALUES (#{datasourceId}, #{sourceTableName}, #{sourceColumnName}, " +
            "#{targetTableName}, #{targetColumnName}, #{relationType}, #{description})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(LogicalRelation relation);

    /**
     * 根据ID更新逻辑外键
     *
     * @param relation 逻辑外键实体
     * @return 影响行数
     */
    @Update("UPDATE luck_logical_relation SET source_table_name = #{sourceTableName}, " +
            "source_column_name = #{sourceColumnName}, target_table_name = #{targetTableName}, " +
            "target_column_name = #{targetColumnName}, relation_type = #{relationType}, " +
            "description = #{description} WHERE id = #{id}")
    int updateById(LogicalRelation relation);

    /**
     * 根据ID查询逻辑外键
     *
     * @param id 逻辑外键ID
     * @return 逻辑外键实体
     */
    @Select("SELECT id, datasource_id, source_table_name, source_column_name, " +
            "target_table_name, target_column_name, relation_type, description, " +
            "is_deleted, created_time, updated_time " +
            "FROM luck_logical_relation WHERE id = #{id} AND is_deleted = 0")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "datasource_id", property = "datasourceId"),
            @Result(column = "source_table_name", property = "sourceTableName"),
            @Result(column = "source_column_name", property = "sourceColumnName"),
            @Result(column = "target_table_name", property = "targetTableName"),
            @Result(column = "target_column_name", property = "targetColumnName"),
            @Result(column = "relation_type", property = "relationType"),
            @Result(column = "description", property = "description"),
            @Result(column = "is_deleted", property = "isDeleted"),
            @Result(column = "created_time", property = "createdTime"),
            @Result(column = "updated_time", property = "updatedTime")
    })
    LogicalRelation selectById(@Param("id") Integer id);

    /**
     * 按数据源ID查询逻辑外键列表
     *
     * @param datasourceId 数据源ID
     * @return 逻辑外键列表
     */
    @Select("SELECT id, datasource_id, source_table_name, source_column_name, " +
            "target_table_name, target_column_name, relation_type, description, " +
            "is_deleted, created_time, updated_time " +
            "FROM luck_logical_relation WHERE datasource_id = #{datasourceId} AND is_deleted = 0 " +
            "ORDER BY created_time DESC")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "datasource_id", property = "datasourceId"),
            @Result(column = "source_table_name", property = "sourceTableName"),
            @Result(column = "source_column_name", property = "sourceColumnName"),
            @Result(column = "target_table_name", property = "targetTableName"),
            @Result(column = "target_column_name", property = "targetColumnName"),
            @Result(column = "relation_type", property = "relationType"),
            @Result(column = "description", property = "description"),
            @Result(column = "is_deleted", property = "isDeleted"),
            @Result(column = "created_time", property = "createdTime"),
            @Result(column = "updated_time", property = "updatedTime")
    })
    List<LogicalRelation> selectByDatasourceId(@Param("datasourceId") Integer datasourceId);

    /**
     * 逻辑删除逻辑外键
     *
     * @param id 逻辑外键ID
     * @return 影响行数
     */
    @Update("UPDATE luck_logical_relation SET is_deleted = 1 WHERE id = #{id}")
    int deleteById(@Param("id") Integer id);

    /**
     * 检查逻辑外键是否已存在
     *
     * @param datasourceId 数据源ID
     * @param sourceTableName 主表名
     * @param sourceColumnName 主表字段名
     * @param targetTableName 关联表名
     * @param targetColumnName 关联表字段名
     * @return 存在的记录数
     */
    @Select("SELECT COUNT(*) FROM luck_logical_relation " +
            "WHERE datasource_id = #{datasourceId} AND source_table_name = #{sourceTableName} " +
            "AND source_column_name = #{sourceColumnName} AND target_table_name = #{targetTableName} " +
            "AND target_column_name = #{targetColumnName} AND is_deleted = 0")
    int checkExists(@Param("datasourceId") Integer datasourceId,
                    @Param("sourceTableName") String sourceTableName,
                    @Param("sourceColumnName") String sourceColumnName,
                    @Param("targetTableName") String targetTableName,
                    @Param("targetColumnName") String targetColumnName);

    /**
     * 逻辑删除数据源下所有逻辑外键
     *
     * @param datasourceId 数据源ID
     * @return 影响行数
     */
    @Update("UPDATE luck_logical_relation SET is_deleted = 1 WHERE datasource_id = #{datasourceId}")
    int deleteByDatasourceId(@Param("datasourceId") Integer datasourceId);
}
