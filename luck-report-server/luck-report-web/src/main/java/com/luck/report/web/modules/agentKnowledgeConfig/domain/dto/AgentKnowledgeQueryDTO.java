package com.luck.report.web.modules.agentKnowledgeConfig.domain.dto;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 智能体知识分页查询DTO
 * 用于接收前端分页查询知识的请求参数
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentKnowledgeQueryDTO {

    /** 知识标题（模糊查询） */
    private String title;

    /** 知识类型：DOCUMENT, QA, FAQ */
    private String type;

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
