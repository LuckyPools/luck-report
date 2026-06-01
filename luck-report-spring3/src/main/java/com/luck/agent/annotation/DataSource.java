package com.luck.agent.annotation;

import java.lang.annotation.*;

/**
 * 数据源切换注解
 * 标注在 Mapper 接口的方法或类上，指定该方法/类使用的数据源
 * 配合 DataSourceAspect 在方法执行前切换数据源，执行后自动清理
 *
 * 使用示例：
 * 不标注或 @DataSource()        → 使用 Spring Boot 默认主数据源
 * @DataSource("pgvector")      → 使用 PostgreSQL 向量存储数据源
 *
 * @author luck
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DataSource {

    /**
     * 数据源标识
     * 对应 DataSourceContextHolder 中定义的常量
     * 默认为空，表示使用 Spring Boot 自动装配的主数据源
     *
     * @return 数据源标识字符串
     */
    String value() default "";
}
