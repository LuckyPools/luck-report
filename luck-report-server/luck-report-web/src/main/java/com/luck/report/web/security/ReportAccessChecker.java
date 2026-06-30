package com.luck.report.web.security;

import com.luck.report.web.modules.role.service.ReportRoleService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;

/**
 * 报表预览权限校验器。
 * <p>规则（详见 {@link ReportRoleService#canPreview}）：
 * <ol>
 *   <li>总开关 token.enabled = false → 全部放行（dev）</li>
 *   <li>命中 admin-roles → 全部放行（管理员）</li>
 *   <li>存在 luck_report_role.file_path = '*' 且 role_code 在用户角色中 → 全部放行</li>
 *   <li>该报表绑定的 role_code 集合与用户角色有交集 → 放行</li>
 *   <li>其他 → 拒绝</li>
 * </ol>
 * <p>本类仅作为"语义门面"存在；真正的规则在
 * {@link ReportRoleService#canPreview(HttpServletRequest, String)}，避免业务逻辑散落。
 *
 * @author luck-report
 * @since 1.2.0
 */
@Component("bean.reportAccessChecker")
@AllArgsConstructor
public class ReportAccessChecker {

    private final ReportRoleService roleDataService;

    public boolean canPreview(HttpServletRequest request, String filePath) {
        return roleDataService.canPreview(request, filePath);
    }
}
