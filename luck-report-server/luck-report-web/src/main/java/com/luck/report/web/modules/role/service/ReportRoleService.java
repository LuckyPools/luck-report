package com.luck.report.web.modules.role.service;

import com.luck.report.web.modules.role.domain.dto.RoleInfo;
import com.luck.report.web.modules.role.domain.vo.ReportRoleListVo;
import com.luck.report.core.provider.report.ReportFile;
import com.luck.report.web.security.service.TokenService;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * 角色 × 报表 绑定关系数据服务接口。
 *
 * @author luck-report
 * @since 1.2.0
 */
public interface ReportRoleService {

    /** 穿梭框报表数量阈值，超过后记录 warn 日志（不截断，让前端感知后提示用搜索） */
    int TRANSFER_REPORT_LIMIT = 10000;

    /**
     * 获取全量角色列表（第三方角色 + 内置匿名角色）。
     * <p>第三方角色由 {@link TokenService#listAllRoles()} 提供，
     * 内置匿名角色 {@link com.luck.report.web.security.AnonymousRole} 由框架追加。
     *
     * @return 全量角色列表
     */
    List<RoleInfo> listAllRoles();

    /**
     * 列出所有已绑定角色（去重，用于管理端表格行）。
     * <p>每个角色附 bindingCount（不含 '*'）与 hasAll 标记。
     * 角色名通过 {@link #listAllRoles()} 解析。
     *
     * @return 角色列表
     */
    List<ReportRoleListVo> listBoundRoles();

    /**
     * 某角色在某 provider 下的已绑 file_path 列表（穿梭框右侧初始化用，**全量返回，不分页**）。
     *
     * @param roleCode 角色编码
     * @param provider provider 前缀（含冒号）
     * @return file_path 列表
     */
    List<String> getFilePathsByRoleAndProvider(String roleCode, String provider);

    /**
     * 某角色是否绑定 '*'（前端"全部报表"勾选状态用）。
     *
     * @param roleCode 角色编码
     * @return true = 已绑定 '*'
     */
    boolean hasAllBinding(String roleCode);

    /**
     * 列出某 provider 下所有非目录报表（穿梭框左侧用，**全量返回，不分页**）。
     * <p>不复用 {@code queryReports} —— 那是分页接口（pageSize≤10），与 a-transfer 的
     * 全集数据模型冲突；分页会让左右两侧"未授权/已授权"视图都不完整。
     * <p>底层走 {@link com.luck.report.core.provider.report.ReportProvider#getReportFiles()} 一次拿全，
     * Service 层再过滤 {@code directory=true} 项；阈值由 {@link #TRANSFER_REPORT_LIMIT}
     * 控制（默认 10000），超过记录 warn 日志。
     *
     * @param provider provider 前缀（如 'file:' / 'db:'）
     * @return 该 provider 下所有非目录报表
     */
    List<ReportFile> listAllReports(String provider);

    /**
     * 替换某角色在指定 provider 下的全部绑定 + 可选 '*' 通配（穿梭框保存，物理删 + 插）。
     * <p>保存策略：先按 provider 物理删除该角色已有的所有绑定，再按需插入具体 file_path + '*'。
     * 写库操作放在一个事务里。
     *
     * @param roleCode 角色编码
     * @param roleName 角色名（仅日志）
     * @param provider provider 前缀
     * @param filePaths 已勾选报表 file_path 列表
     * @param hasAll   是否写一条 '*' 通配
     * @param operator 操作人（仅日志）
     */
    void saveRoleBindings(String roleCode, String roleName, String provider,
                          List<String> filePaths, boolean hasAll, String operator);

    /**
     * 物理删除某角色全部绑定（含 '*'）。
     *
     * @param roleCode 角色编码
     */
    void deleteByRoleCode(String roleCode);

    /**
     * 预览鉴权核心：当前用户能否访问该报表（filePath 已带 provider 前缀）。
     *
     * @param request  HTTP 请求
     * @param filePath 报表完整路径（带 provider 前缀）
     * @return true = 允许
     */
    boolean canPreview(HttpServletRequest request, String filePath);
}
