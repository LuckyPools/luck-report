package com.luck.report.web.security;

/**
 * 报表访问 Token 上下文。
 * <p>基于 ThreadLocal 存放当前请求的 claims，拦截器在校验通过后写入，业务代码按需读取。
 * <p>由 {@code TokenInterceptor} 在请求开始时 set，请求结束时（{@code afterCompletion}）clear，
 * 避免 ThreadLocal 内存泄漏。
 *
 * @author luck-report
 * @since 1.0.0
 */
public final class TokenContext {

    private static final ThreadLocal<java.util.Map<String, Object>> HOLDER = new ThreadLocal<>();

    private TokenContext() {
    }

    /**
     * 写入当前请求的 claims。
     */
    public static void set(java.util.Map<String, Object> claims) {
        HOLDER.set(claims);
    }

    /**
     * 读取当前请求的 claims；未登录或未校验通过返回 {@code null}。
     */
    @SuppressWarnings("unchecked")
    public static java.util.Map<String, Object> get() {
        return HOLDER.get();
    }

    /**
     * 读取当前请求的某个 claim 值。
     *
     * @param key claim 名称
     * @return claim 值；不存在返回 {@code null}
     */
    public static Object getClaim(String key) {
        java.util.Map<String, Object> claims = HOLDER.get();
        return claims == null ? null : claims.get(key);
    }

    /**
     * 请求结束时清理，避免 ThreadLocal 内存泄漏。
     */
    public static void clear() {
        HOLDER.remove();
    }
}
