package com.luck.report.web.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 标记接口需要特定 scope 才能访问。
 * <p>scope 取值：{@code designer} / {@code preview} / {@code export}。
 * <p>{@code designer} scope 隐含拥有 {@code preview} 权限（见 {@code TokenInterceptor} 校验逻辑）。
 *
 * @author luck-report
 * @since 1.0.0
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireScope {

    /**
     * 需要的 scope 值。
     */
    String value();
}
