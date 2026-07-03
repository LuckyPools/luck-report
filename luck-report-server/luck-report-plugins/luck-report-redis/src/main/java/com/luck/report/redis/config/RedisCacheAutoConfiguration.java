package com.luck.report.redis.config;

import com.luck.report.infra.modules.cache.service.ReportCache;
import com.luck.report.redis.cache.RedisCache;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.AutoConfigureAfter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis 缓存自动配置类。
 * 第三方项目引入 luck-report-redis 依赖后，自动装配 RedisTemplate 与 RedisCache Bean，
 * 实现 ReportCache 接口的分布式缓存能力。配合 luck-report.disableLocalReportCache=true 禁用本地缓存后生效。
 *
 * @author luckyPools
 * @since 2017年3月8日
 */
@Configuration
@ConditionalOnClass(RedisTemplate.class)
@AutoConfigureAfter(RedisAutoConfiguration.class)
public class RedisCacheAutoConfiguration {

    /**
     * 配置 RedisTemplate Bean。
     * Key 使用 String 序列化器，Value 使用 JSON 序列化器，保证缓存值可读性与类型还原。
     *
     * @param connectionFactory Redis 连接工厂，由 Spring Boot RedisAutoConfiguration 自动注入，不能为空
     * @return 配置好的 RedisTemplate 实例
     */
    @Bean("remoteRedisTemplate")
    @ConditionalOnMissingBean(name = "remoteRedisTemplate")
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer();

        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }

    /**
     * 配置 RedisCache Bean，实现 ReportCache 接口。
     * 由 CacheUtils 在运行时选取首个非 disabled 的 ReportCache 实例。
     *
     * @param redisTemplate Redis 操作模板，通过 @Qualifier 指定使用 remoteRedisTemplate，不能为空
     * @return RedisCache 实例
     */
    @Bean("bean.redisCache")
    @ConditionalOnMissingBean(name = "bean.redisCache")
    public ReportCache redisCache(@Qualifier("remoteRedisTemplate") RedisTemplate<String, Object> redisTemplate) {
        return new RedisCache(redisTemplate);
    }
}
