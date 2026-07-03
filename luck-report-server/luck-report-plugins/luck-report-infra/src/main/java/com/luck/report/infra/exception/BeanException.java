package com.luck.report.infra.exception;

/**
 * bean异常。
 * <p>由拦截器（ManageInterceptor/PreviewInterceptor）抛出，表示用户无权限访问资源（403 Forbidden）。
 * <p>由 {@code ReportExceptionHandler} 统一转 403 响应。
 *
 * @author luck-report
 * @since 1.0.0
 */
public class BeanException extends RuntimeException {

    public BeanException(String message) {
        super(message);
    }

    public BeanException(String message, Throwable cause) {
        super(message, cause);
    }
}
