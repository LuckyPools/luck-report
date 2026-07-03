package com.luck.report.infra.modules.vector.config;

import com.luck.report.infra.modules.vector.service.VectorStore;
import com.luck.report.infra.modules.vector.service.impl.EmptyVectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfigureAfter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;

/**
 * 空向量存储自动配置（兜底配置）
 * 当没有其他 VectorStore Bean 时，自动创建 EmptyVectorStore 实现
 * 确保项目在没有向量数据库配置时也能正常启动
 *
 * 使用 @AutoConfigureAfter 明确指定在 Chroma 和 PostgreSQL 配置之后才评估条件
 *
 * 条件装配优先级：
 * 1. ChromaVectorStoreAutoConfiguration：luck-report.vector.type=chroma 时生效
 * 2. PgVectorStoreAutoConfiguration：luck-report.vector.type=postgresql 且 datasource.url 配置时生效
 * 3. EmptyVectorStoreAutoConfiguration：上述两者都不生效时兜底（最后加载）
 *
 * @author luck
 */
@Configuration
@Conditional(EmptyVectorCondition.class)
public class EmptyVectorStoreAutoConfiguration {

    /**
     * 注册空向量存储实现 Bean（兜底）
     * 当没有其他 VectorStore Bean 时创建，保证注入点不报错
     *
     * @return EmptyVectorStore 实例
     */
    @Bean
    @ConditionalOnMissingBean(VectorStore.class)
    public VectorStore emptyVectorStore() {
        return new EmptyVectorStore();
    }
}
