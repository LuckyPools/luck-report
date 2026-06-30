package com.luck.report.web.modules.role.domain.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 角色绑定查询 DTO。
 * <p>用于"按角色 + provider 维度"查询的入参；当前主要用于穿梭框打开时初始化。
 * <p>注：管理端表格不需此 DTO（直接通过 {@code /role/list} 拿全量去重的 roleCode 列表）。
 *
 * @author luck-report
 * @since 1.2.0
 */
@Data
@NoArgsConstructor
public class ReportRoleQueryDTO {

    /** 角色编码 */
    private String roleCode;

    /** 报表来源前缀 */
    private String provider;
}
