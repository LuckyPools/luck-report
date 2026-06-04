package com.luck.agent.modules.agentKnowledgeConfig.domain.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.luck.agent.modules.agentKnowledgeConfig.domain.enums.EmbeddingStatus;
import com.luck.agent.modules.agentKnowledgeConfig.domain.enums.KnowledgeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 智能体知识实体类
 * 存储智能体知识的全量数据，包括标题、类型、内容等
 * 向量化后的数据存储在 PostgreSQL 的 vector_document 表中
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentKnowledge {

    /** 主键ID */
    private Long id;

    /** 知识标题 */
    private String title;

    /** 知识类型：DOCUMENT, QA, FAQ */
    private KnowledgeType type;

    /** 问题（FAQ和QA类型时使用） */
    private String question;

    /** 内容（当type=QA, FAQ时有内容） */
    private String content;

    /** 是否生效（0:不生效, 1:生效） */
    @Builder.Default
    private Integer enabled = 1;

    /** 向量化状态：PENDING待处理，PROCESSING处理中，COMPLETED已完成，FAILED失败 */
    private EmbeddingStatus embeddingStatus;

    /** 操作失败的错误信息 */
    private String errorMsg;

    /** 原始文件名 */
    private String sourceFilename;

    /** 文件存储路径 */
    private String filePath;

    /** 文件大小（字节） */
    private Long fileSize;

    /** 文件类型 */
    private String fileType;

    /** 分块策略类型：token, recursive, sentence, paragraph, semantic */
    @Builder.Default
    private String splitterType = "token";

    /** 嵌入模型配置ID，用于指定向量化时使用的嵌入模型 */
    private Long modelId;

    /** 创建时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime createdTime;

    /** 更新时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime updatedTime;

    /** 是否已删除（0:未删除, 1:已删除） */
    @Builder.Default
    private Integer isDeleted = 0;

    /** 物理资源是否已清理（0:未清理, 1:已清理） */
    @Builder.Default
    private Integer isResourceCleaned = 0;
}
