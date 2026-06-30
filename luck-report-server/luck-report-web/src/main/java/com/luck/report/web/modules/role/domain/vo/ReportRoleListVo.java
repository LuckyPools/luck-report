package com.luck.report.web.modules.role.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 角色列表项 VO（管理端表格用）。
 * <p>对应接口 {@code GET /role/list}。
 *
 * @author luck-report
 * @since 1.2.0
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReportRoleListVo {

    /** 角色编码（与 luck_report_role.role_code 对应） */
    private String roleCode;

    /** 角色名（冗余展示，源自第三方 / TokenService.listAllRoles） */
    private String roleName;

    /** 该角色已绑定的报表数量（不含 '*'） */
    private Integer bindingCount;

    /** 是否存在 '*' 通配绑定 */
    private boolean hasAll;
}
