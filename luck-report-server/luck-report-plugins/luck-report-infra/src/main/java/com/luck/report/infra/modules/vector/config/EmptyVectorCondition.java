package com.luck.report.infra.modules.vector.config;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

public class EmptyVectorCondition implements Condition {
    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        // 获取配置值
        String vectorType = context.getEnvironment().getProperty("luck-report.vector.type");
        // 规则：null 或 空白字符串 → 加载当前配置；有具体值(chroma/milvus) → 不加载
        return !StringUtils.hasText(vectorType);
    }
}
