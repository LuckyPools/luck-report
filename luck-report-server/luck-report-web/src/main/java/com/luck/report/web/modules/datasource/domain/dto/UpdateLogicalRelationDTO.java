package com.luck.report.web.modules.datasource.domain.dto;

import lombok.Data;

/**
 * 更新逻辑外键DTO
 *
 * @author luck
 */
@Data
public class UpdateLogicalRelationDTO {

    /** 主表名 */
    private String sourceTableName;

    /** 主表字段名 */
    private String sourceColumnName;

    /** 关联表名 */
    private String targetTableName;

    /** 关联表字段名 */
    private String targetColumnName;

    /** 关系类型：1:1/1:N/N:1 */
    private String relationType;

    /** 业务描述 */
    private String description;
}
