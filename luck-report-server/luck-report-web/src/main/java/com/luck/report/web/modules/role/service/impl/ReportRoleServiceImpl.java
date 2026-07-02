package com.luck.report.web.modules.role.service.impl;

import com.luck.report.web.security.AnonymousRole;
import com.luck.report.web.security.TokenProperties;
import com.luck.report.web.modules.role.domain.entity.ReportRole;
import com.luck.report.web.modules.role.domain.vo.ReportRoleListVo;
import com.luck.report.web.modules.role.mapper.ReportRoleMapper;
import com.luck.report.web.modules.role.service.ReportRoleService;
import com.luck.report.core.provider.report.ReportFile;
import com.luck.report.core.provider.report.ReportProvider;
import com.luck.report.web.modules.role.domain.dto.RoleInfo;
import com.luck.report.web.security.service.TokenService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 角色 × 报表 绑定关系数据服务实现。
 * <p>参考 {@code modules/modelConfig/} 命名风格（{@code RoleDataServiceImpl}）。
 *
 * @author luck-report
 * @since 1.2.0
 */
@Slf4j
@Service("bean.reportRoleService")
public class ReportRoleServiceImpl implements ReportRoleService, ApplicationContextAware {

    private final ReportRoleMapper roleMapper;
    private final TokenService tokenService;
    private final TokenProperties tokenProperties;

    /** 由 {@link #setApplicationContext} 注入的 ReportProvider 列表副本。 */
    private List<ReportProvider> reportProviders = Collections.emptyList();

    public ReportRoleServiceImpl(ReportRoleMapper roleMapper,
                                 TokenService tokenService,
                                 TokenProperties tokenProperties) {
        this.roleMapper = roleMapper;
        this.tokenService = tokenService;
        this.tokenProperties = tokenProperties;
    }

    // ==================== 管理端：列表/绑定/保存/删除 ====================

    @Override
    public List<RoleInfo> listAllRoles() {
        List<RoleInfo> roles = new ArrayList<>();
        try {
            List<RoleInfo> thirdPartyRoles = tokenService.listAllRoles();
            if (thirdPartyRoles != null) {
                roles.addAll(thirdPartyRoles);
            }
        } catch (Exception e) {
            log.warn("调用 TokenService.listAllRoles() 失败: {}", e.getMessage());
        }
        // 追加内置匿名角色
        roles.add(new RoleInfo(AnonymousRole.CODE, AnonymousRole.NAME));
        return roles;
    }

    @Override
    public List<ReportRoleListVo> listBoundRoles() {
        List<String> roleCodes = roleMapper.selectDistinctRoleCodes();
        if (roleCodes == null || roleCodes.isEmpty()) {
            return Collections.emptyList();
        }

        // 角色名通过 listAllRoles() 解析（第三方角色 + 内置匿名角色）
        Map<String, String> nameMap = new HashMap<>();
        try {
            List<RoleInfo> allRoles = listAllRoles();
            if (allRoles != null) {
                for (RoleInfo r : allRoles) {
                    if (r != null && r.getCode() != null) {
                        nameMap.put(r.getCode(), r.getName());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("获取角色列表失败，按角色编码降级展示: {}", e.getMessage());
        }

        List<ReportRoleListVo> result = new ArrayList<>(roleCodes.size());
        for (String roleCode : roleCodes) {
            int hasAll = roleMapper.countAllBindingByRole(roleCode);
            // 复用：bindings 用来计算 bindingCount（不含 '*'），与 selectDistinctRoleCodes + countAllBindingByRole 一致
            int count = roleMapper.countBindingsByRole(roleCode);
            result.add(new ReportRoleListVo(roleCode, nameMap.get(roleCode), count - hasAll, hasAll > 0));
        }
        return result;
    }

    @Override
    public List<String> getFilePathsByRoleAndProvider(String roleCode, String provider) {
        if (roleCode == null || roleCode.isEmpty() || provider == null || provider.isEmpty()) {
            return Collections.emptyList();
        }
        return roleMapper.selectFilePathsByRoleAndProvider(roleCode, provider);
    }

    @Override
    public boolean hasAllBinding(String roleCode) {
        if (roleCode == null || roleCode.isEmpty()) {
            return false;
        }
        return roleMapper.countAllBindingByRole(roleCode) > 0;
    }

    /**
     * 列出某 provider 下所有非目录报表（穿梭框左侧用，**全量返回，不分页**）。
     */
    @Override
    public List<ReportFile> listAllReports(String provider) {
        ReportProvider target = findProviderByPrefix(provider);
        if (target == null) {
            return Collections.emptyList();
        }
        List<ReportFile> all = target.getReportFiles();
        if (all == null || all.isEmpty()) {
            return Collections.emptyList();
        }
        List<ReportFile> files = all.stream()
                .filter(rf -> rf != null && !rf.isDirectory())
                .collect(Collectors.toList());
        if (files.size() > TRANSFER_REPORT_LIMIT) {
            log.warn("穿梭框报表数量过大: provider={}, count={}, limit={}",
                    provider, files.size(), TRANSFER_REPORT_LIMIT);
        }
        return files;
    }

    /**
     * 替换某角色在指定 provider 下的全部绑定 + 可选 '*' 通配（穿梭框保存，物理删+插）。
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveRoleBindings(String roleCode, String roleName, String provider,
                                 List<String> filePaths, boolean hasAll, String operator) {
        if (!StringUtils.hasText(roleCode)) {
            throw new IllegalArgumentException("roleCode 不能为空");
        }
        if (!StringUtils.hasText(provider)) {
            throw new IllegalArgumentException("provider 不能为空");
        }
        // 1) 物理删除该角色在指定 provider 下的全部绑定（LIKE 'provider%'）
        roleMapper.deleteByRoleCodeAndProvider(roleCode, provider);

        // 2) 写具体 file_path（去重 + 过滤 provider 前缀以防越权）
        Set<String> seen = new HashSet<>();
        if (filePaths != null) {
            for (String fp : filePaths) {
                if (fp == null || fp.isEmpty() || "*".equals(fp)) {
                    continue;
                }
                if (!fp.startsWith(provider)) {
                    log.warn("saveRoleBindings 跳过越权路径: roleCode={}, provider={}, filePath={}",
                            roleCode, provider, fp);
                    continue;
                }
                if (seen.add(fp)) {
                    roleMapper.insert(new ReportRole(roleCode, fp));
                }
            }
        }

        // 3) hasAll 时再写一条 '*'；hasAll=false 时同时清除已有的 '*'（用户明确取消"全部报表"）
        //    注意：'*' 不带 provider 前缀，deleteByRoleCodeAndProvider 的 LIKE 'provider%' 不会命中它，必须显式删
        if (hasAll) {
            roleMapper.insert(new ReportRole(roleCode, "*"));
        } else {
            roleMapper.deleteBinding(roleCode, "*");
        }

        log.info("保存角色报表绑定: operator={}, roleCode={}, roleName={}, provider={}, fileCount={}, hasAll={}",
                operator, roleCode, roleName, provider,
                filePaths == null ? 0 : filePaths.size(), hasAll);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteByRoleCode(String roleCode) {
        if (!StringUtils.hasText(roleCode)) {
            throw new IllegalArgumentException("roleCode 不能为空");
        }
        int rows = roleMapper.deleteByRoleCode(roleCode);
        log.info("删除角色全部绑定: roleCode={}, rows={}", roleCode, rows);
    }

    // ==================== 预览鉴权 ====================

    /**
     * 预览鉴权核心：当前用户能否访问该报表（filePath 已带 provider 前缀）。
     * <ol>
     *   <li>总开关 token.enabled = false → 全部放行（dev）</li>
     *   <li>命中 admin-roles → 全部放行（管理员）</li>
     *   <li>存在 luck_report_role.file_path = '*' 且 role_code 在用户角色中 → 全部放行</li>
     *   <li>该报表绑定的 role_code 集合与用户角色有交集 → 放行</li>
     *   <li>其他 → 拒绝</li>
     * </ol>
     */
    @Override
    public boolean canPreview(HttpServletRequest request, String filePath) {
        // 2. 管理员白名单
        List<String> userRoles = tokenService.getCurrentUserRoles(request);
        if (userRoles == null || userRoles.isEmpty()) {
            return false;
        }
        List<String> admins = tokenProperties.getAdminRoles();
        if (admins != null && !admins.isEmpty()
                && userRoles.stream().anyMatch(admins::contains)) {
            return true;
        }
        // 3. '*' 通配
        List<String> allRoles = roleMapper.selectRoleCodesByFilePath("*");
        if (allRoles != null && !allRoles.isEmpty()) {
            Set<String> allSet = new HashSet<>(allRoles);
            if (userRoles.stream().anyMatch(allSet::contains)) {
                return true;
            }
        }
        // 4. 精确匹配（filePath 已带 provider 前缀，如 'file:test.ureport.xml' 或 'db:1'）
        if (filePath == null || filePath.isEmpty()) {
            return false;
        }
        List<String> boundRoles = roleMapper.selectRoleCodesByFilePath(filePath);
        if (boundRoles == null || boundRoles.isEmpty()) {
            return false;
        }
        Set<String> boundSet = new HashSet<>(boundRoles);
        return userRoles.stream().anyMatch(boundSet::contains);
    }

    // ==================== 内部辅助 ====================

    /** 根据 prefix 查找 ReportProvider。 */
    private ReportProvider findProviderByPrefix(String prefix) {
        if (prefix == null) {
            return null;
        }
        for (ReportProvider p : reportProviders) {
            if (prefix.equals(p.getPrefix())) {
                return p;
            }
        }
        return null;
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        if (!reportProviders.isEmpty()) {
            return;
        }
        List<ReportProvider> beans = new ArrayList<>();
        for (ReportProvider provider : applicationContext.getBeansOfType(ReportProvider.class).values()) {
            if (provider.disabled()) {
                continue;
            }
            beans.add(provider);
        }
        this.reportProviders = Collections.unmodifiableList(beans);
        log.info("RoleDataServiceImpl 初始化完成,共加载 {} 个报表来源", reportProviders.size());
    }
}
