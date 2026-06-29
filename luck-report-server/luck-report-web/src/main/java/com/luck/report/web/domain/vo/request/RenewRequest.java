package com.luck.report.web.domain.vo.request;

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
    private String oldToken;

    /**
     * 续期后的有效期（秒），不传则使用默认值。
     */
    private long ttlSeconds;

    public RenewRequest() {
    }

    public RenewRequest(String oldToken, long ttlSeconds) {
        this.oldToken = oldToken;
        this.ttlSeconds = ttlSeconds;
    }

    public String getOldToken() {
        return oldToken;
    }

    public void setOldToken(String oldToken) {
        this.oldToken = oldToken;
    }

    public long getTtlSeconds() {
        return ttlSeconds;
    }

    public void setTtlSeconds(long ttlSeconds) {
        this.ttlSeconds = ttlSeconds;
    }
}
