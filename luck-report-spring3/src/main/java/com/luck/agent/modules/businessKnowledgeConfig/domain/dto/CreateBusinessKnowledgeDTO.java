package com.luck.agent.modules.businessKnowledgeConfig.domain.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 创建业务知识DTO
 * 用于接收前端创建业务知识的请求参数
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBusinessKnowledgeDTO {

    /** 业务名词 */
    @NotBlank(message = "业务名词不能为空")
    private String businessTerm;

    /** 业务知识描述 */
    @NotBlank(message = "描述不能为空")
    private String description;

    /** 同义词，多个用逗号分隔 */
    private String synonyms;

    /** 是否生效 */
    @Builder.Default
    private Boolean enabled = true;

    /** 关联的嵌入模型ID */
    @NotNull(message = "嵌入模型ID不能为空")
    private Long modelId;
}
