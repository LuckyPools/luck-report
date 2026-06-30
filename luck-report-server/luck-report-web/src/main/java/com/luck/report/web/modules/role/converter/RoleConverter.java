package com.luck.report.web.modules.role.converter;

import com.luck.report.web.modules.role.domain.entity.ReportRole;
import com.luck.report.web.modules.role.domain.vo.ReportRoleListVo;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 角色模块 Converter（Entity / VO 互转）。
 *
 * @author luck-report
 * @since 1.2.0
 */
@Component("bean.roleConverter")
public class RoleConverter {

    /**
     * 组装角色列表 VO。
     *
     * @param roleCode 角色编码
     * @param roleName 角色名（可能为 null）
     * @param bindings 该角色的全部绑定（含 '*'）；用于计算 bindingCount
     * @param hasAll   是否存在 '*' 通配
     * @return RoleListVo
     */
    public ReportRoleListVo toListVo(String roleCode, String roleName,
                                     List<ReportRole> bindings, boolean hasAll) {
        int count = bindings == null ? 0 : (int) bindings.stream()
                .filter(r -> r != null && !"*".equals(r.getFilePath()))
                .count();
        return new ReportRoleListVo(roleCode, roleName, count, hasAll);
    }
}
