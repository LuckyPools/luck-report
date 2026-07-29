package com.luck.report.redis.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.luck.report.redis.cache.RedisCache;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.AutoConfigureAfter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import com.luck.report.infra.modules.cache.service.ReportCache;

/**
 * Redis 缓存自动配置类。
 * 第三方项目引入 luck-report-redis 依赖后，自动装配 RedisTemplate 与 RedisCache Bean，
 * 实现 ReportCache 接口的分布式缓存能力。配合 luck-report.disableLocalReportCache=true 禁用本地缓存后生效。
 *
 * 使用 name 字符串引用替代 class 引用，兼容 Spring Boot 2/3/4
 * （Boot 4 将 RedisAutoConfiguration 从 org.springframework.boot.autoconfigure.data.redis
 * 迁移到了 org.springframework.boot.data.redis.autoconfigure）
 *
 * @author luckyPools
 * @since 2017年3月8日
 */
@Configuration
@ConditionalOnClass(name = "org.springframework.data.redis.core.RedisTemplate")
@AutoConfigureAfter(name = {
        "org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration",    // Boot 2/3
        "org.springframework.boot.data.redis.autoconfigure.RedisAutoConfiguration"     // Boot 4
})
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

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        objectMapper.activateDefaultTyping(objectMapper.getPolymorphicTypeValidator(), ObjectMapper.DefaultTyping.NON_FINAL, JsonTypeInfo.As.PROPERTY);
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(objectMapper);

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
