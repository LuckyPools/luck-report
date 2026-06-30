package com.luck.report.web.modules.datasource.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 外键关系
 * 描述两张表之间的字段关联，用于 Schema 检索结果中表达物理外键和逻辑外键
 * 序列化后由 LLM 直接消费，结合 SchemaDTO.table 推断 JOIN 条件
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForeignKeyDTO {

    /** 源表名（如 t_order） */
    private String sourceTable;

    /** 源字段名（如 buyer_uid） */
    private String sourceColumn;

    /** 目标表名（如 t_user） */
    private String targetTable;

    /** 目标字段名（如 id） */
    private String targetColumn;
}
