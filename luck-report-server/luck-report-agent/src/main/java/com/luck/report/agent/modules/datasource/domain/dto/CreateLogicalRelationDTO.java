package com.luck.report.agent.modules.datasource.domain.dto;

import javax.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建逻辑外键DTO
 *
 * @author luck
 */
@Data
public class CreateLogicalRelationDTO {

    /** 主表名 */
    @NotBlank(message = "主表名不能为空")
    private String sourceTableName;

    /** 主表字段名 */
    @NotBlank(message = "主表字段名不能为空")
    private String sourceColumnName;

    /** 关联表名 */
    @NotBlank(message = "关联表名不能为空")
    private String targetTableName;

    /** 关联表字段名 */
    @NotBlank(message = "关联表字段名不能为空")
    private String targetColumnName;

    /** 关系类型：1:1/1:N/N:1 */
    private String relationType;

    /** 业务描述 */
    private String description;
}
