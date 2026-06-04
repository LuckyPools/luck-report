package com.luck.agent.modules.datasource.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 列信息DTO
 * 描述数据库表中一个字段的结构，包含字段名、类型、注释和示例数据
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ColumnDTO {

    /** 字段名 */
    private String name;

    /** 字段注释/描述 */
    private String description;

    /** 字段类型（如 INT、VARCHAR、DECIMAL 等） */
    private String type;

    /** 示例数据列表 */
    private List<String> data;

    /** 枚举标记（0-非枚举，1-枚举） */
    private int enumeration;

    /** 值范围描述 */
    private String range;

    /** 映射关系（如状态码→状态名的映射） */
    private Map<String, String> mapping;
}
