package com.luck.report.web.modules.role.controller;

import com.luck.report.web.security.TokenProperties;
import com.luck.report.web.modules.role.domain.dto.ReportRoleBindingDTO;
import com.luck.report.web.modules.role.domain.vo.ReportRoleBindingsVo;
import com.luck.report.web.modules.role.service.ReportRoleService;
import com.luck.report.web.common.vo.ResultVO;
import com.luck.report.core.provider.report.ReportFile;
import com.luck.report.web.modules.role.domain.dto.RoleInfo;
import com.luck.report.web.security.service.TokenService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;

/**
 * 角色报表授权管理 Controller。
 * <p>提供：
 * <ul>
 *   <li>{@code GET  /role/list}                全量角色列表（第三方 + 内置匿名角色，管理页表格，不分页）</li>
 *   <li>{@code GET  /role/reports}             某 provider 下所有非目录报表（穿梭框左侧）</li>
 *   <li>{@code GET  /role/bindings/{code}}     某角色在某 provider 下的已绑 file_path（穿梭框右侧）</li>
 *   <li>{@code POST /role/bindings}            保存某角色在某 provider 下的报表绑定</li>
 *   <li>{@code DELETE /role/bindings/{code}}   物理删除某角色全部绑定（含 '*'）</li>
 *   <li>{@code GET  /role/auth/check-admin}    轻量管理员检查（前端用）</li>
 * </ul>
 * <p>API 风格参考 {@code modules/modelConfig/ModelConfigController}（REST + ResultVO）。
 * <p>provider 列表复用 {@code DesignerController.loadReportProviders}，
 * 报表列表不复用 {@code ManageController.queryReports}（那是分页接口），穿梭框左侧用
 * 专用的 {@code /role/reports} 不分页接口。
 * <p>角色由第三方系统管理，本页面仅为已有角色配置报表授权，无新增绑定场景。
 *
 * @author luck-report
 * @since 1.2.0
 */
@Slf4j
@RestController("bean.reportRoleController")
@RequestMapping("${luck-report.servletPrefix:}/role")
@AllArgsConstructor
public class ReportRoleController {

    private final ReportRoleService roleDataService;
    private final TokenService tokenService;
    private final TokenProperties props;

    /** 全量角色列表（第三方角色 + 内置匿名角色，管理页表格，不分页） */
    @GetMapping("/list")
    public ResultVO<List<RoleInfo>> list() {
        return ResultVO.success(roleDataService.listAllRoles());
    }

    // 注：已移除原 /all-roles 接口，因为角色列表直接查询第三方全量角色，
    //     无需"新增绑定"场景——角色由第三方系统管理，本页面仅为已有角色配置报表授权。

    /**
     * 列出某 provider 下所有非目录报表（穿梭框左侧用，不分页）。
     * <p>与 {@code /manage/queryReports} 的关键区别：本接口一次性返回全量，
     * 供 a-transfer 当全集数据源用，再由 a-transfer 自带的 pagination 做客户端分页展示。
     * <p>底层调 {@link com.luck.report.core.provider.report.ReportProvider#getReportFiles()} 一次拿全，
     * 再过滤目录项；阈值 {@code TRANSFER_REPORT_LIMIT=10000}，超过记录 warn 日志。
     */
    @GetMapping("/reports")
    public ResultVO<List<ReportFile>> listAllReports(@RequestParam String provider) {
        return ResultVO.success(roleDataService.listAllReports(provider));
    }

    /** 某角色在某 provider 下的已绑 file_path（穿梭框右侧初始化，**全量返回，不分页**） */
    @GetMapping("/bindings/{roleCode}")
    public ResultVO<ReportRoleBindingsVo> getBindings(
            @PathVariable String roleCode,
            @RequestParam String provider) {
        return ResultVO.success(new ReportRoleBindingsVo(
                roleDataService.getFilePathsByRoleAndProvider(roleCode, provider),
                roleDataService.hasAllBinding(roleCode)));
    }

    /** 保存某角色在某 provider 下的报表绑定（覆盖式物理删+插，可选 '*' 通配） */
    @PostMapping("/bindings")
    public ResultVO<Void> saveBindings(@Valid @RequestBody ReportRoleBindingDTO req) {
        roleDataService.saveRoleBindings(req.getRoleCode(), req.getRoleName(),
                req.getProvider(), req.getFilePaths(),
                req.isHasAll(), req.getOperator());
        return ResultVO.success();
    }

    /** 物理删除某角色全部绑定（含 '*'） */
    @DeleteMapping("/bindings/{roleCode}")
    public ResultVO<Void> delete(@PathVariable String roleCode) {
        roleDataService.deleteByRoleCode(roleCode);
        return ResultVO.success();
    }

    /**
     * 轻量管理员检查（前端用，决定是否显示"角色报表"菜单）。
     * <p>enabled=false 时直接返回 true（dev 模式不挡门）。
     */
    @GetMapping("/auth/check-admin")
    public ResultVO<Boolean> checkAdmin(HttpServletRequest req) {
        if (props == null || !props.isEnabled()) {
            return ResultVO.success(true);
        }
        List<String> roles = tokenService.getCurrentUserRoles(req);
        List<String> admins = props.getAdminRoles();
        boolean isAdmin = roles != null && admins != null && !admins.isEmpty()
                && roles.stream().anyMatch(admins::contains);
        return ResultVO.success(isAdmin);
    }
}
