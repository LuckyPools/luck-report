package com.luck.report.web.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 标记接口 / 类为匿名访问（无需 token 校验）。
 * <p>当 {@code luck-report.token.enabled=true} 时，标了此注解的接口直接放行。
 *
 * @author luck-report
 * @since 1.0.0
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface Anonymous {
}
