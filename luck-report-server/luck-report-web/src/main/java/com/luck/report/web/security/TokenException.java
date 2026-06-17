package com.luck.report.web.security;

/**
 * 报表访问 Token 鉴权失败异常。
 * <p>由 {@code TokenInterceptor} 抛出，由 {@code TokenExceptionHandler} 统一转 401 响应。
 *
 * @author luck-report
 * @since 1.0.0
 */
public class TokenException extends RuntimeException {

    public TokenException(String message) {
        super(message);
    }

    public TokenException(String message, Throwable cause) {
        super(message, cause);
    }
}
