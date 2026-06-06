package com.luck.report.agent.modules.datasource.domain.dto;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 数据源分页查询DTO
 * 用于接收前端分页查询数据源的请求参数
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatasourceQueryDTO {

    /** 数据源名称（模糊查询） */
    private String name;

    /** 数据源类型 */
    private String type;

    /** 状态：active/inactive */
    private String status;

    /** 当前页码（默认第1页） */
    @NotNull(message = "pageNum不能为空")
    @Min(value = 1, message = "pageNum不能小于1")
    @Builder.Default
    private Integer pageNum = 1;

    /** 每页大小（默认10条） */
    @NotNull(message = "pageSize不能为空")
    @Min(value = 1, message = "pageSize不能小于1")
    @Builder.Default
    private Integer pageSize = 10;
}