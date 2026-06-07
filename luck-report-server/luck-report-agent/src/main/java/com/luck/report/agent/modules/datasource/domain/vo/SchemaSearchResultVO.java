package com.luck.report.agent.modules.datasource.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 跨数据源Schema搜索结果项（返回给前端）
 * 表示一次搜索命中的数据源及其相关表信息
 * 用于Agent根据自然语言查询快速定位到合适的数据源
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemaSearchResultVO {

    /** 数据源ID */
    private Integer datasourceId;

    /** 数据源名称 */
    private String datasourceName;

    /** 数据源类型（如 mysql、postgresql 等） */
    private String datasourceType;

    /** 匹配的Schema提示词文本（包含表结构和外键关系） */
    private String schemaPrompt;
}
