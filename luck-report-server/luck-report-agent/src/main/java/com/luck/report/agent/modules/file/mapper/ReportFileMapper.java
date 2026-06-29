package com.luck.report.agent.modules.file.mapper;

import com.luck.report.agent.modules.file.domain.entity.ReportFile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 报表文件 Mapper
 * 操作 luck_report_file 表
 * SQL 定义在 resources/mapper/{databaseId}/ReportFileMapper.xml 中，支持多数据库方言
 *
 * @author luck
 */
@Mapper
public interface ReportFileMapper {

    /**
     * 插入报表文件
     *
     * @param reportFile 报表文件实体
     * @return 影响行数
     */
    int insert(ReportFile reportFile);

    /**
     * 根据ID更新报表文件（动态更新非空字段），updatedTime 由 Java 侧赋值
     *
     * @param reportFile 报表文件实体
     * @return 影响行数
     */
    int updateById(ReportFile reportFile);

    /**
     * 根据ID查询报表文件（排除已删除）
     *
     * @param id 报表文件ID
     * @return 报表文件实体
     */
    ReportFile selectById(@Param("id") String id);

    /**
     * 根据标题查询报表文件（排除已删除）
     *
     * @param title 报表标题
     * @return 报表文件实体
     */
    ReportFile selectByTitle(@Param("title") String title);

    /**
     * 查询所有未删除的报表文件列表
     *
     * @return 报表文件列表
     */
    List<ReportFile> selectAll();

    /**
     * 根据ID逻辑删除报表文件
     *
     * @param id 报表文件ID
     * @return 影响行数
     */
    int deleteById(@Param("id") String id);
}
