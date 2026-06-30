package com.luck.report.web.modules.report.domain.dto;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 报表分页查询 DTO
 * 用于分页查询报表列表时接收前端请求参数
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportQueryDTO {

    /** 报表来源前缀（例如 file:），必填 */
    @NotNull(message = "provider不能为空")
    private String provider;

    /** 报表名称（模糊查询） */
    private String reportName;

    /** 目录路径（可选，默认为根路径 "/"） */
    private String directory;

    /** 当前页码（默认第 1 页） */
    @NotNull(message = "pageNum不能为空")
    @Min(value = 1, message = "pageNum不能小于1")
    @Builder.Default
    private Integer pageNum = 1;

    /** 每页大小（默认 10 条） */
    @NotNull(message = "pageSize不能为空")
    @Min(value = 1, message = "pageSize不能小于1")
    @Builder.Default
    private Integer pageSize = 10;
}
