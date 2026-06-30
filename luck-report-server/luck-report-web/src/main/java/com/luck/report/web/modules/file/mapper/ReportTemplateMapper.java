package com.luck.report.web.modules.file.mapper;

import com.luck.report.web.modules.file.domain.entity.ReportTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 报表文件 Mapper
 * 操作 luck_report_template 表
 * SQL 定义在 resources/mapper/{databaseId}/ReportFileMapper.xml 中，支持多数据库方言
 *
 * @author luck
 */
@Mapper
public interface ReportTemplateMapper {

    /**
     * 插入报表文件
     *
     * @param reportFile 报表文件实体
     * @return 影响行数
     */
    int insert(ReportTemplate reportFile);

    /**
     * 根据ID更新报表文件（动态更新非空字段），updatedTime 由 Java 侧赋值
     *
     * @param reportFile 报表文件实体
     * @return 影响行数
     */
    int updateById(ReportTemplate reportFile);

    /**
     * 根据ID查询报表文件（排除已删除）
     *
     * @param id 报表文件ID
     * @return 报表文件实体
     */
    ReportTemplate selectById(@Param("id") String id);

    /**
     * 根据标题查询报表文件（排除已删除）
     *
     * @param title 报表标题
     * @return 报表文件实体
     */
    ReportTemplate selectByTitle(@Param("title") String title);

    /**
     * 查询所有未删除的报表文件列表
     *
     * @return 报表文件列表
     */
    List<ReportTemplate> selectAll();

    /**
     * 根据ID逻辑删除报表文件
     *
     * @param id 报表文件ID
     * @return 影响行数
     */
    int deleteById(@Param("id") String id);

    /**
     * 分页查询报表文件
     *
     * @param name   标题模糊匹配（null/空不过滤）
     * @param offset 偏移量（从 0 开始）
     * @param limit  每页大小
     * @return 报表文件列表
     */
    List<ReportTemplate> selectPage(@Param("name") String name,
                                    @Param("offset") int offset,
                                    @Param("limit") int limit);

    /**
     * 统计符合条件的报表文件数
     *
     * @param name 标题模糊匹配（null/空不过滤）
     * @return 总数
     */
    long countByCondition(@Param("name") String name);
}
