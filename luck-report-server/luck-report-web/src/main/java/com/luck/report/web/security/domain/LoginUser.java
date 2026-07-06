package com.luck.report.web.security.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

/**
 * 当前登录用户信息。
 * <p>作为框架与第三方系统之间传递用户身份的边界对象，
 * 仅包含框架必需的属性（id、roles），避免业务耦合。
 * <p>第三方实现 TokenService.getCurrentUser 时返回此对象，
 * 框架从该对象中提取用户 ID 用于数据隔离、角色列表用于权限校验。
 *
 * @author luck-report
 * @since 1.2.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginUser {

    /**
     * 用户 ID（字符串形式）。
     * <p>兼容第三方各类用户标识（数字主键、UUID、工号等），
     * 框架持久化层（如 ChatSession.userId）同为 String，无需类型转换。
     */
    private String id;

    /**
     * 用户角色编码列表。
     * <p>角色编码（如 ["ROLE_ADMIN","ROLE_FINANCE"]），与 luck_report_role.role_code 匹配。
     * <p>空列表表示"有身份但无角色"，框架权限校验时视为普通用户。
     */
    private List<String> roles;
}