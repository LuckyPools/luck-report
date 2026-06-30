package com.luck.report.web.modules.datasource.domain.dto;

import com.luck.report.web.modules.datasource.domain.dto.ForeignKeyDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Schema数据载体
 * 包含数据库名、表列表和外键列表，用于组装完整的数据库Schema信息
 * 向量检索的表结构 + 逻辑外键合并后形成统一的SchemaDTO，直接序列化给LLM消费
 *
 * 字段命名遵循"自描述"原则，LLM 读取 JSON 时可凭字段名理解其含义：
 * - name: 数据库名
 * - description: 数据库描述
 * - tableCount: 召回表数量
 * - table: 表结构列表（每项含 name/description/column/primaryKeys）
 * - foreignKeys: 表间外键关系（每项含 sourceTable/sourceColumn/targetTable/targetColumn）
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

    /** 外键关系列表（物理外键 + 逻辑外键合并），每项描述一对字段关联 */
    private List<ForeignKeyDTO> foreignKeys;
}
