package com.luck.agent.modules.datasource.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Schema数据载体
 * 包含数据库名、表列表和外键列表，用于组装完整的数据库Schema信息
 * 向量检索的表结构 + 逻辑外键合并后形成统一的SchemaDTO，供PromptHelper格式化为提示词文本
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemaDTO {

    /** 数据库名 */
    private String name;

    /** 描述 */
    private String description;

    /** 表数量 */
    private Integer tableCount;

    /** 表列表 */
    private List<TableDTO> table;

    /** 外键列表（物理外键 + 逻辑外键合并），格式：表名.字段名=关联表.关联字段名 */
    private List<String> foreignKeys;
}
