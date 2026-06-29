package com.luck.report.web.domain.vo.request;

/**
 * Token 解析请求参数。
 *
 * @author luck-report
 * @since 1.0.0
 */
public class IntrospectRequest {

    /**
     * 需要解析的令牌值。
     */
    private String token;

    public IntrospectRequest() {
    }

    public IntrospectRequest(String token) {
        this.token = token;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
