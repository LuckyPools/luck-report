package com.luck.report.agent.modules.datasource.mapper;

import com.luck.report.agent.modules.datasource.domain.dto.DatasourceQueryDTO;
import com.luck.report.agent.modules.datasource.domain.entity.Datasource;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 数据源Mapper
 * 操作MySQL的luck_datasource表
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
    @Insert("INSERT INTO luck_datasource (name, type, host, port, database_name, username, password, " +
            "connection_url, status, test_status, description, model_id, initialized_tables, creator_id) " +
            "VALUES (#{name}, #{type}, #{host}, #{port}, #{databaseName}, #{username}, #{password}, " +
            "#{connectionUrl}, #{status}, #{testStatus}, #{description}, #{modelId}, #{initializedTables}, #{creatorId})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Datasource datasource);

    /**
     * 根据ID更新数据源
     *
     * @param datasource 数据源实体
     * @return 影响行数
     */
    @Update("UPDATE luck_datasource SET name = #{name}, type = #{type}, host = #{host}, port = #{port}, " +
            "database_name = #{databaseName}, username = #{username}, password = #{password}, " +
            "connection_url = #{connectionUrl}, status = #{status}, description = #{description}, " +
            "model_id = #{modelId}, initialized_tables = #{initializedTables} " +
            "WHERE id = #{id}")
    int updateById(Datasource datasource);

    /**
     * 根据ID查询数据源
     *
     * @param id 数据源ID
     * @return 数据源实体
     */
    @Select("SELECT id, name, type, host, port, database_name, username, password, connection_url, " +
            "status, test_status, description, model_id, initialized_tables, creator_id, create_time, update_time " +
            "FROM luck_datasource WHERE id = #{id}")
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
            @Result(column = "initialized_tables", property = "initializedTables"),
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
            "status, test_status, description, model_id, initialized_tables, creator_id, create_time, update_time " +
            "FROM luck_datasource ORDER BY create_time DESC")
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
            @Result(column = "initialized_tables", property = "initializedTables"),
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
            "status, test_status, description, model_id, initialized_tables, creator_id, create_time, update_time " +
            "FROM luck_datasource WHERE status = #{status} ORDER BY create_time DESC")
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
            @Result(column = "initialized_tables", property = "initializedTables"),
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
            "status, test_status, description, model_id, initialized_tables, creator_id, create_time, update_time " +
            "FROM luck_datasource WHERE type = #{type} ORDER BY create_time DESC")
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
            @Result(column = "initialized_tables", property = "initializedTables"),
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
    @Delete("DELETE FROM luck_datasource WHERE id = #{id}")
    int deleteById(@Param("id") Integer id);

    /**
     * 更新连接测试状态
     *
     * @param id 数据源ID
     * @param testStatus 测试状态
     * @return 影响行数
     */
    @Update("UPDATE luck_datasource SET test_status = #{testStatus} WHERE id = #{id}")
    int updateTestStatusById(@Param("id") Integer id, @Param("testStatus") String testStatus);

    /**
     * 更新数据源状态（启用/禁用）
     *
     * @param id 数据源ID
     * @param status 状态
     * @return 影响行数
     */
    @Update("UPDATE luck_datasource SET status = #{status} WHERE id = #{id}")
    int updateStatusById(@Param("id") Integer id, @Param("status") String status);

    /**
     * 根据名称查询数据源
     * 用于通过数据源名称获取数据源ID和配置信息
     *
     * @param name 数据源名称
     * @return 数据源实体，不存在则返回null
     */
    @Select("SELECT id, name, type, host, port, database_name, username, password, connection_url, " +
            "status, test_status, description, model_id, initialized_tables, creator_id, create_time, update_time " +
            "FROM luck_datasource WHERE name = #{name}")
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
            @Result(column = "initialized_tables", property = "initializedTables"),
            @Result(column = "creator_id", property = "creatorId"),
            @Result(column = "create_time", property = "createTime"),
            @Result(column = "update_time", property = "updateTime")
    })
    Datasource selectByName(@Param("name") String name);

    /**
     * 更新已初始化的表名列表
     *
     * @param id 数据源ID
     * @param initializedTables 已初始化的表名列表（JSON格式）
     * @return 影响行数
     */
    @Update("UPDATE luck_datasource SET initialized_tables = #{initializedTables} WHERE id = #{id}")
    int updateInitializedTables(@Param("id") Integer id, @Param("initializedTables") String initializedTables);

    /**
     * 分页条件查询数据源
     *
     * @param queryDTO 查询条件
     * @param offset 偏移量
     * @return 数据源列表
     */
    @Select("<script>" +
            "SELECT id, name, type, host, port, database_name, username, password, connection_url, " +
            "status, test_status, description, model_id, initialized_tables, creator_id, create_time, update_time " +
            "FROM luck_datasource " +
            "WHERE 1=1 " +
            "<if test='queryDTO.name != null and queryDTO.name != \"\"'>" +
            "AND name LIKE CONCAT('%', #{queryDTO.name}, '%') " +
            "</if>" +
            "<if test='queryDTO.type != null and queryDTO.type != \"\"'>" +
            "AND type = #{queryDTO.type} " +
            "</if>" +
            "<if test='queryDTO.status != null and queryDTO.status != \"\"'>" +
            "AND status = #{queryDTO.status} " +
            "</if>" +
            "ORDER BY create_time DESC " +
            "LIMIT #{offset}, #{queryDTO.pageSize}" +
            "</script>")
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
            @Result(column = "initialized_tables", property = "initializedTables"),
            @Result(column = "creator_id", property = "creatorId"),
            @Result(column = "create_time", property = "createTime"),
            @Result(column = "update_time", property = "updateTime")
    })
    List<Datasource> selectByConditionsWithPage(@Param("queryDTO") DatasourceQueryDTO queryDTO,
                                                     @Param("offset") Integer offset);

    /**
     * 统计符合条件的数据源数量
     *
     * @param queryDTO 查询条件
     * @return 符合条件的记录数
     */
    @Select("<script>" +
            "SELECT COUNT(*) FROM luck_datasource " +
            "WHERE 1=1 " +
            "<if test='queryDTO.name != null and queryDTO.name != \"\"'>" +
            "AND name LIKE CONCAT('%', #{queryDTO.name}, '%') " +
            "</if>" +
            "<if test='queryDTO.type != null and queryDTO.type != \"\"'>" +
            "AND type = #{queryDTO.type} " +
            "</if>" +
            "<if test='queryDTO.status != null and queryDTO.status != \"\"'>" +
            "AND status = #{queryDTO.status} " +
            "</if>" +
            "</script>")
    Long countByConditions(@Param("queryDTO") DatasourceQueryDTO queryDTO);
}
