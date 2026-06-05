package com.luck.report.agent.modules.datasource.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 表信息DTO
 * 描述一张数据库表的结构，包含表名、注释、主键和列信息
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableDTO {

    /** 表名 */
    private String name;

    /** 表注释/描述 */
    private String description;

    /** 列信息列表 */
    @Builder.Default
    private List<ColumnDTO> column = new ArrayList<>();

    /** 主键字段名列表 */
    private List<String> primaryKeys;
}
