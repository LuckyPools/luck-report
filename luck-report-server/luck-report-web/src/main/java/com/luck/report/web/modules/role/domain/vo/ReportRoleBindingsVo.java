package com.luck.report.web.modules.role.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 角色绑定初始化 VO（穿梭框右侧）。
 * <p>对应接口 {@code GET /role/bindings/{roleCode}?provider=xxx}。
 *
 * @author luck-report
 * @since 1.2.0
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReportRoleBindingsVo {

    /** 该 provider 下的已绑 file_path 列表 */
    private List<String> filePaths;

    /** 是否存在 '*' 通配绑定 */
    private boolean hasAll;
}
