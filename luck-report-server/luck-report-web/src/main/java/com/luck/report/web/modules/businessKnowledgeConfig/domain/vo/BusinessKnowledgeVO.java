package com.luck.report.web.modules.businessKnowledgeConfig.domain.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 业务知识VO
 * 用于返回给前端的业务知识视图对象
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessKnowledgeVO {

    /** 主键ID */
    private String id;

    /** 业务名词 */
    private String businessTerm;

    /** 业务知识描述 */
    private String description;

    /** 同义词 */
    private String synonyms;

    /** 是否生效 */
    @JsonFormat(shape = JsonFormat.Shape.BOOLEAN)
    private Boolean enabled;

    /** 关联的嵌入模型ID */
    private String modelId;

    /** 创建时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime createdTime;

    /** 更新时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime updatedTime;

    /** 向量化状态 */
    private String embeddingStatus;

    /** 操作失败的错误信息 */
    private String errorMsg;
}
