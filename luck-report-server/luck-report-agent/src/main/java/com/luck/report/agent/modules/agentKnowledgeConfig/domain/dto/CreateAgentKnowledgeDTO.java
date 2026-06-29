package com.luck.report.agent.modules.agentKnowledgeConfig.domain.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

/**
 * 创建智能体知识DTO
 * 用于接收前端创建知识的请求参数
 *
 * @author luck
 */
@Data
public class CreateAgentKnowledgeDTO {

    /** 知识标题 */
    @NotBlank(message = "知识标题不能为空")
    private String title;

    /** 知识类型：DOCUMENT, QA, FAQ */
    @NotBlank(message = "知识类型不能为空")
    private String type;

    /** 问题（FAQ和QA类型时必填） */
    private String question;

    /** 内容（当type=QA, FAQ时必填） */
    private String content;

    /** 上传的文件（当type=DOCUMENT时必填） */
    private MultipartFile file;

    /** 分块策略类型：token, recursive, sentence, paragraph, semantic */
    private String splitterType;

    /** 嵌入模型配置ID，用于指定向量化时使用的嵌入模型 */
    @NotNull(message = "嵌入模型不能为空")
    private String modelId;
}
