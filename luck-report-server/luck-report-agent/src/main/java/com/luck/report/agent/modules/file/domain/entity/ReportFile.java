package com.luck.report.agent.modules.file.domain.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 报表文件实体类
 * 对应 luck_report_file 表，用于数据库存储报表模板
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportFile {

    /** 主键ID */
    private String id;

    /** 报表标题 */
    private String title;

    /** 报表模板内容（XML） */
    private String template;

    /** 是否已删除（0:未删除, 1:已删除） */
    @Builder.Default
    private Integer isDeleted = 0;

    /** 创建时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime createdTime;

    /** 更新时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime updatedTime;
}
