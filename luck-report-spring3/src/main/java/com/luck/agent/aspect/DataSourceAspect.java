package com.luck.agent.aspect;

import com.luck.agent.annotation.DataSource;
import com.luck.agent.config.DataSourceContextHolder;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

/**
 * 数据源切换切面
 * 拦截标注了 @DataSource 注解的方法，在方法执行前切换数据源，执行后自动清理
 * 优先级设为最高（@Order(1)），确保在事务切面之前执行
 *
 * 查找顺序：方法注解 → 类注解 → 默认主数据源（不切换）
 *
 * @author luck
 */
@Aspect
@Component
@Order(1)
public class DataSourceAspect {

    /**
     * 环绕通知：拦截 @DataSource 注解，切换数据源
     *
     * @param pjp 切点
     * @param ds  数据源注解（从方法或类级别获取）
     * @return 方法执行结果
     * @throws Throwable 方法执行异常
     */
    @Around("@annotation(ds) || @within(ds)")
    public Object around(ProceedingJoinPoint pjp, DataSource ds) throws Throwable {
        DataSource methodDs = getMethodAnnotation(pjp);
        String dataSourceKey;
        if (methodDs != null) {
            dataSourceKey = methodDs.value();
        } else if (ds != null) {
            dataSourceKey = ds.value();
        } else {
            dataSourceKey = DataSourceContextHolder.DEFAULT;
        }

        // 空字符串表示使用默认主数据源，无需切换
        if (dataSourceKey == null || dataSourceKey.isEmpty()) {
            dataSourceKey = DataSourceContextHolder.DEFAULT;
        }

        try {
            DataSourceContextHolder.set(dataSourceKey);
            return pjp.proceed();
        } finally {
            DataSourceContextHolder.clear();
        }
    }

    /**
     * 获取方法级别的 @DataSource 注解
     *
     * @param pjp 切点
     * @return 方法上的 @DataSource 注解，不存在返回 null
     */
    private DataSource getMethodAnnotation(ProceedingJoinPoint pjp) {
        MethodSignature signature = (MethodSignature) pjp.getSignature();
        Method method = signature.getMethod();
        return method.getAnnotation(DataSource.class);
    }
}
