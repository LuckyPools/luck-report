package com.luck.report.agent.modules.modelConfig.domain.dto;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 模型配置分页查询DTO
 * 用于接收前端分页查询模型配置的请求参数
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModelConfigQueryDTO {

    /** 配置名称（模糊查询） */
    private String configName;

    /** 模型类型：CHAT, EMBEDDING */
    private String modelType;

    /** 是否激活：true-激活，false-未激活 */
    private Boolean isActive;

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