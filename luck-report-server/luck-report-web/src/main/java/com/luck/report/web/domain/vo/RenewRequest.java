package com.luck.report.web.domain.vo;

/**
 * Token 续期请求参数。
 *
 * @author luck-report
 * @since 1.0.0
 */
public class RenewRequest {

    /**
     * 原令牌值。
     */
    public String oldToken;

    /**
     * 续期后的有效期（秒），不传则使用默认值。
     */
    public long ttlSeconds;
}
