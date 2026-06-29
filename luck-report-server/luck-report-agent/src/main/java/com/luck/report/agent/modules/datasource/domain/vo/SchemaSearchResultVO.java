package com.luck.report.agent.modules.datasource.domain.vo;

import com.luck.report.agent.modules.datasource.domain.dto.SchemaDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 跨数据源Schema搜索结果项（返回给前端）
 * 表示一次搜索命中的数据源及其相关表信息
 * 用于Agent根据自然语言查询快速定位到合适的数据源
 *
 * 前端拿到后可直接序列化 schema 字段给 LLM 消费，或读取 table/foreignKeys 做后续解析
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemaSearchResultVO {

    /** 数据源ID */
    private String datasourceId;

    /** 数据源名称 */
    private String datasourceName;

    /** 数据源类型（如 mysql、postgresql 等） */
    private String datasourceType;

    /** 命中的Schema结构（含表结构、字段、外键），供 LLM 生成 SQL 做参考 */
    private SchemaDTO schema;
}
