package com.luck.report.agent.modules.businessKnowledgeConfig.domain.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.luck.report.agent.modules.businessKnowledgeConfig.domain.enums.EmbeddingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 业务知识实体类
 * 存储业务知识的全量数据，包括业务名词、描述、同义词等
 * 向量化后的数据存储在 PostgreSQL 的 vector_document 表中
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessKnowledge {

    /** 主键ID */
    private Long id;

    /** 业务名词 */
    private String businessTerm;

    /** 业务知识描述 */
    private String description;

    /** 同义词，多个用逗号分隔 */
    private String synonyms;

    /** 是否生效（0:不生效, 1:生效） */
    @Builder.Default
    private Integer enabled = 1;

    /** 关联的嵌入模型ID */
    private Long modelId;

    /** 创建时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime createdTime;

    /** 更新时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime updatedTime;

    /** 向量化状态：PENDING待处理，PROCESSING处理中，COMPLETED已完成，FAILED失败 */
    private EmbeddingStatus embeddingStatus;

    /** 操作失败的错误信息 */
    private String errorMsg;

    /** 是否已删除（0:未删除, 1:已删除） */
    @Builder.Default
    private Integer isDeleted = 0;
}
