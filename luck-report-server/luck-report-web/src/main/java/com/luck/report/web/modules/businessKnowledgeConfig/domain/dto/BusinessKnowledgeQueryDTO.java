package com.luck.report.web.modules.businessKnowledgeConfig.domain.dto;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 业务知识分页查询DTO
 * 用于接收前端分页查询业务知识的请求参数
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessKnowledgeQueryDTO {

    /** 业务术语名称（模糊查询） */
    private String businessTerm;

    /** 是否生效：true-生效，false-未生效 */
    private Boolean enabled;

    /** 向量化状态：PENDING, PROCESSING, COMPLETED, FAILED */
    private String embeddingStatus;

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
