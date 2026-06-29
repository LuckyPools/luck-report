package com.luck.report.agent.modules.agentKnowledgeConfig.domain.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 智能体知识VO
 * 用于返回给前端的智能体知识视图对象
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentKnowledgeVO {

    /** 主键ID */
    private String id;

    /** 知识标题 */
    private String title;

    /** 知识类型：DOCUMENT, QA, FAQ */
    private String type;

    /** 问题（FAQ和QA类型时使用） */
    private String question;

    /** 内容（当type=QA, FAQ时有内容） */
    private String content;

    /** 是否生效 */
    @JsonFormat(shape = JsonFormat.Shape.BOOLEAN)
    private Boolean enabled;

    /** 向量化状态：PENDING, PROCESSING, COMPLETED, FAILED */
    private String embeddingStatus;

    /** 操作失败的错误信息 */
    private String errorMsg;

    /** 分块策略类型 */
    private String splitterType;

    /** 嵌入模型配置ID */
    private String modelId;

    /** 创建时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime createdTime;

    /** 更新时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime updatedTime;
}
