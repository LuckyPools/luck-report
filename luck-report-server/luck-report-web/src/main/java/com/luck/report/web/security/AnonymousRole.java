package com.luck.report.web.security;

/**
 * 内置匿名角色常量。
 * <p>绑定此角色的报表允许无 token 访问（匿名预览）。
 * <p>该角色由框架自动添加到角色列表中，第三方无需在 {@code TokenService.listAllRoles()} 中返回。
 *
 * @author luck-report
 * @since 1.2.0
 */
public final class AnonymousRole {

    /** 角色编码（与 luck_report_role.role_code 对应） */
    public static final String CODE = "ANONYMOUS";

    /** 角色显示名 */
    public static final String NAME = "匿名用户";

    private AnonymousRole() {
    }
}
