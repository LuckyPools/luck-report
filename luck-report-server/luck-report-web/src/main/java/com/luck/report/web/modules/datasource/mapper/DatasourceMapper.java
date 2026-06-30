package com.luck.report.web.modules.datasource.mapper;

import com.luck.report.web.modules.datasource.domain.dto.DatasourceQueryDTO;
import com.luck.report.web.modules.datasource.domain.entity.Datasource;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 数据源Mapper
 * 操作 luck_datasource 表
 * SQL 定义在 resources/mapper/{databaseId}/DatasourceMapper.xml 中，支持多数据库方言
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
    int insert(Datasource datasource);

    /**
     * 根据ID更新数据源
     *
     * @param datasource 数据源实体
     * @return 影响行数
     */
    int updateById(Datasource datasource);

    /**
     * 根据ID查询数据源
     *
     * @param id 数据源ID
     * @return 数据源实体
     */
    Datasource selectById(@Param("id") String id);

    /**
     * 查询所有数据源
     *
     * @return 数据源列表
     */
    List<Datasource> selectAll();

    /**
     * 按状态查询数据源
     *
     * @param status 状态
     * @return 数据源列表
     */
    List<Datasource> selectByStatus(@Param("status") String status);

    /**
     * 按类型查询数据源
     *
     * @param type 数据源类型
     * @return 数据源列表
     */
    List<Datasource> selectByType(@Param("type") String type);

    /**
     * 根据ID删除数据源
     *
     * @param id 数据源ID
     * @return 影响行数
     */
    int deleteById(@Param("id") String id);

    /**
     * 更新连接测试状态
     *
     * @param id         数据源ID
     * @param testStatus 测试状态
     * @return 影响行数
     */
    int updateTestStatusById(@Param("id") String id, @Param("testStatus") String testStatus);

    /**
     * 更新数据源状态（启用/禁用）
     *
     * @param id     数据源ID
     * @param status 状态
     * @return 影响行数
     */
    int updateStatusById(@Param("id") String id, @Param("status") String status);

    /**
     * 根据名称查询数据源
     *
     * @param name 数据源名称
     * @return 数据源实体，不存在则返回null
     */
    Datasource selectByName(@Param("name") String name);

    /**
     * 更新已初始化的表名列表
     *
     * @param id                数据源ID
     * @param initializedTables 已初始化的表名列表（JSON格式）
     * @return 影响行数
     */
    int updateInitializedTables(@Param("id") String id, @Param("initializedTables") String initializedTables);

    /**
     * 根据ID列表批量查询数据源
     *
     * @param ids 数据源ID列表，不可为空
     * @return 数据源列表
     */
    List<Datasource> selectByIds(@Param("ids") List<String> ids);

    /**
     * 分页条件查询数据源
     * 分页由拦截器自动改写，SQL 中无需手写 LIMIT
     *
     * @param queryDTO 查询条件
     * @param offset   偏移量
     * @return 数据源列表
     */
    List<Datasource> selectByConditionsWithPage(@Param("queryDTO") DatasourceQueryDTO queryDTO,
                                                     @Param("offset") Integer offset,
                                                     @Param("pageSize") Integer pageSize);

    /**
     * 统计符合条件的数据源数量
     *
     * @param queryDTO 查询条件
     * @return 符合条件的记录数
     */
    Long countByConditions(@Param("queryDTO") DatasourceQueryDTO queryDTO);
}
