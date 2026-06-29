package com.luck.report.web.domain.vo.request;

import java.util.List;

/**
 * Token 申请请求参数。
 *
 * @author luck-report
 * @since 1.0.0
 */
public class ApplyRequest {

    /**
     * 令牌主体标识，通常为用户ID或系统标识。
     */
    private String subject;

    /**
     * 权限范围，如 read、write 等。
     */
    private String scope;

    /**
     * 可访问的报表ID列表。
     */
    private List<String> reports;

    /**
     * 租户ID。
     */
    private String tenantId;

    /**
     * 令牌有效期（秒），不传则使用默认值。
     */
    private long ttlSeconds;

    public ApplyRequest() {
    }

    public ApplyRequest(String subject, String scope, List<String> reports, String tenantId, long ttlSeconds) {
        this.subject = subject;
        this.scope = scope;
        this.reports = reports;
        this.tenantId = tenantId;
        this.ttlSeconds = ttlSeconds;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public List<String> getReports() {
        return reports;
    }

    public void setReports(List<String> reports) {
        this.reports = reports;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public long getTtlSeconds() {
        return ttlSeconds;
    }

    public void setTtlSeconds(long ttlSeconds) {
        this.ttlSeconds = ttlSeconds;
    }
}
