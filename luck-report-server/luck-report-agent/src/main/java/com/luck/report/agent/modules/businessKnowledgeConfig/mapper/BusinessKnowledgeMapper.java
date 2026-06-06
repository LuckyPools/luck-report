package com.luck.report.agent.modules.businessKnowledgeConfig.mapper;

import com.luck.report.agent.modules.businessKnowledgeConfig.domain.dto.BusinessKnowledgeQueryDTO;
import com.luck.report.agent.modules.businessKnowledgeConfig.domain.entity.BusinessKnowledge;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 业务知识Mapper
 * 操作 luck_business_knowledge 表
 * SQL 定义在 resources/mapper/{databaseId}/BusinessKnowledgeMapper.xml 中，支持多数据库方言
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
    int insert(BusinessKnowledge knowledge);

    /**
     * 根据ID更新业务知识
     *
     * @param knowledge 业务知识实体
     * @return 影响行数
     */
    int updateById(BusinessKnowledge knowledge);

    /**
     * 根据ID查询业务知识
     *
     * @param id 业务知识ID
     * @return 业务知识实体
     */
    BusinessKnowledge selectById(@Param("id") Long id);

    /**
     * 搜索业务知识
     *
     * @param keyword 搜索关键词
     * @return 业务知识列表
     */
    List<BusinessKnowledge> search(@Param("keyword") String keyword);

    /**
     * 查询所有业务知识列表
     *
     * @return 业务知识列表
     */
    List<BusinessKnowledge> selectAll();

    /**
     * 逻辑删除业务知识
     * updatedTime 由 Java 侧赋值，不依赖数据库函数
     *
     * @param id          业务知识ID
     * @param isDeleted   是否删除标记
     * @param updatedTime 更新时间
     * @return 影响行数
     */
    int logicalDelete(@Param("id") Long id, @Param("isDeleted") Integer isDeleted, @Param("updatedTime") java.time.LocalDateTime updatedTime);

    /**
     * 根据ID列表批量查询业务知识
     * 用于向量检索结果回填原文内容
     *
     * @param ids 业务知识ID列表
     * @return 业务知识列表
     */
    List<BusinessKnowledge> selectByIds(@Param("ids") List<Long> ids);

    /**
     * 分页条件查询业务知识
     * 分页由拦截器自动改写，SQL 中无需手写 LIMIT
     *
     * @param queryDTO 查询条件
     * @param offset   偏移量
     * @return 业务知识列表
     */
    List<BusinessKnowledge> selectByConditionsWithPage(@Param("queryDTO") BusinessKnowledgeQueryDTO queryDTO,
                                                     @Param("offset") Integer offset,
                                                     @Param("pageSize") Integer pageSize);

    /**
     * 统计符合条件的业务知识数量
     *
     * @param queryDTO 查询条件
     * @return 符合条件的记录数
     */
    Long countByConditions(@Param("queryDTO") BusinessKnowledgeQueryDTO queryDTO);
}
