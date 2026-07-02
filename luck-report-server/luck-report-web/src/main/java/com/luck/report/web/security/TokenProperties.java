package com.luck.report.web.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * 报表 Token 配置项。
 * <p>前缀：{@code luck-report.token}。
 * <p>注意：secret、ttl-seconds、clock-skew-seconds 已移除，由第三方 TokenService 实现自行管理。
 *
 * @author luck-report
 * @since 1.0.0
 */
@ConfigurationProperties(prefix = "luck-report.token")
public class TokenProperties {

    /**
     * 总开关：true 走完整校验链；false 拦截器直接放行。
     * <p>dev 环境默认 false（前端 ui3 调试零摩擦）；prod 环境必须 true。
     */
    private boolean enabled = false;

    /**
     * token header 名称。
     * <p>默认 X-Access-Token，与 JimuReport 兼容。
     */
    private String headerName = "X-Access-Token";

    /**
     * 是否允许 URL 上传 token（用于 iframe 首次 GET 请求）。
     */
    private boolean allowQueryToken = true;

    /**
     * 报表管理员角色白名单（第三方系统角色编码）。
     * <p>配置示例：admin-roles: ROLE_ADMIN,ROLE_FINANCE
     * <p>命中任一角色的用户可访问 /ureport/designer、角色报表管理 API。
     */
    private List<String> adminRoles = new ArrayList<>();

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getHeaderName() {
        return headerName;
    }

    public void setHeaderName(String headerName) {
        this.headerName = headerName;
    }

    public boolean isAllowQueryToken() {
        return allowQueryToken;
    }

    public void setAllowQueryToken(boolean allowQueryToken) {
        this.allowQueryToken = allowQueryToken;
    }

    public List<String> getAdminRoles() {
        return adminRoles;
    }

    public void setAdminRoles(List<String> adminRoles) {
        this.adminRoles = adminRoles;
    }
}
