package com.luck.report.web.domain.vo;

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
    public String subject;

    /**
     * 权限范围，如 read、write 等。
     */
    public String scope;

    /**
     * 可访问的报表ID列表。
     */
    public List<String> reports;

    /**
     * 租户ID。
     */
    public String tenantId;

    /**
     * 令牌有效期（秒），不传则使用默认值。
     */
    public long ttlSeconds;
}
