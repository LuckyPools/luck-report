package com.luck.agent.modules.datasource.mapper;

import com.luck.agent.modules.datasource.domain.entity.Datasource;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 数据源Mapper
 * 操作MySQL的datasource表
 *
 * @author luck
 */
@Mapper
public interface DatasourceMapper {

    /**
     * 插入数据源
     *
     * @param datasource 数据源实体
     * @return 影响行数
     */
    @Insert("INSERT INTO datasource (name, type, host, port, database_name, username, password, " +
            "connection_url, status, test_status, description, model_id, creator_id) " +
            "VALUES (#{name}, #{type}, #{host}, #{port}, #{databaseName}, #{username}, #{password}, " +
            "#{connectionUrl}, #{status}, #{testStatus}, #{description}, #{modelId}, #{creatorId})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Datasource datasource);

    /**
     * 根据ID更新数据源
     *
     * @param datasource 数据源实体
     * @return 影响行数
     */
    @Update("UPDATE datasource SET name = #{name}, type = #{type}, host = #{host}, port = #{port}, " +
            "database_name = #{databaseName}, username = #{username}, password = #{password}, " +
            "connection_url = #{connectionUrl}, status = #{status}, description = #{description}, " +
            "model_id = #{modelId} " +
            "WHERE id = #{id}")
    int updateById(Datasource datasource);

    /**
     * 根据ID查询数据源
     *
     * @param id 数据源ID
     * @return 数据源实体
     */
    @Select("SELECT id, name, type, host, port, database_name, username, password, connection_url, " +
            "status, test_status, description, model_id, creator_id, create_time, update_time " +
            "FROM datasource WHERE id = #{id}")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "name", property = "name"),
            @Result(column = "type", property = "type"),
            @Result(column = "host", property = "host"),
            @Result(column = "port", property = "port"),
            @Result(column = "database_name", property = "databaseName"),
            @Result(column = "username", property = "username"),
            @Result(column = "password", property = "password"),
            @Result(column = "connection_url", property = "connectionUrl"),
            @Result(column = "status", property = "status"),
            @Result(column = "test_status", property = "testStatus"),
            @Result(column = "description", property = "description"),
            @Result(column = "model_id", property = "modelId"),
            @Result(column = "creator_id", property = "creatorId"),
            @Result(column = "create_time", property = "createTime"),
            @Result(column = "update_time", property = "updateTime")
    })
    Datasource selectById(@Param("id") Integer id);

    /**
     * 查询所有数据源
     *
     * @return 数据源列表
     */
    @Select("SELECT id, name, type, host, port, database_name, username, password, connection_url, " +
            "status, test_status, description, model_id, creator_id, create_time, update_time " +
            "FROM datasource ORDER BY create_time DESC")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "name", property = "name"),
            @Result(column = "type", property = "type"),
            @Result(column = "host", property = "host"),
            @Result(column = "port", property = "port"),
            @Result(column = "database_name", property = "databaseName"),
            @Result(column = "username", property = "username"),
            @Result(column = "password", property = "password"),
            @Result(column = "connection_url", property = "connectionUrl"),
            @Result(column = "status", property = "status"),
            @Result(column = "test_status", property = "testStatus"),
            @Result(column = "description", property = "description"),
            @Result(column = "model_id", property = "modelId"),
            @Result(column = "creator_id", property = "creatorId"),
            @Result(column = "create_time", property = "createTime"),
            @Result(column = "update_time", property = "updateTime")
    })
    List<Datasource> selectAll();

    /**
     * 按状态查询数据源
     *
     * @param status 状态
     * @return 数据源列表
     */
    @Select("SELECT id, name, type, host, port, database_name, username, password, connection_url, " +
            "status, test_status, description, model_id, creator_id, create_time, update_time " +
            "FROM datasource WHERE status = #{status} ORDER BY create_time DESC")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "name", property = "name"),
            @Result(column = "type", property = "type"),
            @Result(column = "host", property = "host"),
            @Result(column = "port", property = "port"),
            @Result(column = "database_name", property = "databaseName"),
            @Result(column = "username", property = "username"),
            @Result(column = "password", property = "password"),
            @Result(column = "connection_url", property = "connectionUrl"),
            @Result(column = "status", property = "status"),
            @Result(column = "test_status", property = "testStatus"),
            @Result(column = "description", property = "description"),
            @Result(column = "model_id", property = "modelId"),
            @Result(column = "creator_id", property = "creatorId"),
            @Result(column = "create_time", property = "createTime"),
            @Result(column = "update_time", property = "updateTime")
    })
    List<Datasource> selectByStatus(@Param("status") String status);

    /**
     * 按类型查询数据源
     *
     * @param type 数据源类型
     * @return 数据源列表
     */
    @Select("SELECT id, name, type, host, port, database_name, username, password, connection_url, " +
            "status, test_status, description, model_id, creator_id, create_time, update_time " +
            "FROM datasource WHERE type = #{type} ORDER BY create_time DESC")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "name", property = "name"),
            @Result(column = "type", property = "type"),
            @Result(column = "host", property = "host"),
            @Result(column = "port", property = "port"),
            @Result(column = "database_name", property = "databaseName"),
            @Result(column = "username", property = "username"),
            @Result(column = "password", property = "password"),
            @Result(column = "connection_url", property = "connectionUrl"),
            @Result(column = "status", property = "status"),
            @Result(column = "test_status", property = "testStatus"),
            @Result(column = "description", property = "description"),
            @Result(column = "model_id", property = "modelId"),
            @Result(column = "creator_id", property = "creatorId"),
            @Result(column = "create_time", property = "createTime"),
            @Result(column = "update_time", property = "updateTime")
    })
    List<Datasource> selectByType(@Param("type") String type);

    /**
     * 根据ID删除数据源
     *
     * @param id 数据源ID
     * @return 影响行数
     */
    @Delete("DELETE FROM datasource WHERE id = #{id}")
    int deleteById(@Param("id") Integer id);

    /**
     * 更新连接测试状态
     *
     * @param id 数据源ID
     * @param testStatus 测试状态
     * @return 影响行数
     */
    @Update("UPDATE datasource SET test_status = #{testStatus} WHERE id = #{id}")
    int updateTestStatusById(@Param("id") Integer id, @Param("testStatus") String testStatus);

    /**
     * 更新数据源状态（启用/禁用）
     *
     * @param id 数据源ID
     * @param status 状态
     * @return 影响行数
     */
    @Update("UPDATE datasource SET status = #{status} WHERE id = #{id}")
    int updateStatusById(@Param("id") Integer id, @Param("status") String status);
}
