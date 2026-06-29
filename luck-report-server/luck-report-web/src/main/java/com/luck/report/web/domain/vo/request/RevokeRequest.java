package com.luck.report.web.domain.vo.request;

/**
 * Token 吊销请求参数。
 *
 * @author luck-report
 * @since 1.0.0
 */
public class RevokeRequest {

    /**
     * 需要吊销的令牌值。
     */
    private String token;

    public RevokeRequest() {
    }

    public RevokeRequest(String token) {
        this.token = token;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
