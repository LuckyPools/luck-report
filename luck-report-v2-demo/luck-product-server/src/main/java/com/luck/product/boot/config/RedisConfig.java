package com.luck.product.boot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis 配置类，用于配置 RedisTemplate
 *
 * @author luckyPools
 * @since 2017年3月8日
 */
@Configuration
public class RedisConfig {

    /**
     * 配置 RedisTemplate Bean。
     * 设置 Key 使用 String 序列化器，Value 使用 JSON 序列化器
     *
     * @param connectionFactory Redis 连接工厂，由 Spring Boot 自动注入
     * @return 配置好的 RedisTemplate 实例
     */
    @Bean("remoteRedisTemplate")
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
}
