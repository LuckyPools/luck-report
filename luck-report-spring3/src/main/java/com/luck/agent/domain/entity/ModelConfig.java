package com.luck.agent.domain.entity;

import com.luck.agent.domain.enums.ModelType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 大模型配置实体
 * 存储大模型的连接信息和调用参数，后期会提供管理界面维护
 * 当前从内存缓存中读取，默认返回千问的配置
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ModelConfig {

    /** 配置ID */
    private Integer id;

    /** 厂商标识（如 alibaba、openai），方便前端展示回显 */
    private String provider;

    /** API 基础地址（如 https://dashscope.aliyuncs.com/compatible-mode/v1） */
    private String baseUrl;

    /** API 密钥 */
    private String apiKey;

    /** 模型名称（如 qwen3.6-plus、text-embedding-v3） */
    private String modelName;

    /** 自定义名称，最多50个字 */
    private String configName;

    /** 排序字段，数字越小越靠前 */
    private Integer sort;

    /** 温度参数，控制生成随机性，0~1 */
    private Double temperature;

    /** 是否激活：true-当前使用，false-未使用 */
    private Boolean isActive;

    /** 最大 token 数 */
    private Integer maxTokens;

    /** 模型类型：CHAT-对话模型，EMBEDDING-嵌入模型 */
    private ModelType modelType;

    /** Chat Completions 路径（如 /chat/completions） */
    private String completionsPath;

    /** Embeddings 路径（如 /embeddings） */
    private String embeddingsPath;

    /** 创建时间 */
    private LocalDateTime createdTime;

    /** 更新时间 */
    private LocalDateTime updatedTime;

    /** 是否删除：0-未删除，1-已删除 */
    private Integer isDeleted;

    /** 是否启用代理：false-禁用，true-启用 */
    private Boolean proxyEnabled;

    /** 代理主机地址 */
    private String proxyHost;

    /** 代理端口 */
    private Integer proxyPort;

    /** 代理用户名（可选） */
    private String proxyUsername;

    /** 代理密码（可选） */
    private String proxyPassword;
}
